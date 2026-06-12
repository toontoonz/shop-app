import { db } from "@/lib/db";
import { QUALIFYING_STATUSES } from "../domain/analytics-criteria";
import type { ResolvedRange } from "@/lib/time-range";

export type TopProductRow = {
  rank: number;
  productId: string;
  productName: string;
  quantity: number;
  revenueSatang: number;
};

/**
 * Get top 5 products for a seller by quantity sold within the given range.
 * Only counts OrderItems from qualifying orders (status ∈ QUALIFYING_STATUSES).
 */
export async function getTopProducts(
  sellerId: string,
  range: ResolvedRange,
): Promise<TopProductRow[]> {
  // Get qualifying orders for this seller in range
  const orders = await db.order.findMany({
    where: {
      sellerId,
      createdAt: { gte: range.from, lte: range.to },
      status: { in: QUALIFYING_STATUSES },
    },
    select: { id: true },
  });

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);

  // Aggregate by productId
  const groups = await db.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds } },
    _sum: { quantity: true, unitPriceSatang: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  if (groups.length === 0) return [];

  // Fetch product names
  const productIds = groups.map((g) => g.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  // Compute revenue per product more accurately
  const itemsByProduct = await db.orderItem.findMany({
    where: { orderId: { in: orderIds }, productId: { in: productIds } },
    select: { productId: true, quantity: true, unitPriceSatang: true },
  });

  const revenueMap = new Map<string, number>();
  for (const item of itemsByProduct) {
    revenueMap.set(
      item.productId,
      (revenueMap.get(item.productId) ?? 0) + item.unitPriceSatang * item.quantity,
    );
  }

  return groups.map((g, idx) => ({
    rank: idx + 1,
    productId: g.productId,
    productName: productMap.get(g.productId) ?? "Unknown",
    quantity: g._sum.quantity ?? 0,
    revenueSatang: revenueMap.get(g.productId) ?? 0,
  }));
}
