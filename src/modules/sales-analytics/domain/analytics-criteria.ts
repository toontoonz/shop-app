import { OrderStatus } from "@prisma/client";

/**
 * Single source of truth for which order statuses qualify for revenue calculations.
 * Used by all analytics queries — sales-over-time, top-sellers, top-products.
 *
 * Revenue includes orders that have been PAID or beyond (packing, shipped).
 * Excludes: ORDERED (not yet paid), CANCELLED.
 *
 * See US-010 AC#4, US-011 AC#2, US-012 AC#2, PBT Property P3.
 */
export const QUALIFYING_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PACKING,
  OrderStatus.SHIPPED,
];

/**
 * Compute revenue from a list of orders (or order-like objects).
 * Only includes orders whose status is in QUALIFYING_STATUSES.
 */
export function computeRevenue(
  orders: Array<{ totalSatang: number; status: OrderStatus }>,
): number {
  const qualifyingSet = new Set(QUALIFYING_STATUSES);
  return orders
    .filter((o) => qualifyingSet.has(o.status))
    .reduce((sum, o) => sum + o.totalSatang, 0);
}
