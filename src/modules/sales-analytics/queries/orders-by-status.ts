import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";
import type { ResolvedRange } from "@/lib/time-range";

export type OrdersByStatusResult = {
  counts: Record<OrderStatus, number>;
};

/**
 * Count orders by status for a seller within a date range.
 * Includes ALL 5 statuses (not just qualifying).
 */
export async function getOrdersByStatus(
  sellerId: string,
  range: ResolvedRange,
): Promise<OrdersByStatusResult> {
  const groups = await db.order.groupBy({
    by: ["status"],
    where: {
      sellerId,
      createdAt: { gte: range.from, lte: range.to },
    },
    _count: true,
  });

  const counts: Record<string, number> = {
    ORDERED: 0,
    PAID: 0,
    PACKING: 0,
    SHIPPED: 0,
    CANCELLED: 0,
  };

  for (const row of groups) {
    counts[row.status] = row._count;
  }

  return { counts: counts as Record<OrderStatus, number> };
}
