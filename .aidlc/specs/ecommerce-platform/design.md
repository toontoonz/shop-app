# Design

## Summary
- **Architecture**: Modular Monolith — single Next.js 14+ App Router application deployed as one unit, internally divided into 4 modules (`seller-account-catalog`, `storefront-checkout`, `order-fulfillment`, `sales-analytics`) communicating via direct method calls through typed service interfaces.
- **Stack**: TypeScript / Next.js (App Router) / PostgreSQL / Prisma / Auth.js v5 / Tailwind + shadcn/ui / TanStack Query / Recharts / Vitest / Playwright / fast-check
- **Components**: 5 component groups (Storefront pages, Buyer Checkout flow, Seller Auth + Catalog UI, Seller Order Management UI, Seller Analytics dashboard) plus shared UI primitives from shadcn
- **Entities**: 7 entities — Seller, Product, Cart (in-memory + cookie), Order, OrderItem, OrderStatusEvent, FailedLogin
- **Endpoints**: ~22 API routes organized as public storefront + authenticated seller routes
- **Integrations**: None external — payment is mocked, no email/SMS/shipping integrations
- **PBT Properties**: 4 properties — stock-non-negative, status-state-machine, revenue-inclusion-rule, cart-total-formula
- **NFR**: Skipped per D1; default web-app expectations documented in requirements.md

## Architecture Overview

The system is a **Modular Monolith** built on Next.js App Router. A single deployment serves both the public buyer-facing storefront (route group `(storefront)`) and the authenticated seller backend (route group `(admin)`). Server-side logic is organized into 4 modules under `src/modules/`, each owning its domain entities, repositories, and services. Modules expose typed interfaces consumed by other modules through direct imports — no in-process events, no inter-service HTTP. A single PostgreSQL database backs the system; tables are conceptually owned by specific modules but transactions span tables when atomicity is needed (e.g., stock decrement during checkout).

UI is rendered with React Server Components for initial page loads (storefront list, dashboard), with TanStack Query hydrating client interactivity (cart updates, optimistic mutations on the seller side). Authentication for sellers uses Auth.js v5 with the Credentials provider and database sessions stored in Postgres via Prisma adapter. Buyers are anonymous — their session is just a signed cookie holding cart state.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App (Vercel)                       │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │  (storefront)        │         │  (admin)             │      │
│  │  Public buyer pages  │         │  Authenticated       │      │
│  │  (SSR, anonymous)    │         │  seller backend      │      │
│  └──────────┬───────────┘         └──────────┬───────────┘      │
│             │                                │                  │
│             └─── /api/... (Route Handlers) ──┘                  │
│                            │                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  src/modules/ (Modular Monolith)         │   │
│  │  ┌────────────────┐  ┌──────────────────┐                │   │
│  │  │ seller-account │  │ storefront-      │                │   │
│  │  │ -catalog       │◄─│ checkout         │                │   │
│  │  └────────┬───────┘  │ (owns Cart+Order)│                │   │
│  │           │          └────────┬─────────┘                │   │
│  │           │                   │                          │   │
│  │           ▼                   ▼                          │   │
│  │  ┌────────────────┐  ┌──────────────────┐                │   │
│  │  │ order-         │  │ sales-           │                │   │
│  │  │ fulfillment    │  │ analytics        │                │   │
│  │  │ (status FSM)   │  │ (read-only)      │                │   │
│  │  └────────────────┘  └──────────────────┘                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│                ┌────────────────────────┐                       │
│                │  Prisma ORM            │                       │
│                └───────────┬────────────┘                       │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
                   ┌────────────────────┐
                   │  PostgreSQL (Neon) │
                   └────────────────────┘
