# Units of Work

## Summary
- **Units**: 4 units — `seller-account-catalog`, `storefront-checkout`, `order-fulfillment`, `sales-analytics`
- **Strategy**: Domain-Driven
- **Architecture**: Modular Monolith (single deployment, internal module boundaries, direct method calls)
- **Story Distribution**: seller-account-catalog: 2, storefront-checkout: 4, order-fulfillment: 3, sales-analytics: 3
- **Key Dependencies**: storefront-checkout → seller-account-catalog (Product, Seller); order-fulfillment → storefront-checkout (Order), seller-account-catalog (Seller); sales-analytics → all three (read-only)
- **Development Sequence**: Phase 1: seller-account-catalog → Phase 2: storefront-checkout → Phase 3: order-fulfillment → Phase 4: sales-analytics

## Overview
Feature decomposed into 4 units along business-domain boundaries to enable phased delivery and clear ownership. Each unit is a full-stack vertical slice (frontend + backend + data), with the entire system deployed as a single application (Modular Monolith). Units communicate through typed service interfaces — no in-process events, no inter-service HTTP — keeping the architecture light enough for a solo developer working through a 1-2 month MVP.

**Strategy**: Domain-Driven
**Rationale**: The five functional areas in requirements map cleanly onto business domains (seller workspace, buyer storefront, order operations, analytics). Authentication has a single story and is naturally co-located with the seller's catalog management since both are seller-side foundational concerns. Order Management and Analytics are kept separate because their lifecycles diverge: Order Management is operational (state transitions), Analytics is read-only aggregation.

---

## Unit 1: seller-account-catalog

**Purpose**: Provides seller authentication (login/logout) and full CRUD over a seller's own products. Foundational unit — every other unit depends on Seller and Product entities owned here.
**Priority**: High
**Complexity**: Low
**Stories**: 2 stories — US-001 (Seller logs in/out), US-002 (Seller manages own products)

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| Login | Authenticate seller, create session | Seller |
| Logout | Invalidate session | Seller |
| CreateProduct | Create a product owned by the authenticated seller | Seller |
| UpdateProduct | Update fields of an owned product | Seller |
| DeleteProduct | Remove an owned product from the active catalog | Seller |

### Domain Model
**Aggregates**:
- `Seller` (root: Seller) — identity + credentials. Account creation is out of scope (admin-issued).
- `Product` (root: Product) — owned by a Seller. Has stock, price, and active/deleted state. Soft-delete preserves references from historical orders.

**Entities**: Seller, Product
**Value Objects**: Money (price), Stock (non-negative integer), HashedPassword, ProductImage (URL/path)

### Domain Events
**Publishes**: None (Modular Monolith — no in-process events per D2-4; consumers query directly).
**Subscribes**: None.

### Public Service Interfaces (consumed by other units)
- `SellerAuthService` — `getCurrentSeller(session)`, `requireAuthenticated(req)`
- `SellerRepository` — `findById(sellerId)`, `findAll()`, `findByUsername(username)`
- `ProductRepository` — `findActiveById(productId)`, `findActiveAll()`, `findActiveBySellerId(sellerId)`, `decrementStock(productId, qty)`, `incrementStock(productId, qty)`

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| (none) | — | Foundational unit; no inbound dependencies |

---

## Unit 2: storefront-checkout

**Purpose**: Public buyer-facing storefront with product browsing, cart, buyer-info collection, mock payment selection, and order placement. Owns the `Cart` and `Order` aggregates. The Order entity is born here at checkout; its lifecycle (status transitions) is owned by Unit 3.
**Priority**: High
**Complexity**: Medium
**Stories**: 4 stories — US-003 (Browse storefront), US-004 (Cart), US-005 (Info + payment method), US-006 (Place order + confirmation)

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| AddToCart | Add a product to the session-scoped cart | Buyer |
| UpdateCartQuantity | Change line quantity (clamped to stock) | Buyer |
| RemoveFromCart | Remove a line from the cart | Buyer |
| SubmitCheckout | Validate buyer info + payment method, atomically decrement stock, create one Order per Seller, clear cart | Buyer |

