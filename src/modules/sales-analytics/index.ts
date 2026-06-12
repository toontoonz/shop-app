// Public barrel for the sales-analytics module.

export { QUALIFYING_STATUSES, computeRevenue } from "./domain/analytics-criteria";
export { getSalesOverTime, type SalesOverTimeResult, type SalesPoint } from "./queries/sales";
export { getOrdersByStatus, type OrdersByStatusResult } from "./queries/orders-by-status";
export { getTopSellers, type TopSellerRow } from "./queries/top-sellers";
export { getTopProducts, type TopProductRow } from "./queries/top-products";
