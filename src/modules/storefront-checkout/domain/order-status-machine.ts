import { OrderStatus } from "@prisma/client";

/**
 * Order status state machine — single source of truth for allowed transitions.
 *
 * Forward chain: ORDERED → PAID → PACKING → SHIPPED (terminal)
 * Cancel: {ORDERED, PAID, PACKING} → CANCELLED (terminal)
 *
 * See US-008 AC#2, US-009 AC#1-#2, and PBT Property P2.
 */

/** Maps each non-terminal status to its next forward status. Null means no forward transition allowed. */
export const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  ORDERED: OrderStatus.PAID,
  PAID: OrderStatus.PACKING,
  PACKING: OrderStatus.SHIPPED,
  SHIPPED: null,
  CANCELLED: null,
};

/** Set of statuses from which an order can be cancelled. */
export const CANCELLABLE_STATUSES = new Set<OrderStatus>([
  OrderStatus.ORDERED,
  OrderStatus.PAID,
  OrderStatus.PACKING,
]);

/** Terminal statuses — no transitions allowed from these. */
export const TERMINAL_STATUSES = new Set<OrderStatus>([
  OrderStatus.SHIPPED,
  OrderStatus.CANCELLED,
]);

/**
 * Check if a forward transition is valid from the given status.
 */
export function canAdvance(status: OrderStatus): boolean {
  return FORWARD_TRANSITIONS[status] !== null;
}

/**
 * Get the next status in the forward chain, or null if already terminal.
 */
export function getNextStatus(status: OrderStatus): OrderStatus | null {
  return FORWARD_TRANSITIONS[status];
}

/**
 * Check if an order in the given status can be cancelled.
 */
export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.has(status);
}