### Domain Model
**Aggregates**:
- `Cart` (root: Cart, session-scoped) — transient, holds CartLine items keyed by productId.
- `Order` (root: Order) — immutable line items captured at order time, snapshots `unitPriceAtOrder` and `productNameAtOrder` so historical orders survive product edits/deletes. Has a `status` field but transitions are managed by Unit 3.

**Entities**: Cart, CartLine, Order, OrderItem
**Value Objects**: Money, Quantity, PaymentMethod (enum: BANK_TRANSFER | COD | E_WALLET | CREDIT_CARD), BuyerInfo (name, phone, optional email), OrderStatus (enum: ordered | paid | packing | shipped | cancelled)

### Domain Events
**Publishes**: None.
**Subscribes**: None.

### Public Service Interfaces (consumed by other units)
- `OrderRepository` — `findById(orderId)`, `findBySellerId(sellerId, filters)`, `findByDateRange(from, to, statusFilter?)`, `updateStatus(orderId, newStatus, actorSellerId)`
- `Order` (aggregate) exposes domain methods: `advanceStatus(actorSellerId)`, `cancel(actorSellerId)` — used by Unit 3

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| `seller-account-catalog` | API (data + service) | Reads Product (price, stock, name, sellerId) and Seller (name for storefront display) via repositories. Calls `decrementStock` / `incrementStock` atomically during SubmitCheckout. |

### Stock Decrement Note
SubmitCheckout opens a transaction → re-validates stock per line → calls `ProductRepository.decrementStock` for each line → creates Order rows. If any decrement fails (insufficient stock), the entire transaction rolls back and the buyer sees an error. This satisfies US-006 atomicity.

---

## Unit 3: order-fulfillment

**Purpose**: Seller-side order management — list filtered by status, advance order status forward through the four-stage workflow, cancel non-shipped orders (restoring stock). Owns the Order *lifecycle* (state machine), but consumes the Order aggregate from Unit 2.
**Priority**: High
**Complexity**: Medium
**Stories**: 3 stories — US-007 (View orders by status), US-008 (Advance status forward), US-009 (Cancel order)

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| ListOrdersBySeller | Query orders for the authenticated seller, optionally filtered by status | Seller |
| AdvanceOrderStatus | Move order to next status in chain (ordered → paid → packing → shipped) | Seller |
| CancelOrder | Move order to "cancelled" terminal status; restore stock to each line item's product | Seller |

### Domain Model
**Aggregates**: None of its own — operates on the `Order` aggregate owned by Unit 2.
**Entities**: OrderStatusEvent (audit log: orderId, fromStatus, toStatus, actorSellerId, timestamp) — this is owned by Unit 3.
**Value Objects**: OrderStatusTransition (defines the valid forward chain).

### Domain Events
**Publishes**: None.
**Subscribes**: None.

### Public Service Interfaces (consumed by other units)
- `OrderStatusEventRepository` — `findByOrderId(orderId)` (used by Unit 4 for time-on-status analytics if needed; otherwise internal)

### Authorization Rule
Every command in this unit MUST verify the authenticated seller is the seller of the target order, AND that the order's current status permits the requested transition. Both checks are enforced at the service layer.

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| `storefront-checkout` | API (aggregate access) | Calls `OrderRepository.findBySellerId`, `Order.advanceStatus`, `Order.cancel`. Stock restoration on cancel is delegated to the Order aggregate which calls `ProductRepository.incrementStock` (Unit 1). |
| `seller-account-catalog` | API (auth) | Uses `SellerAuthService` to authenticate and authorize requests. Uses `ProductRepository.incrementStock` (transitively, via Order.cancel). |

---

## Unit 4: sales-analytics

**Purpose**: Read-only aggregation views for sellers — sales charts, top-seller leaderboard, top-selling products, all filterable by preset time ranges. Has no aggregates of its own; only query handlers and projections.
**Priority**: Medium
**Complexity**: Medium (chart computations + time-range filtering)
**Stories**: 3 stories — US-010 (Sales/order charts), US-011 (Top-seller leaderboard), US-012 (Top-selling products)

