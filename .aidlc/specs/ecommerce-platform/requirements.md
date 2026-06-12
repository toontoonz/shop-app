# Requirements

## Summary
- **Total Stories**: 12 across 5 functional areas
- **Priority**: 7 High, 4 Medium, 1 Low
- **User Types**: Buyer (anonymous), Seller (authenticated)
- **Key Entities**: Seller, Product, Cart, Order, OrderItem, BuyerInfo, OrderStatusEvent
- **Integrations**: None — payment is mocked, no external systems
- **Core Flows**:
  1. Seller logs in → manages products → views orders → updates statuses → views analytics
  2. Buyer browses storefront → adds items to cart → enters info + selects mock payment → places order → sees confirmation
  3. Seller cancels an order at any non-terminal status, freeing it from active workflow

## Overview
User stories are organized by functional area with EARS notation acceptance criteria. All requirements derive from D1 decisions and the personas document. Mock payment means a payment-method choice is recorded with the order but no external API is called.

---

## Functional Area 1: Seller Authentication

### US-001: Seller Logs In and Out
**As a** Seller (Persona: คุณภูมิ)
**I want** to log into the backend with credentials issued by an admin and log out when finished
**So that** I can securely access only my own products, orders, and analytics

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Seller submits the login form with a valid username and password, **THEN** the system SHALL create an authenticated session and redirect the Seller to the backend dashboard.
2. **IF** the submitted credentials do not match an active Seller account, **THEN** the system SHALL reject the login, SHALL NOT create a session, and SHALL display the message "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" without revealing whether the username exists.
3. **WHEN** the Seller submits the login form with an empty username or empty password, **THEN** the system SHALL reject the submission and SHALL display field-level validation messages in Thai.
4. **WHILE** a Seller has an active session, **WHEN** the Seller clicks the "ออกจากระบบ" action, **THEN** the system SHALL invalidate the session and SHALL redirect the Seller to the login page.
5. **WHEN** an unauthenticated request is made to any backend route other than the login page, **THEN** the system SHALL redirect the request to the login page and SHALL NOT expose backend content.
6. **IF** five consecutive failed login attempts occur for the same username within 15 minutes, **THEN** the system SHALL temporarily block further attempts on that username for at least 15 minutes and SHALL display a generic "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง" message.

**Dependencies**: None
**Source**: D1-2 SellerOnboarding (admin invite-only), Persona: Seller

---

## Functional Area 2: Product Catalog Management

### US-002: Seller Manages Own Products
**As a** Seller
**I want** to create, edit, and delete the products that appear in my section of the storefront
**So that** buyers see an accurate, up-to-date catalog of what I offer

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Seller submits the new-product form with a valid name (non-empty), price (>= 0), and stock quantity (>= 0), **THEN** the system SHALL create the product, SHALL associate it with the authenticated Seller, and SHALL display the product in that Seller's product list.
2. **IF** the Seller submits the new-product form with name empty, price < 0, or stock < 0, **THEN** the system SHALL reject the submission and SHALL display field-level validation errors in Thai.
3. **WHEN** the Seller edits one of their own products, **THEN** the system SHALL update the stored product fields (name, description, price, stock, image) and SHALL reflect those changes on the storefront immediately.
4. **WHEN** the Seller deletes one of their own products, **THEN** the system SHALL remove that product from the storefront catalog and SHALL keep it referenced (read-only) on any historical orders that already include it.
5. **IF** a Seller attempts to edit or delete a product that does not belong to them, **THEN** the system SHALL reject the request with an authorization error and SHALL NOT modify the product.
6. **WHILE** a product has stock = 0, **WHEN** a buyer views the storefront, **THEN** the system SHALL display the product as "สินค้าหมด" and SHALL prevent it from being added to the cart.

**Dependencies**: US-001
**Source**: D1-1 SellerModel (multi-seller), Persona: Seller

---

## Functional Area 3: Storefront and Checkout

