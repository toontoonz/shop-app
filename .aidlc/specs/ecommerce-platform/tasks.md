# Implementation Tasks

## Summary
- **Total Tasks**: 33 across 6 phases
- **Strategy**: Feature-by-feature aligned with units (Phase 0 = setup, Phases 1-4 = one per unit, Phase 5 = hardening + deploy)
- **Test Discipline**: Hybrid (TDD for the 4 PBT properties + Order aggregate state machine; test-after for UI and integration glue)
- **Test Pyramid**: Unit > Integration > 4 PBT properties > 4 selective E2E flows
- **Estimates**: T-shirt (S ≈ 0.5 day, M ≈ 1 day, L ≈ 1.5-2 days)
- **Execution**: Strictly sequential (solo developer)
- **Coverage**: 7 entities, 22 endpoints, ~25 components, 12 user stories, 4 PBT properties, 4 E2E flows

---

## Tasks

- [ ] 0. Phase 0 — Project Setup (Wave 1)

  - [x] 0.1 Scaffold Next.js + TypeScript project with strict mode
    - Initialize repo with `pnpm create next-app` (App Router, TypeScript, Tailwind, ESLint)
    - Set `tsconfig.json` to strict mode and configure `@/*` → `src/*` path alias
    - Install Tailwind CSS, configure `tailwind.config.ts` with Noto Sans Thai loaded via `next/font/google`
    - Initialize shadcn/ui CLI and add primitives: Button, Input, Label, Form, Card, Dialog, AlertDialog, Drawer, Tabs, Select, Table, Badge, Toast, DropdownMenu
    - Add ESLint `no-restricted-imports` rule restricting `@/modules/*/(domain|repositories|services|queries|ui)/**` from outside their own module (only `@/modules/{name}` barrel allowed externally)
    - Add Prettier config and pre-commit hook (lint-staged)
    - **Estimate**: L
    - **Requirements**: foundational (all stories)
    - **Owns**: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.eslintrc.json`, `prettier.config.js`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/`

  - [x] 0.2 Create Prisma schema with all models and migrations
    - Install Prisma + Neon adapter packages; init `prisma/schema.prisma`
    - Define all models from `design/data-model.md`: Seller, Product, FailedLogin, Order, OrderItem, OrderStatusEvent, plus Auth.js standard models (Account, Session, VerificationToken)
    - Add `OrderStatus` and `PaymentMethod` enums
    - Add all `@@index` declarations from the design
    - Run `prisma migrate dev` to create initial migration
    - Manually edit the generated migration to add raw SQL CHECK constraints (`stock_non_negative`, `price_non_negative`, `qty_positive`, `unit_price_non_negative`, `total_non_negative`)
    - Add `docker-compose.yml` for local Postgres (port 5432, password in `.env.local`)
    - Write `prisma/seed.ts` that creates one admin-issued seller (`username: 'demo'`, password set via env) and 6 demo products spanning different sellers (creates 2 sellers actually — `demo` and `demo2` — to make analytics views meaningful)
    - Add `db:*` scripts to package.json (`db:migrate:dev`, `db:migrate:deploy`, `db:generate`, `db:seed`, `db:studio`)
    - **Estimate**: L
    - **Requirements**: US-001, US-002, US-006, US-008, US-009 (data foundation)
    - **Owns**: `prisma/`, `docker-compose.yml`, `package.json` (scripts section)

  - [x] 0.3 Configure Auth.js v5 with Credentials provider and database sessions
    - Install `next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`
    - Create `src/lib/db.ts` (Prisma client singleton with global cache for dev)
    - Create `src/lib/auth.ts` exporting `{ handlers, signIn, signOut, auth }` with: PrismaAdapter, `session: { strategy: 'database' }`, Credentials provider with `authorize` callback (calls `LoginThrottle` from Phase 1, verifies bcrypt, returns Seller or null)
    - Wire `/api/auth/[...nextauth]/route.ts` to expose `handlers.GET` and `handlers.POST`
    - Stub the `LoginThrottle` interface in `src/lib/auth.ts` so the file compiles; actual implementation lands in T1.1
    - Create `src/lib/auth-middleware.ts` exporting `withSellerAuth(handler)` that requires authenticated active Seller and passes `{ seller }` to handler
    - **Estimate**: M
    - **Requirements**: US-001
    - **Owns**: `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/db.ts`, `src/app/api/auth/[...nextauth]/route.ts`

  - [x] 0.4 Build shared infrastructure under `src/lib/`
    - `src/lib/errors/` — `AppError` base + subclasses: `ValidationError`, `NotFoundError`, `ForbiddenError`, `InvalidTransitionError`, `InsufficientStockError`, `RateLimitedError`
    - `src/lib/api-handler.ts` — `apiHandler(fn)` wrapper that catches AppErrors and maps to `{ ok: false, error: { code, message, fields? } }` with appropriate HTTP status; logs unexpected errors
    - `src/lib/money.ts` — `SATANG_PER_THB`, `formatTHB(satang)`, `parseTHBInput(input)` with unit tests for round-trip and edge cases
    - `src/lib/time-range.ts` — `RangePreset` type, `resolveRange(preset, now?)` returning `{ from, to, interval }` for the 5 presets, with unit tests
    - `src/lib/log.ts` — pino logger with level from `LOG_LEVEL` env var
    - `src/lib/validation/buyer-info.ts` — `BuyerInfoSchema`, `ThaiPhoneRegex`
    - `src/lib/validation/auth.ts` — `CredentialsSchema`
    - `src/lib/validation/product.ts` — `ProductCreateSchema`, `ProductUpdateSchema`
    - `src/lib/validation/checkout.ts` — `CheckoutSchema` (extends BuyerInfoSchema)
    - **Estimate**: L
    - **Requirements**: foundational; satisfies US-005 phone format AC, error envelope contract used by all APIs
    - **Owns**: `src/lib/errors/`, `src/lib/api-handler.ts`, `src/lib/money.ts`, `src/lib/time-range.ts`, `src/lib/log.ts`, `src/lib/validation/`

  - [x] 0.5 Set up testing infrastructure
    - Install Vitest, `@testing-library/react`, jsdom; create `vitest.config.ts` (jsdom env for component tests via projects, node env for service tests)
    - Create `vitest.integration.config.ts` with a setup file that runs migrations against the test DB before each suite
    - Install Playwright; run `playwright install --with-deps chromium`; create `playwright.config.ts` (Chromium only)
    - Install `fast-check`; create `tests/pbt/` folder with one smoke test
    - Create `tests/helpers/` with `resetTestDb()`, `seedSeller()`, `seedProduct()`, `seedOrder()` factories
    - Add `test`, `test:integration`, `test:pbt`, `test:e2e` scripts to package.json
    - Verify a sample unit test, integration test, PBT test, and E2E smoke all run green locally
    - **Estimate**: M
    - **Requirements**: foundational (all testing tasks depend on this)
    - **Owns**: `vitest.config.ts`, `vitest.integration.config.ts`, `playwright.config.ts`, `tests/`, `tests/helpers/`

  - [x] 0.6 Set up GitHub Actions CI
    - Create `.github/workflows/ci.yml` with stages: install (pnpm, frozen lockfile) → start Postgres service → migrate → lint → typecheck → unit tests → integration tests → PBT
    - Use `actions/setup-node@v4` with pnpm cache; set `DATABASE_URL` env for migrate + integration steps
    - Verify CI passes against the scaffolded codebase
    - **Estimate**: S
    - **Requirements**: D3-15 CI/CD; supports US-001 through US-012 quality gates
    - **Owns**: `.github/workflows/ci.yml`