### Commands
| Command | Description | Actor |
|---------|-------------|-------|
| GetSalesOverTime | Aggregate revenue per day or per month for selected range, restricted to current seller | Seller |
| GetOrdersByStatus | Count orders by status within range, restricted to current seller | Seller |
| GetTopSellerLeaderboard | Aggregate revenue per seller across the marketplace within range; rank top 10 | Seller |
| GetTopProducts | Aggregate quantity sold per product for current seller within range; rank top 5 | Seller |

### Domain Model
**Aggregates**: None.
**Entities**: None of its own. Uses `Order`, `Product`, `Seller` as read models.
**Value Objects**: TimeRange (preset enum: TODAY | LAST_7D | LAST_30D | THIS_MONTH | THIS_YEAR), AnalyticsRow (rank, label, value).

### Revenue Definition (locked across all queries)
Revenue counts ONLY orders whose current status is one of `{paid, packing, shipped}`. Excludes `ordered` (awaiting payment) and `cancelled`. This rule lives in a single internal helper (`AnalyticsCriteria.revenueStatuses`) and is reused across all query handlers to guarantee consistency.

### Domain Events
**Publishes**: None.
**Subscribes**: None.

### Public Service Interfaces
None — Unit 4 is leaf-level (no other unit depends on it).

### Dependencies
| Depends On | Type | Description |
|------------|------|-------------|
| `storefront-checkout` | Data (read-only) | Reads Order via `OrderRepository.findByDateRange` |
| `seller-account-catalog` | Data (read-only) | Reads Seller (for leaderboard names) and Product (for top-products names) via their repositories. Uses `SellerAuthService` to scope per-seller views. |

---

## Context Map

| Upstream | Downstream | Pattern | Notes |
|----------|------------|---------|-------|
| `seller-account-catalog` | `storefront-checkout` | Customer/Supplier | Storefront consumes Product and Seller via repositories. Catalog publishes a stable read interface. |
| `seller-account-catalog` | `order-fulfillment` | Customer/Supplier | Auth + stock-restore service consumed |
| `seller-account-catalog` | `sales-analytics` | Customer/Supplier | Seller and Product read for analytics labels |
| `storefront-checkout` | `order-fulfillment` | Customer/Supplier | Order aggregate owned by Storefront; Fulfillment is a consumer that drives state transitions via aggregate methods |
| `storefront-checkout` | `sales-analytics` | Customer/Supplier (read-only) | Analytics reads Order data only; no writes |

**Patterns in use**: Customer/Supplier (every relationship). No Anti-Corruption Layer is needed because units share a single language and database — translations are unnecessary. No Shared Kernel: per D2-6, entities live in their owner unit and are imported directly.

---

## Development Sequence

### Phase 1: Foundation
- [ ] **Unit 1: seller-account-catalog** — No inbound dependencies. Builds the seller identity + product catalog that everything else needs. Storefront cannot show anything without products.

### Phase 2: Buyer Path
- [ ] **Unit 2: storefront-checkout** — Depends on Unit 1. Buyer can browse, fill cart, submit info, place orders. Orders land in DB with initial status "ordered". Unit 3's status workflow is not yet wired — orders just sit in "ordered" state, which is acceptable for early validation.

### Phase 3: Seller Operations
- [ ] **Unit 3: order-fulfillment** — Depends on Units 1 and 2. Sellers can now log in, see their orders, advance through the status workflow, and cancel.

### Phase 4: Insights
- [ ] **Unit 4: sales-analytics** — Depends on Units 1, 2, 3. Builds on the data accumulated by previous units. Optional polish: can ship without if timeline tightens.

### Notes for solo development
- Phases are strictly sequential — solo dev cannot work two units in parallel.
- After Phase 2, end-to-end "place an order" works for end users (status workflow not yet); this gives an early demo milestone.
- After Phase 3, the operational loop is complete (seller can fulfill).
- Phase 4 is pure value-add reporting on top of an already-functioning system.