### US-003: Buyer Browses Products on the Storefront
**As a** Buyer (Persona: คุณนภา)
**I want** to browse a list of available products and view details for any product
**So that** I can decide what I want to order

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** a Buyer opens the storefront page, **THEN** the system SHALL display a list of all in-stock products from all Sellers, with name, price, image (or placeholder), and Seller name visible per item.
2. **WHEN** the Buyer clicks a product in the list, **THEN** the system SHALL navigate to a product detail page that displays the product name, full description, price, stock status, Seller name, and an "เพิ่มลงตะกร้า" action.
3. **WHILE** a product has stock = 0, **WHEN** the Buyer views the product detail, **THEN** the system SHALL display "สินค้าหมด" and SHALL disable the "เพิ่มลงตะกร้า" action.
4. **WHEN** the Buyer searches by product name using the storefront search input, **THEN** the system SHALL return only products whose name contains the entered text (case-insensitive Thai/English match).
5. **IF** there are no products available, **THEN** the system SHALL display the message "ยังไม่มีสินค้าในระบบ" instead of an empty list.

**Dependencies**: US-002
**Source**: User request, Persona: Buyer

---

### US-004: Buyer Adds Items to a Cart
**As a** Buyer
**I want** to add one or more products to a cart and adjust quantities before checking out
**So that** I can review and confirm my purchase before submitting

**Priority**: Medium

**Acceptance Criteria**:
1. **WHEN** the Buyer clicks "เพิ่มลงตะกร้า" on a product with stock > 0, **THEN** the system SHALL add 1 unit of that product to the cart for the current browser session and SHALL show a visible cart indicator.
2. **WHEN** the Buyer increases the quantity of an item in the cart, **THEN** the system SHALL accept the new quantity if it is a positive integer not exceeding that product's available stock; **ELSE** the system SHALL clamp the quantity to the available stock and SHALL display a notice "เกินจำนวนคงเหลือ".
3. **WHEN** the Buyer removes an item from the cart, **THEN** the system SHALL remove that line and SHALL recalculate the cart total.
4. **WHILE** the cart is empty, **WHEN** the Buyer opens the cart view, **THEN** the system SHALL display "ตะกร้าว่าง" and SHALL disable the "ดำเนินการสั่งซื้อ" action.
5. **WHEN** the Buyer's cart is updated, **THEN** the system SHALL display a running subtotal computed as sum(line price * line quantity) across all cart items.
6. **IF** the cart contains items from multiple Sellers, **THEN** the system SHALL allow checkout to proceed and SHALL split the cart into one Order per Seller during checkout (see US-006).

**Dependencies**: US-003
**Source**: D1-1 SellerModel (multi-seller cart), Persona: Buyer

---

### US-005: Buyer Submits Contact Info and Selects Payment Method
**As a** Buyer
**I want** to enter my contact information and pick a mock payment method on the checkout page
**So that** the Seller has the information needed to fulfill my order

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Buyer opens the checkout page with at least one item in the cart, **THEN** the system SHALL display a form with fields for ชื่อ (required), เบอร์โทร (required), อีเมล (optional), and a payment-method selector.
2. **IF** the ชื่อ field is empty, **THEN** the system SHALL block submission and SHALL display the message "กรุณากรอกชื่อ".
3. **IF** the เบอร์โทร field is empty or does not match a Thai phone-number format (9-10 digits, optional leading 0 or +66), **THEN** the system SHALL block submission and SHALL display the message "กรุณากรอกเบอร์โทรที่ถูกต้อง".
4. **IF** the อีเมล field is non-empty and does not match a valid email format, **THEN** the system SHALL block submission and SHALL display the message "รูปแบบอีเมลไม่ถูกต้อง"; **ELSE** an empty อีเมล SHALL be accepted.
5. **WHEN** the Buyer chooses one of the offered payment methods (Bank Transfer, Cash on Delivery, e-Wallet, Credit Card), **THEN** the system SHALL highlight that method as the selected option and SHALL persist the choice for the next step.
6. **IF** no payment method is selected, **THEN** the system SHALL block submission and SHALL display the message "กรุณาเลือกวิธีชำระเงิน".
7. **WHILE** the Buyer has not yet submitted, **WHEN** the cart contents change in another tab or are cleared, **THEN** the system SHALL refresh the cart summary on the checkout page so the totals stay accurate.

**Dependencies**: US-004
**Source**: User request (required name/phone, optional email), D1-4 PaymentMethods, Persona: Buyer

---