- [ ] 1. Phase 1 — seller-account-catalog (Wave 2) — US-001, US-002

  - [x] 1.1 Implement Seller domain + LoginThrottle + Auth.js authorize wired up
    - Create `src/modules/seller-account-catalog/domain/seller.ts` (entity type)
    - Create `src/modules/seller-account-catalog/repositories/seller.ts` (`findByUsername`, `findById`, `findAll`)
    - Create `src/modules/seller-account-catalog/services/login-throttle.ts` exposing `isBlocked(username)`, `recordFailure(username)`, `clear(username)`. Implement with FailedLogin table queries; 5 attempts in 15 minutes triggers block
    - Wire the real `LoginThrottle` into `src/lib/auth.ts` `authorize` callback (replacing T0.3's stub). On block: throw error with message `'THROTTLED'` so UI can detect and show throttle message; on credentials failure: `recordFailure` then return null (generic error); on success: `clear`
    - Export public surface from `src/modules/seller-account-catalog/index.ts` (barrel)
    - Write integration tests: successful login, wrong password, blocked username, throttle reset on success
    - **Estimate**: M
    - **Requirements**: US-001 (AC#1, AC#2, AC#6 throttling)
    - **Owns**: `src/modules/seller-account-catalog/domain/seller.ts`, `src/modules/seller-account-catalog/repositories/seller.ts`, `src/modules/seller-account-catalog/services/login-throttle.ts`, `src/modules/seller-account-catalog/index.ts`

  - [x] 1.2 Build login page + LoginForm + admin layout with logout
    - Create `src/app/(admin)/layout.tsx` with auth guard (calls `auth()`, redirects to `/login` if no session) and a top nav with seller name + LogoutButton
    - Create `src/app/(admin)/login/page.tsx` (server component shell)
    - Create `src/modules/seller-account-catalog/ui/LoginForm.tsx` (client) using React Hook Form + Zod (`CredentialsSchema`); calls Auth.js `signIn('credentials', { username, password, redirect: false })`; shows generic error on credential failure; shows throttle message if backend signals throttle (via 429 query param or signed-in error)
    - Create `src/modules/seller-account-catalog/ui/LogoutButton.tsx` (client) calling `signOut()`
    - Verify field-level validation works for empty username/password
    - **Estimate**: M
    - **Requirements**: US-001 (AC#1, #2, #3, #4, #5, #6 UI)
    - **Owns**: `src/app/(admin)/login/`, `src/app/(admin)/layout.tsx`, `src/modules/seller-account-catalog/ui/LoginForm.tsx`, `src/modules/seller-account-catalog/ui/LogoutButton.tsx`

  - [x] 1.3 Implement ProductRepository with atomic stock methods
    - Create `src/modules/seller-account-catalog/repositories/product.ts`
    - Methods: `findActiveById`, `findActiveAll`, `findActiveBySellerId`, `findById` (includes inactive — used by historical orders), `create`, `updateOwnedById`, `softDelete`, `tryDecrementStock(productId, qty)` (uses `updateMany` with `where: { id, stock: { gte: qty }, active: true }` returning count; returns `null` on failure), `incrementStock(productId, qty)`
    - Write integration tests for ownership boundary (Seller A cannot modify Seller B's product) and atomicity behavior of `tryDecrementStock`
    - Add to barrel
    - **Estimate**: M
    - **Requirements**: US-002 (CRUD + ownership AC#5), US-006 (atomic decrement AC#3, #4), US-009 (stock restore AC#1)
    - **Owns**: `src/modules/seller-account-catalog/repositories/product.ts`

  - [x] 1.4 Build product CRUD APIs with withSellerAuth
    - `src/app/api/seller/products/route.ts` — GET (list current seller's products), POST (create — uses `ProductCreateSchema`)
    - `src/app/api/seller/products/[id]/route.ts` — GET (own product detail), PATCH (update — `ProductUpdateSchema`), DELETE (soft-delete via `softDelete`)
    - Wrap every handler with `withSellerAuth` and `apiHandler`
    - Return 404 for products not owned by current seller (do not reveal existence)
    - Integration tests covering all CRUD + ownership cases
    - **Estimate**: M
    - **Requirements**: US-002 (all ACs)
    - **Owns**: `src/app/api/seller/products/`

  - [x] 1.5 Build product management UI (list / new / edit / delete)
    - `src/app/(admin)/products/page.tsx` — server component listing seller's products via `ProductRepository.findActiveBySellerId`
    - `src/app/(admin)/products/new/page.tsx` and `src/app/(admin)/products/[id]/edit/page.tsx`
    - `src/modules/seller-account-catalog/ui/ProductForm.tsx` (client) — RHF + Zod, THB → satang via `parseTHBInput`, image URL field, used for both create and edit
    - `src/modules/seller-account-catalog/ui/ProductTableSeller.tsx` (server) — table with edit/delete actions
    - `src/modules/seller-account-catalog/ui/DeleteProductDialog.tsx` (client) — shadcn AlertDialog confirming soft-delete
    - Use TanStack Query for list invalidation after mutations
    - **Estimate**: L
    - **Requirements**: US-002 (UI for AC#1-#4)
    - **Owns**: `src/app/(admin)/products/`, `src/modules/seller-account-catalog/ui/ProductForm.tsx`, `src/modules/seller-account-catalog/ui/ProductTableSeller.tsx`, `src/modules/seller-account-catalog/ui/DeleteProductDialog.tsx`

  - [x] 1.6 Phase 1 testing — PBT P1 (stock non-negativity) + integration
    - Write `tests/pbt/stock-non-negativity.test.ts` per `design/correctness.md` P1
    - Verify the property passes — adjust `tryDecrementStock` if any failing example surfaces
    - Add CI-level enforcement that `pnpm test:pbt` runs in the GH Actions pipeline
    - Add additional integration tests for ProductRepository edge cases (concurrent decrement, soft-deleted product invisible to storefront, inactive product cannot be added to cart — last verified in Phase 2 but stub the check here)
    - **Estimate**: L
    - **Requirements**: US-002 AC#1 (stock validation), US-006 AC#3 (atomic decrement), Correctness Property P1
    - **Owns**: `tests/pbt/stock-non-negativity.test.ts`, `tests/integration/seller-account-catalog/`

- [ ] 2. Phase 2 — storefront-checkout (Wave 3) — US-003, US-004, US-005, US-006

  - [x] 2.1 Build storefront browse pages (list + detail + search)
    - `src/app/(storefront)/page.tsx` — server component reading active products via `ProductRepository.findActiveAll`, supporting `?q=` search (case-insensitive name LIKE)
    - `src/app/(storefront)/product/[id]/page.tsx` — product detail with `findActiveById`, returns notFound() if not active
    - `src/modules/storefront-checkout/ui/StorefrontHeader.tsx`, `SearchBox.tsx`, `ProductCard.tsx`, `ProductDetail.tsx`
    - Public GET endpoints: `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts` (used by client search interactions)
    - Display "สินค้าหมด" badge when `stock = 0`; disable Add-to-Cart button accordingly
    - Display "ยังไม่มีสินค้าในระบบ" when result list is empty
    - **Estimate**: M
    - **Requirements**: US-003 (all ACs)
    - **Owns**: `src/app/(storefront)/page.tsx`, `src/app/(storefront)/product/`, `src/modules/storefront-checkout/ui/{StorefrontHeader,SearchBox,ProductCard,ProductDetail}.tsx`, `src/app/api/products/`

  - [x] 2.2 Implement Cart cookie service + cart APIs + Cart UI
    - `src/modules/storefront-checkout/services/cart.ts` — read/write cart cookie (signed with HMAC-SHA256 using `NEXTAUTH_SECRET`), validate on read, clamp quantities to current stock
    - Cart APIs: `src/app/api/cart/route.ts` (GET, POST), `src/app/api/cart/lines/[productId]/route.ts` (PATCH, DELETE) — all re-resolve product price/stock on every request
    - Cart UI: `CartDrawer.tsx`, `CartLine.tsx` (with quantity stepper clamped to stock), `CartTotal.tsx`, `AddToCartButton.tsx`
    - `src/app/(storefront)/cart/page.tsx` showing the full cart with line subtotals + running total
    - Use TanStack Query keyed by `['cart']` for invalidation after mutations
    - Empty cart → "ตะกร้าว่าง" + disabled "ดำเนินการสั่งซื้อ"
    - Quantity > stock → toast "เกินจำนวนคงเหลือ" and clamp
    - **Estimate**: L
    - **Requirements**: US-004 (all ACs)
    - **Owns**: `src/modules/storefront-checkout/services/cart.ts`, `src/app/api/cart/`, `src/modules/storefront-checkout/ui/{CartDrawer,CartLine,CartTotal,AddToCartButton}.tsx`, `src/app/(storefront)/cart/page.tsx`

  - [x] 2.3 Implement Order aggregate domain (state machine)
    - `src/modules/storefront-checkout/domain/order.ts` — `Order` class with constructor (validates initial state), readonly fields, `advanceStatus(actorSellerId)`, `cancel(actorSellerId)`. Both methods throw `ForbiddenError` on ownership mismatch and `InvalidTransitionError` on disallowed state
    - `src/modules/storefront-checkout/domain/order-status-machine.ts` — `FORWARD_TRANSITIONS` map and `CANCELLABLE_STATUSES` set as exported constants (single source of truth)
    - Unit tests for every allowed and disallowed transition
    - **Estimate**: M
    - **Requirements**: US-008 (state machine), US-009 (cancel rules), Correctness Property P2 prep
    - **Owns**: `src/modules/storefront-checkout/domain/`

  - [x] 2.4 Implement OrderRepository + transactional checkout handler
    - `src/modules/storefront-checkout/repositories/order.ts` — `create(input)`, `findById`, `findBySellerId(sellerId, filters)`, `findByDateRange(from, to, statusFilter?)`, `updateStatus(orderId, newStatus, actorSellerId)` (writes both Order.status and OrderStatusEvent in same transaction)
    - `src/modules/storefront-checkout/services/checkout.ts` — `submitCheckout(cartLines, buyerInfo, paymentMethod)`:
      1. Re-resolve all product prices/stock from DB
      2. Open `prisma.$transaction`:
         a. For each cart line, call `tryDecrementStock` — if any returns null, throw `InsufficientStockError` with affected items
         b. Group cart lines by sellerId
         c. For each group, create one Order with its OrderItems (snapshotting `productNameAtOrder` and `unitPriceSatang`); compute and store `totalSatang`
      3. Return list of created orders
    - `src/app/api/checkout/route.ts` — POST handler that reads cart cookie, validates `CheckoutSchema`, calls `submitCheckout`, on success clears cart cookie and returns 201 with orders
    - Integration tests: multi-seller split, insufficient stock rollback (no orders created, no stock decremented), missing buyer info → 400
    - **Estimate**: L
    - **Requirements**: US-006 (all ACs including atomicity)
    - **Owns**: `src/modules/storefront-checkout/repositories/order.ts`, `src/modules/storefront-checkout/services/checkout.ts`, `src/app/api/checkout/route.ts`

  - [x] 2.5 Build checkout UI (CheckoutForm + PaymentMethodPicker)
    - `src/modules/storefront-checkout/ui/CheckoutForm.tsx` (client) — RHF + Zod (`CheckoutSchema`), fields: name (required), phone (Thai regex), email (optional), payment method picker
    - `src/modules/storefront-checkout/ui/PaymentMethodPicker.tsx` (client) — radio cards for the 4 mock methods using shadcn `RadioGroup`
    - `src/app/(storefront)/checkout/page.tsx` — server shell with cart summary + form
    - Inline field-level error messages in Thai per requirements (US-005 AC#2-#6)
    - On submit success → redirect to confirmation page
    - **Estimate**: M
    - **Requirements**: US-005 (all ACs)
    - **Owns**: `src/app/(storefront)/checkout/page.tsx`, `src/modules/storefront-checkout/ui/{CheckoutForm,PaymentMethodPicker}.tsx`

  - [x] 2.6 Build order confirmation page
    - `src/app/(storefront)/confirmation/[orderId]/page.tsx` — server component
    - Public read endpoint: `src/app/api/orders/[id]/confirmation/route.ts` (returns minimal order info — id, items, total, payment method, buyer info)
    - `src/modules/storefront-checkout/ui/OrderConfirmation.tsx` rendering the confirmation card with "บันทึกคำสั่งซื้อเรียบร้อย"
    - When checkout creates multiple orders (multi-seller cart), redirect to a "summary" view showing all created orders (or a per-order page that links to siblings)
    - **Estimate**: S
    - **Requirements**: US-006 (AC#5 confirmation)
    - **Owns**: `src/app/(storefront)/confirmation/`, `src/app/api/orders/[id]/confirmation/`, `src/modules/storefront-checkout/ui/OrderConfirmation.tsx`

  - [x] 2.7 Phase 2 testing — PBT P2 + P4 + checkout E2E
    - Write `tests/pbt/order-status-machine.test.ts` per Property P2
    - Write `tests/pbt/cart-total.test.ts` per Property P4
    - Add unit test for `computeCartTotal(empty) === 0`
    - Write `tests/e2e/buyer-checkout.spec.ts` (Playwright): seed seller + product → buyer browses → adds to cart → submits checkout with mock COD → sees confirmation → verify Order row exists with correct status, items, payment method
    - Verify all PBT properties + E2E pass in CI
    - **Estimate**: L
    - **Requirements**: US-004 AC#5 (cart total), US-006 (checkout flow), Correctness Properties P2, P4
    - **Owns**: `tests/pbt/order-status-machine.test.ts`, `tests/pbt/cart-total.test.ts`, `tests/e2e/buyer-checkout.spec.ts`

- [ ] 3. Phase 3 — order-fulfillment (Wave 4) — US-007, US-008, US-009

  - [x] 3.1 Implement OrderStatusEvent + StatusTimeline UI
    - `src/modules/order-fulfillment/repositories/order-status-event.ts` — `findByOrderId(orderId)` (Used by Order.advanceStatus/cancel orchestration which inserts events)
    - `src/modules/order-fulfillment/ui/StatusTimeline.tsx` (server) — vertical list of events with localized Thai labels and timestamps
    - `src/modules/order-fulfillment/ui/StatusBadge.tsx` (server) — colored dot + Thai label per status
    - Add to module barrel
    - **Estimate**: M
    - **Requirements**: US-008 AC#3 (event log), US-007 (status display)
    - **Owns**: `src/modules/order-fulfillment/repositories/order-status-event.ts`, `src/modules/order-fulfillment/ui/{StatusTimeline,StatusBadge}.tsx`, `src/modules/order-fulfillment/index.ts`

  - [x] 3.2 Build orders list page with status filter
    - `src/app/(admin)/orders/page.tsx` — server component, reads current seller's orders via `OrderRepository.findBySellerId`
    - `src/app/api/seller/orders/route.ts` — GET endpoint returning `{ orders, counts }` (counts include all 5 statuses + ALL)
    - `src/modules/order-fulfillment/ui/OrdersListAdmin.tsx` (server) — table with order id, createdAt, status badge, buyer name+phone, line item summary, total
    - `src/modules/order-fulfillment/ui/StatusFilter.tsx` (client) — tabs/select syncing to `?status=` URL param, displays count badges
    - Empty state: "ไม่มีออเดอร์ในสถานะนี้"
    - **Estimate**: L
    - **Requirements**: US-007 (all ACs)
    - **Owns**: `src/app/(admin)/orders/page.tsx`, `src/app/api/seller/orders/route.ts`, `src/modules/order-fulfillment/ui/{OrdersListAdmin,StatusFilter}.tsx`

  - [x] 3.3 Build order detail page + advance/cancel API endpoints
    - `src/app/(admin)/orders/[id]/page.tsx` — server component showing OrderDetailAdmin with line items, buyer info, status timeline, action buttons
    - `src/app/api/seller/orders/[id]/route.ts` — GET (full order detail with items + statusEvents)
    - `src/app/api/seller/orders/[id]/advance-status/route.ts` — POST: in transaction, load order with row lock (`SELECT FOR UPDATE`), instantiate Order aggregate, call `advanceStatus(currentSeller.id)`, persist via `OrderRepository.updateStatus` (writes status + StatusEvent atomically). Return updated order.
    - `src/app/api/seller/orders/[id]/cancel/route.ts` — POST: same pattern, calls `Order.cancel`, then in same transaction iterates OrderItems and calls `ProductRepository.incrementStock` for each
    - All wrapped in `withSellerAuth` + `apiHandler`. Map `InvalidTransitionError` → 409 with code `INVALID_TRANSITION`. Map `ForbiddenError` → 404 (don't reveal existence)
    - **Estimate**: L
    - **Requirements**: US-008 (all ACs), US-009 (all ACs)
    - **Owns**: `src/app/(admin)/orders/[id]/`, `src/app/api/seller/orders/[id]/`, `src/modules/order-fulfillment/ui/OrderDetailAdmin.tsx`

  - [x] 3.4 Build status action buttons + ConfirmDialog
    - `src/modules/order-fulfillment/ui/AdvanceStatusButton.tsx` (client) — shows next allowed status as label, opens ConfirmDialog, calls advance API on confirm; hidden when current status is `SHIPPED` or `CANCELLED`
    - `src/modules/order-fulfillment/ui/CancelOrderButton.tsx` (client) — visible only when status ∈ {ORDERED, PAID, PACKING}, opens ConfirmDialog, calls cancel API on confirm
    - `src/components/ui/ConfirmDialog.tsx` (shared) — generic shadcn AlertDialog wrapper accepting `title`, `description`, `confirmLabel`, `onConfirm`
    - Both buttons use TanStack Query mutation; on success invalidate `['orders']` and `['order', id]` queries, show toast
    - **Estimate**: M
    - **Requirements**: US-008 AC#1, #7 confirmation; US-009 AC#4 confirmation
    - **Owns**: `src/modules/order-fulfillment/ui/{AdvanceStatusButton,CancelOrderButton}.tsx`, `src/components/ui/ConfirmDialog.tsx`

  - [x] 3.5 Phase 3 testing — integration + E2E (advance + cancel)
    - Integration tests: advance from each status, illegal transitions rejected, cancel from each cancellable status restores correct stock, cancel forbidden after shipped, ownership enforcement (Seller A cannot advance Seller B's order)
    - `tests/e2e/seller-advance-status.spec.ts` (Playwright): seed order in ORDERED → seller logs in → opens detail → advances to PAID → verify status updated + event logged
    - `tests/e2e/seller-cancel-order.spec.ts` (Playwright): seed paid order with stock change → seller cancels → verify status = CANCELLED + stock restored on each line item
    - **Estimate**: L
    - **Requirements**: US-008 (acceptance), US-009 (acceptance + stock restore validated)
    - **Owns**: `tests/integration/order-fulfillment/`, `tests/e2e/seller-advance-status.spec.ts`, `tests/e2e/seller-cancel-order.spec.ts`

- [ ] 4. Phase 4 — sales-analytics (Wave 5) — US-010, US-011, US-012

  - [x] 4.1 Implement AnalyticsCriteria + analytics queries
    - `src/modules/sales-analytics/domain/analytics-criteria.ts` — exports `qualifyingStatuses = [PAID, PACKING, SHIPPED]` (single source of truth for revenue inclusion)
    - `src/modules/sales-analytics/queries/sales.ts` — `getSalesOverTime(sellerId, range)` returning `{ interval, points: [{ bucket, revenueSatang }] }`. Uses `prisma.$queryRaw` to do `date_trunc(...)` aggregation per interval (DAY or MONTH chosen by `resolveRange`)
    - `src/modules/sales-analytics/queries/orders-by-status.ts` — counts per all 5 statuses for seller in range
    - `src/modules/sales-analytics/queries/top-sellers.ts` — top 10 sellers globally by revenue in range; returns rows with sellerId, sellerName, revenueSatang, isCurrentSeller flag
    - `src/modules/sales-analytics/queries/top-products.ts` — top 5 products for current seller by quantity in range
    - All queries restrict to `Order.status IN qualifyingStatuses` (except orders-by-status which spans all 5)
    - **Estimate**: L
    - **Requirements**: US-010 AC#4 (revenue inclusion rule), US-011 AC#2, US-012 AC#2
    - **Owns**: `src/modules/sales-analytics/domain/analytics-criteria.ts`, `src/modules/sales-analytics/queries/`

  - [x] 4.2 Build analytics API endpoints
    - `src/app/api/seller/analytics/sales/route.ts`, `.../orders-by-status/route.ts`, `.../top-sellers/route.ts`, `.../top-products/route.ts`
    - All wrapped in `withSellerAuth` + `apiHandler`. Read `?range=` param (default `LAST_30D`), call `resolveRange`, call corresponding query, return data
    - Top-sellers query NOT restricted to current seller (it's a global leaderboard); top-products IS restricted to current seller
    - Integration tests: revenue inclusion (cancelled order excluded), time-range filtering, per-seller scoping (seller A doesn't see seller B's top products)
    - **Estimate**: M
    - **Requirements**: US-010, US-011, US-012 (API contract from `design/api-spec.md`)
    - **Owns**: `src/app/api/seller/analytics/`

  - [x] 4.3 Build chart components + TimeRangePicker
    - `src/modules/sales-analytics/ui/TimeRangePicker.tsx` (client) — tabs for the 5 presets; updates `?range=` URL param; default `LAST_30D`
    - `src/modules/sales-analytics/ui/SalesOverTimeChart.tsx` (client, Recharts BarChart with x = bucket label, y = revenueSatang formatted as THB)
    - `src/modules/sales-analytics/ui/OrdersByStatusChart.tsx` (client, Recharts BarChart, x = status, y = count)
    - Empty state for each chart: "ไม่มีข้อมูลในช่วงเวลานี้"
    - **Estimate**: L
    - **Requirements**: US-010 (all ACs)
    - **Owns**: `src/modules/sales-analytics/ui/{TimeRangePicker,SalesOverTimeChart,OrdersByStatusChart}.tsx`

  - [x] 4.4 Build top tables + dashboard page
    - `src/modules/sales-analytics/ui/TopSellersTable.tsx` (server) — top 10 with current-seller row highlighted; empty state "ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้"
    - `src/modules/sales-analytics/ui/TopProductsTable.tsx` (server) — top 5 products for current seller
    - `src/app/(admin)/dashboard/page.tsx` (server) — wires TimeRangePicker + 2 charts + 2 tables in a responsive grid layout. Uses Suspense boundaries for staggered loading
    - **Estimate**: L
    - **Requirements**: US-011 (all ACs), US-012 (all ACs)
    - **Owns**: `src/app/(admin)/dashboard/`, `src/modules/sales-analytics/ui/{TopSellersTable,TopProductsTable}.tsx`

  - [x] 4.5 Phase 4 testing — PBT P3 (revenue inclusion) + integration
    - Write `tests/pbt/revenue-inclusion.test.ts` per Property P3
    - Test that `qualifyingStatuses` from `AnalyticsCriteria` is the single source consulted by all four query files (grep test or import-graph assertion)
    - Integration tests already in T4.2 — extend to cover edge cases: range with no qualifying orders → returns empty arrays; range that crosses time-bucket boundaries → buckets aggregated correctly
    - **Estimate**: L
    - **Requirements**: US-010 AC#4, US-011 AC#2, US-012 AC#2, Correctness Property P3
    - **Owns**: `tests/pbt/revenue-inclusion.test.ts`, `tests/integration/sales-analytics/`

- [ ] 5. Phase 5 — Hardening & Deployment (Wave 6)

  - [x] 5.1 Login throttle E2E + loading/error UI for route groups
    - `tests/e2e/login-throttle.spec.ts` (Playwright): submit wrong credentials 5 times in under 15 minutes → assert 6th attempt shows throttle message, not generic credentials error
    - Add `loading.tsx` (Skeleton) and `error.tsx` (generic error boundary with retry) to `src/app/(storefront)/` and `src/app/(admin)/` route groups
    - Add `not-found.tsx` to root `src/app/`
    - **Estimate**: M
    - **Requirements**: US-001 AC#6 (throttle behavior), general UX polish for all stories
    - **Owns**: `tests/e2e/login-throttle.spec.ts`, `src/app/(storefront)/loading.tsx`, `src/app/(storefront)/error.tsx`, `src/app/(admin)/loading.tsx`, `src/app/(admin)/error.tsx`, `src/app/not-found.tsx`

  - [x] 5.2 Cron job for FailedLogin cleanup
    - `src/app/api/cron/cleanup-failed-logins/route.ts` — GET handler validates `Authorization: Bearer ${CRON_SECRET}`, deletes FailedLogin rows older than 24 hours
    - `vercel.json` with cron entry: `{ "crons": [{ "path": "/api/cron/cleanup-failed-logins", "schedule": "0 3 * * *" }] }`
    - Unit test for the cleanup query
    - **Estimate**: S
    - **Requirements**: Operational hygiene supporting US-001 throttle window
    - **Owns**: `src/app/api/cron/`, `vercel.json`

  - [x] 5.3 Production deployment to Vercel + Neon
    - Provision Neon Postgres database (or Vercel Postgres); record connection string
    - Create Vercel project linked to GitHub repo; set environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LOG_LEVEL`, `CRON_SECRET`)
    - Confirm `prisma migrate deploy` runs in Vercel build hook
    - Run a production seed (one demo seller per documentation only — clearly marked); document admin process for creating real sellers
    - Smoke test critical flows on production: seller login → product create → buyer storefront → checkout → seller advance → analytics
    - **Estimate**: M
    - **Requirements**: All stories (production availability)
    - **Owns**: Vercel + Neon dashboards (no code paths)

  - [x] 5.4 README + final cleanup
    - Write `README.md` with: project overview, prerequisites (Node, pnpm, Docker), local setup steps, env-var reference, scripts table, testing commands (unit/integration/PBT/E2E), seller account creation process (admin runs `pnpm db:seed` or a small CLI script), deployment notes (Vercel + Neon), out-of-scope reminders
    - Run final lint + typecheck + full test suite locally and in CI to confirm green build
    - Update `.env.example` with every required variable
    - **Estimate**: S
    - **Requirements**: Project completion / handoff
    - **Owns**: `README.md`, `.env.example` (final pass)

---

## Execution Waves

Solo developer → strictly sequential per D4-5. Each wave contains exactly one phase. File ownership is documented per phase to allow future parallelism if a second developer joins.

| Wave | Phase | Depends On | File Ownership |
|------|-------|------------|----------------|
| 1 | Phase 0 — Project Setup | (none) | scaffold roots: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.eslintrc.json`, `prisma/`, `src/lib/`, `src/components/ui/`, `src/app/layout.tsx`, `src/app/api/auth/[...nextauth]/`, `tests/helpers/`, `vitest*.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `docker-compose.yml` |
| 2 | Phase 1 — seller-account-catalog | Wave 1 | `src/modules/seller-account-catalog/`, `src/app/(admin)/login/`, `src/app/(admin)/layout.tsx`, `src/app/(admin)/products/`, `src/app/api/seller/products/`, `tests/pbt/stock-non-negativity.test.ts`, `tests/integration/seller-account-catalog/` |
| 3 | Phase 2 — storefront-checkout | Wave 2 | `src/modules/storefront-checkout/`, `src/app/(storefront)/`, `src/app/api/products/`, `src/app/api/cart/`, `src/app/api/checkout/`, `src/app/api/orders/`, `tests/pbt/order-status-machine.test.ts`, `tests/pbt/cart-total.test.ts`, `tests/e2e/buyer-checkout.spec.ts` |
| 4 | Phase 3 — order-fulfillment | Wave 3 | `src/modules/order-fulfillment/`, `src/app/(admin)/orders/`, `src/app/api/seller/orders/`, `src/components/ui/ConfirmDialog.tsx`, `tests/integration/order-fulfillment/`, `tests/e2e/seller-advance-status.spec.ts`, `tests/e2e/seller-cancel-order.spec.ts` |
| 5 | Phase 4 — sales-analytics | Wave 4 | `src/modules/sales-analytics/`, `src/app/(admin)/dashboard/`, `src/app/api/seller/analytics/`, `tests/pbt/revenue-inclusion.test.ts`, `tests/integration/sales-analytics/` |
| 6 | Phase 5 — Hardening & Deployment | Wave 5 | `src/app/api/cron/`, `vercel.json`, `src/app/(storefront)/{loading,error}.tsx`, `src/app/(admin)/{loading,error}.tsx`, `src/app/not-found.tsx`, `tests/e2e/login-throttle.spec.ts`, `README.md`, `.env.example` |

No file ownership overlap exists between waves — each phase touches distinct paths. The Wave 4 entry includes `src/components/ui/ConfirmDialog.tsx` which is in the shared components area; Wave 1 owns `src/components/ui/` overall (initial shadcn primitives), but `ConfirmDialog` is added in Wave 4 as a new file under that path. This is documented as an exception: Wave 4 can add files under `src/components/ui/` only when those files do not exist after Wave 1.

---

## Coverage Map (Stories → Tasks)

| Story | Tasks |
|-------|-------|
| US-001 Seller logs in/out | 0.3, 1.1, 1.2, 5.1 |
| US-002 Seller manages own products | 0.2, 1.3, 1.4, 1.5, 1.6 |
| US-003 Buyer browses products | 0.2, 2.1 |
| US-004 Buyer adds to cart | 2.2, 2.7 |
| US-005 Buyer info + payment | 0.4, 2.5 |
| US-006 Buyer places order + confirmation | 2.3, 2.4, 2.5, 2.6, 2.7, 1.6 (atomic stock dependency) |
| US-007 Seller views orders by status | 3.1, 3.2 |
| US-008 Advance order status | 2.3, 3.3, 3.4, 3.5 |
| US-009 Cancel order | 3.3, 3.4, 3.5 |
| US-010 Sales/order charts | 4.1, 4.2, 4.3, 4.4 |
| US-011 Top-seller leaderboard | 4.1, 4.2, 4.4 |
| US-012 Top-selling products | 4.1, 4.2, 4.4 |

## Coverage Map (Correctness Properties → Tasks)

| Property | Task |
|----------|------|
| P1 Stock non-negativity | 1.6 |
| P2 Order status state machine | 2.7 |
| P3 Revenue inclusion rule | 4.5 |
| P4 Cart total formula | 2.7 |
