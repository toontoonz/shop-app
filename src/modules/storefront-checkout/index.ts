// Public barrel for the storefront-checkout module.
//
// NOTE: Cart service uses `next/headers` (server-only) so it's NOT re-exported here.
// Import cart functions directly: import { ... } from "@/modules/storefront-checkout/services/cart"
// This barrel only exports domain + repository code that's safe for all contexts.

export { submitCheckout, type CheckoutInput, type CreatedOrder } from "./services/checkout";
export { OrderRepository, type OrderWithItems, type OrderFilters } from "./repositories/order";
export { Order } from "./domain/order";
export {
  FORWARD_TRANSITIONS,
  CANCELLABLE_STATUSES,
  TERMINAL_STATUSES,
  canAdvance,
  getNextStatus,
  canCancel,
} from "./domain/order-status-machine";

// Cart types only (no runtime import of next/headers)
export type { CartLine, ResolvedCart, ResolvedCartLine } from "./services/cart";
export { computeCartTotal } from "./services/cart-utils";