### US-006: Buyer Places Order and Sees Confirmation
**As a** Buyer
**I want** to confirm my order and see a confirmation that it was recorded
**So that** I have proof the order was submitted to the Seller

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Buyer submits the checkout form with all required fields valid and the cart non-empty, **THEN** the system SHALL create one Order per distinct Seller in the cart; each Order SHALL include the Buyer's name, phone, optional email, the chosen payment method, the line items (product, quantity, unit price at time of order), and the order total.
2. **WHEN** an Order is created, **THEN** the system SHALL set its initial status to "ordered" and SHALL store a creation timestamp.
3. **WHEN** an Order is created, **THEN** the system SHALL decrement the available stock of each ordered product by the ordered quantity.
4. **IF** any product in the cart has insufficient stock at the moment of submission, **THEN** the system SHALL reject the submission, SHALL NOT create any Order, SHALL NOT decrement stock, and SHALL display "สินค้าบางรายการมีจำนวนคงเหลือไม่พอ" with the affected items.
5. **WHEN** Order creation succeeds, **THEN** the system SHALL display a confirmation page that shows each created Order's ID, line items, total, chosen payment method, Buyer info, and a clear "บันทึกคำสั่งซื้อเรียบร้อย" message.
6. **WHEN** Order creation succeeds, **THEN** the system SHALL clear the Buyer's cart for the current session.
7. **THE** system SHALL NOT call any external payment API at any point during checkout — payment-method selection is recorded only.

**Dependencies**: US-005
**Source**: User request (mock payment), D1-4, D1-6 status starts at "ordered"

---

## Functional Area 4: Order Management

### US-007: Seller Views Orders Filtered by Status
**As a** Seller
**I want** to see a list of orders for my products, filterable by status
**So that** I can prioritize what to pack and ship next

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Seller opens the orders page, **THEN** the system SHALL display only Orders that contain at least one product owned by that Seller, sorted by creation time descending.
2. **THE** system SHALL display each Order with its ID, creation date, current status, Buyer name and phone, line items (product name + quantity), and order total.
3. **WHEN** the Seller selects a status filter (ordered / paid / packing / shipped / cancelled / all), **THEN** the system SHALL show only Orders whose current status matches the selected filter.
4. **WHEN** the Seller selects "all" or no filter, **THEN** the system SHALL show every Order belonging to that Seller across all statuses.
5. **THE** system SHALL display a count badge per status filter (e.g., "ordered (3)", "paid (5)") computed from that Seller's Orders.
6. **IF** the Seller has no Orders matching the current filter, **THEN** the system SHALL display "ไม่มีออเดอร์ในสถานะนี้" instead of an empty table.

**Dependencies**: US-001, US-006
**Source**: User request (4-stage status), D1-7 AnalyticsCharts (status counts), Persona: Seller

---

### US-008: Seller Updates Order Status Forward
**As a** Seller
**I want** to advance an order's status forward through the lifecycle
**So that** the Buyer's information and my analytics reflect what's actually happening with each order

**Priority**: High

**Acceptance Criteria**:
1. **WHEN** the Seller opens an Order belonging to them, **THEN** the system SHALL display the current status and a clearly labeled "next status" action that names the next allowed status.
2. **THE** allowed forward transitions SHALL be: ordered → paid → packing → shipped (a strictly forward chain).
3. **WHEN** the Seller confirms the "next status" action on an Order they own, **THEN** the system SHALL advance the Order to the next status in the chain, SHALL append a status-event entry with timestamp and the acting Seller, and SHALL display the new status in the UI.
4. **IF** the Seller attempts to skip a status (e.g., move from "ordered" directly to "shipped"), **THEN** the system SHALL reject the transition.
5. **IF** the Order is already at the terminal status "shipped" or at "cancelled", **THEN** the system SHALL hide or disable the "next status" action and SHALL display the status as final.
6. **IF** a Seller attempts to update the status of an Order that does not belong to them, **THEN** the system SHALL reject the request with an authorization error and SHALL NOT modify the Order.
7. **THE** system SHALL show a confirmation prompt before applying any status change to prevent accidental clicks.

**Dependencies**: US-007
**Source**: User request (4-stage workflow), D1-5 manual transitions, D1-6 forward + cancel, Persona: Seller

