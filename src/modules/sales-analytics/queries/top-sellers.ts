import { db } from "@/lib/db";
import { QUALIFYING_STATUSES } from "../domain/analytics-criteria";
import type { ResolvedRange } from "@/lib/time-range";

export type TopSellerRow = {
  rank: number;
  sellerId: string;
  sellerName: string;
  revenueSatang: number;
  isCurrentSeller: boolean;
};

/**
 * Get top 10 sellers by revenue across the entire marketplace for the given range.
 * Revenue = sum of totalSatang where status ∈ QUALIFYING_STATUSES.
 */
export async function getTopSellers(
  currentSellerId: string,
  range: ResolvedRange,
): Promise<TopSellerRow[]> {
  // Aggregate revenue per seller
  const groups = await db.order.groupBy({
    by: ["sellerId"],
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: QUALIFYING_STATUSES },
    },
    _sum: { totalSatang: true },
    orderBy: { _sum: { totalSatang: "desc" } },
    take: 10,
  });

  if (groups.length === 0) return [];

  // Fetch seller names
  const sellerIds = groups.map((g) => g.sellerId);
  const sellers = await db.seller.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, displayName: true },
  });
  const sellerMap = new Map(sellers.map((s) => [s.id, s.displayName]));

  return groups.map((g, idx) => ({
    rank: idx + 1,
    sellerId: g.sellerId,
    sellerName: sellerMap.get(g.sellerId) ?? "Unknown",
    revenueSatang: g._sum.totalSatang ?? 0,
    isCurrentSeller: g.sellerId === currentSellerId,
  }));
}