```

## Module Responsibility Map

| Module | Tables Owned | Public Service Interfaces |
|--------|--------------|---------------------------|
| seller-account-catalog | Seller, Product, FailedLogin, Auth.js Session/Account/VerificationToken | SellerAuthService, SellerRepository, ProductRepository |
| storefront-checkout | Order, OrderItem | OrderRepository, Order aggregate methods (advanceStatus, cancel) |
| order-fulfillment | OrderStatusEvent | OrderStatusEventRepository |
| sales-analytics | (none — read-only over Order, Product, Seller) | (none — leaf module) |

## Traceability Matrix

| Story | Module | Components | Endpoints | Entities |
|-------|--------|------------|-----------|----------|
| US-001 Seller login/logout | seller-account-catalog | LoginForm, LogoutButton | POST /api/auth/* (Auth.js) | Seller, FailedLogin, Session |
| US-002 Seller manages products | seller-account-catalog | ProductListSeller, ProductForm | GET/POST/PATCH/DELETE /api/seller/products | Seller, Product |
| US-003 Buyer browses storefront | storefront-checkout | StorefrontHome, ProductCard, ProductDetail, SearchBox | GET /api/products, GET /api/products/[id] | Product, Seller |
| US-004 Buyer cart | storefront-checkout | CartDrawer, CartLine, CartTotal | POST /api/cart, DELETE /api/cart/lines/[id] | Cart (cookie + memory), Product |
| US-005 Buyer info + payment | storefront-checkout | CheckoutForm, PaymentMethodPicker | (form posts to /api/checkout) | (BuyerInfo VO) |
| US-006 Place order + confirm | storefront-checkout | OrderConfirmation page | POST /api/checkout | Order, OrderItem, Product (stock decrement) |
| US-007 Seller views orders | order-fulfillment | OrdersListAdmin, StatusFilter, StatusBadge | GET /api/seller/orders | Order, OrderItem |
| US-008 Advance status | order-fulfillment | OrderDetailAdmin, AdvanceStatusButton | POST /api/seller/orders/[id]/advance-status | Order, OrderStatusEvent |
| US-009 Cancel order | order-fulfillment | CancelOrderButton, ConfirmDialog | POST /api/seller/orders/[id]/cancel | Order, OrderStatusEvent, Product (stock restore) |
| US-010 Sales/order charts | sales-analytics | SalesOverTimeChart, OrdersByStatusChart, TimeRangePicker | GET /api/seller/analytics/sales, GET /api/seller/analytics/orders-by-status | Order |
| US-011 Top-seller leaderboard | sales-analytics | TopSellersTable | GET /api/seller/analytics/top-sellers | Order, Seller |
| US-012 Top-selling products | sales-analytics | TopProductsTable | GET /api/seller/analytics/top-products | Order, OrderItem, Product |

## Detail References

| File | Purpose |
|------|---------|
| `design/components.md` | Component breakdown per module — pages, UI elements, props, state ownership |
| `design/data-model.md` | Prisma schema — full entity definitions, relations, indexes, money handling, soft-delete pattern |
| `design/api-spec.md` | API route specifications — request/response shapes, validation, authorization |
| `design/integration.md` | Inter-module communication patterns, Auth.js integration, money handling, cart cookie strategy |
| `design/implementation.md` | Directory structure, conventions, scripts, environment variables, deployment pipeline |
| `design/correctness.md` | Property-based test specifications for the four critical invariants |

## Key Design Decisions

1. **Money as integer satang (1/100 THB)** — All monetary values stored and computed as integers to avoid floating-point error. Display layer formats as `฿X.XX`.
2. **Order is owned by storefront-checkout** — Per units.md, the Order aggregate is born in checkout and exposes `advanceStatus()` and `cancel()` domain methods. order-fulfillment calls these methods rather than duplicating state-machine logic.
3. **Soft-delete for Product** — `Product.active=false` instead of hard delete, so historical orders retain readable line-item context. Storefront filters by `active=true`; OrderItem snapshots `productNameAtOrder` and `unitPriceSatang` at order time so display survives even hard deletes if introduced later.
4. **Atomic stock decrement at checkout** — Single Prisma transaction validates stock per line, decrements, and creates orders. On any failure the entire transaction rolls back. Implemented with `prisma.$transaction()` and conditional updates (`updateMany` with `where: { stock: { gte: qty } }` returning affected count).
5. **Cart in cookie, not DB** — Anonymous buyers; cart is a signed/encrypted cookie containing line items. Validation happens on every render (against current stock) and at checkout submission (against current price/stock).
6. **Single forward state machine + cancel terminal** — Order status transitions enforced server-side. Allowed transitions: `ordered → paid → packing → shipped`; `{ordered|paid|packing} → cancelled`. Any other transition is rejected with HTTP 409.
7. **Authorization centralized** — Every seller API route wraps its handler with `withSellerAuth(handler)` middleware that resolves the authenticated Seller and passes it to the handler. Ownership checks happen inside handlers using the resolved sellerId.

## External References

None — no external design system, API spec, or reference implementation referenced.