---

### US-009: Seller Cancels an Order
**As a** Seller
**I want** to cancel an order that cannot be fulfilled
**So that** the order is removed from active fulfillment and stock is restored

**Priority**: Medium

**Acceptance Criteria**:
1. **WHILE** an Order's status is one of {ordered, paid, packing}, **WHEN** the Seller confirms the "ยกเลิกออเดอร์" action on an Order they own, **THEN** the system SHALL set the Order status to "cancelled", SHALL append a status-event entry with timestamp and acting Seller, and SHALL restore each line item's quantity back to product stock.
2. **IF** the Order's status is "shipped" or already "cancelled", **THEN** the system SHALL reject the cancel action and SHALL display "ออเดอร์ในสถานะนี้ยกเลิกไม่ได้".
3. **WHEN** an Order is cancelled, **THEN** the system SHALL exclude that Order from sales totals and top-seller calculations (see US-010, US-011).
4. **THE** system SHALL show a confirmation prompt before applying any cancel action.
5. **IF** a Seller attempts to cancel an Order that does not belong to them, **THEN** the system SHALL reject the request with an authorization error and SHALL NOT modify the Order.

**Dependencies**: US-008
**Source**: D1-6 StatusDirection (Forward + Cancel), Persona: Seller

---

## Functional Area 5: Sales Analytics

### US-010: Seller Views Sales and Order Charts
**As a** Seller
**I want** to see charts of sales and order counts over a chosen time range
**So that** I can understand trends in my business

**Priority**: Medium

**Acceptance Criteria**:
1. **WHEN** the Seller opens the analytics dashboard, **THEN** the system SHALL display: a sales-over-time line/bar chart (total revenue per day or per month), an orders-by-status chart (counts of Orders in each status), and the time-range selector.
2. **THE** time-range selector SHALL offer the presets: Today, 7 days, 30 days, This month, This year. The default selection SHALL be "30 days".
3. **WHEN** the Seller chooses a time-range preset, **THEN** the system SHALL recompute every chart on the dashboard using only Orders whose creation timestamp falls within that range.
4. **THE** sales-over-time chart SHALL include only Orders whose current status is one of {paid, packing, shipped} (excludes "ordered" and "cancelled").
5. **THE** orders-by-status chart SHALL count Orders across all five statuses (ordered, paid, packing, shipped, cancelled) within the selected time range.
6. **WHEN** the dashboard is for a Seller, **THEN** every chart SHALL include only Orders that belong to that Seller.
7. **IF** there are no Orders in the selected time range, **THEN** each chart SHALL display "ไม่มีข้อมูลในช่วงเวลานี้" rather than an empty plot.

**Dependencies**: US-007
**Source**: User request (graphs of sales data), D1-7 AnalyticsCharts, D1-8 AnalyticsTimeRange, Persona: Seller

---

### US-011: Seller Views Top-Seller Leaderboard
**As a** Seller
**I want** to see a leaderboard of which sellers are generating the most revenue
**So that** I can benchmark my performance against other sellers in the marketplace

**Priority**: Medium

**Acceptance Criteria**:
1. **WHEN** the Seller opens the analytics dashboard, **THEN** the system SHALL display a top-seller leaderboard showing each Seller ranked by total revenue, descending.
2. **THE** leaderboard's revenue figure for each Seller SHALL equal the sum of order totals for that Seller's Orders whose current status is one of {paid, packing, shipped}, restricted to the currently selected time range.
3. **THE** leaderboard SHALL display rank, Seller name, and total revenue for the top 10 Sellers (or all Sellers if fewer than 10 exist).
4. **THE** leaderboard SHALL highlight the row of the currently logged-in Seller so they can find themselves quickly.
5. **WHEN** the Seller changes the time-range preset, **THEN** the system SHALL recompute and re-render the leaderboard for the new range.
6. **IF** no Orders qualify in the selected time range, **THEN** the leaderboard SHALL display "ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้".

**Dependencies**: US-010
**Source**: User request (top sellers), D1-9 TopSellerMetric (revenue-based), Persona: Seller

---

### US-012: Seller Views Top-Selling Products
**As a** Seller
**I want** to see which of my products are selling best within a chosen time range
**So that** I can decide which products to restock or promote

