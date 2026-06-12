// Public barrel for the order-fulfillment module.
//
// Only data-access exports here. UI components are imported directly
// from `./ui/` within server pages (same-module) or via explicit exceptions
// in the ESLint config.

export { OrderStatusEventRepository } from "./repositories/order-status-event";