**Priority**: Low

**Acceptance Criteria**:
1. **WHEN** the Seller opens the analytics dashboard, **THEN** the system SHALL display a "สินค้าขายดี" panel listing the Seller's own top-selling products ranked by quantity sold, descending.
2. **THE** quantity-sold figure for each product SHALL equal the sum of line-item quantities across the Seller's Orders whose current status is one of {paid, packing, shipped}, restricted to the currently selected time range.
3. **THE** panel SHALL display the top 5 products with product name, quantity sold, and total revenue from that product.
4. **WHEN** the Seller changes the time-range preset, **THEN** the system SHALL recompute the top-products list for the new range.
5. **IF** the Seller has no qualifying Orders in the time range, **THEN** the panel SHALL display "ยังไม่มียอดขายสินค้าในช่วงเวลานี้".

**Dependencies**: US-010
**Source**: D1-7 AnalyticsCharts (top products), Persona: Seller

---

## Story Summary

| ID | Title | Area | Priority | Dependencies |
|----|-------|------|----------|--------------|
| US-001 | Seller logs in and out | Authentication | High | None |
| US-002 | Seller manages own products | Catalog | High | US-001 |
| US-003 | Buyer browses products | Storefront & Checkout | High | US-002 |
| US-004 | Buyer adds items to cart | Storefront & Checkout | Medium | US-003 |
| US-005 | Buyer submits info + payment method | Storefront & Checkout | High | US-004 |
| US-006 | Buyer places order + confirmation | Storefront & Checkout | High | US-005 |
| US-007 | Seller views orders by status | Order Management | High | US-001, US-006 |
| US-008 | Seller advances order status | Order Management | High | US-007 |
| US-009 | Seller cancels order | Order Management | Medium | US-008 |
| US-010 | Seller views sales/order charts | Analytics | Medium | US-007 |
| US-011 | Seller views top-seller leaderboard | Analytics | Medium | US-010 |
| US-012 | Seller views top-selling products | Analytics | Low | US-010 |

---

## Story-Persona Matrix

| Story | Buyer (คุณนภา) | Seller (คุณภูมิ) |
|-------|-----------------|-------------------|
| US-001 | — | ✓ Primary |
| US-002 | ✓ Secondary (sees catalog) | ✓ Primary |
| US-003 | ✓ Primary | — |
| US-004 | ✓ Primary | — |
| US-005 | ✓ Primary | — |
| US-006 | ✓ Primary | ✓ Secondary (receives order) |
| US-007 | — | ✓ Primary |
| US-008 | ✓ Secondary (status reflects fulfillment) | ✓ Primary |
| US-009 | ✓ Secondary | ✓ Primary |
| US-010 | — | ✓ Primary |
| US-011 | — | ✓ Primary |
| US-012 | — | ✓ Primary |

---

## Non-Functional Considerations

Brief notes on cross-cutting concerns. NFR phase was marked No, but these are the assumed defaults to keep in mind during design:

- **Performance**: Storefront pages should load within 2 seconds on typical broadband; analytics charts should render within 3 seconds for the default 30-day range.
- **Security**: Seller passwords stored hashed; sessions HTTP-only and CSRF-protected; authorization enforced server-side on every seller action; Buyer info treated as PII (not displayed to other sellers).
- **Scalability**: MVP target — single deployment, single database, expected order volume in the low thousands per month.
- **Accessibility**: Forms use proper labels; error messages associated with their fields; keyboard-navigable storefront and backend.
- **Concurrency**: Stock decrement at order placement must be atomic to prevent overselling when multiple buyers check out simultaneously.

---

## Out of Scope (per D1-11)

The following are explicitly NOT part of this MVP and SHALL NOT have requirements written for them:
- Real payment-API integration (only mock methods are recorded)
- Email or SMS notifications to buyers or sellers
- Shipping label, tracking, or carrier integration
- Reviews and ratings
- Advanced inventory features (low-stock alerts, auto-reorder, supplier management)
- Promotions, coupons, discounts
- Refund workflow (cancellation only restores stock; no payment refund mechanic since payments are mocked)
- Buyer accounts (anonymous checkout only, per D1-3)
- Self-service seller signup (admin invite-only, per D1-2)
