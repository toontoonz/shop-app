# Design — Implementation Plan

## Directory Structure

```
shop-app/
├── .github/
│   └── workflows/
│       └── ci.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                                       # Next.js App Router
│   │   ├── (storefront)/                          # Public buyer pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                          # Storefront product list
│   │   │   ├── product/[id]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   └── confirmation/[orderId]/page.tsx
│   │   ├── (admin)/                               # Authenticated seller pages
│   │   │   ├── layout.tsx                         # Auth guard
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── products/new/page.tsx
│   │   │   ├── products/[id]/edit/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── orders/[id]/page.tsx
│   │   ├── api/                                   # Route handlers
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── products/[id]/route.ts
│   │   │   ├── cart/route.ts
│   │   │   ├── cart/lines/[productId]/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── orders/[id]/confirmation/route.ts
│   │   │   ├── seller/products/route.ts
│   │   │   ├── seller/products/[id]/route.ts
│   │   │   ├── seller/orders/route.ts
│   │   │   ├── seller/orders/[id]/route.ts
│   │   │   ├── seller/orders/[id]/advance-status/route.ts
│   │   │   ├── seller/orders/[id]/cancel/route.ts
│   │   │   ├── seller/analytics/sales/route.ts
│   │   │   ├── seller/analytics/orders-by-status/route.ts
│   │   │   ├── seller/analytics/top-sellers/route.ts
│   │   │   ├── seller/analytics/top-products/route.ts
│   │   │   └── cron/cleanup-failed-logins/route.ts
│   │   ├── layout.tsx                             # Root layout with font, theme
│   │   ├── globals.css
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── modules/
│   │   ├── seller-account-catalog/
│   │   │   ├── domain/                            # Entities, VOs (pure)
│   │   │   ├── repositories/                      # Prisma data access
│   │   │   ├── services/                          # Business logic (auth, throttle)
│   │   │   ├── ui/                                # Module-specific React components
│   │   │   └── index.ts                           # Public barrel
│   │   ├── storefront-checkout/
│   │   │   ├── domain/                            # Order aggregate, Cart, VOs
│   │   │   ├── repositories/
│   │   │   ├── services/                          # Cart, checkout transaction
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   ├── order-fulfillment/
│   │   │   ├── domain/                            # OrderStatusEvent, transition rules
│   │   │   ├── repositories/
│   │   │   ├── services/                          # advance-status, cancel orchestration
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   └── sales-analytics/
│   │       ├── domain/                            # AnalyticsCriteria, TimeRange
│   │       ├── queries/                           # Read-only Prisma queries
│   │       ├── ui/
│   │       └── index.ts
│   ├── lib/                                       # Cross-cutting infrastructure
│   │   ├── db.ts                                  # Prisma client singleton
│   │   ├── auth.ts                                # Auth.js config
│   │   ├── auth-middleware.ts                     # withSellerAuth
│   │   ├── api-handler.ts                         # apiHandler error mapper
│   │   ├── validation/                            # Shared Zod schemas
│   │   ├── errors/                                # AppError classes
│   │   ├── money.ts
│   │   ├── time-range.ts
│   │   ├── log.ts
│   │   └── utils.ts
│   ├── components/
│   │   └── ui/                                    # shadcn/ui primitives
│   └── types/
│       └── env.d.ts
├── tests/
│   ├── unit/                                      # Vitest unit tests
│   ├── integration/                               # Vitest + test DB
│   ├── pbt/                                       # fast-check property tests
│   └── e2e/                                       # Playwright tests
├── .env.example
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── pnpm-lock.yaml
├── vercel.json                                    # Cron config
└── README.md
```

## Conventions

- **Filenames**: kebab-case for non-component files (`api-handler.ts`, `time-range.ts`); PascalCase for React component files (`ProductCard.tsx`).
- **Naming**: camelCase for variables, PascalCase for types/classes/components, UPPER_SNAKE for constants.
- **Imports**: TypeScript path aliases `@/*` mapped to `src/*`. Modules import each other via barrel `@/modules/{name}` — never via deep paths.
- **No defaults**: prefer named exports for everything except React components and Next.js page/route exports.
- **Module isolation** (ESLint `no-restricted-imports`): a module's internal files (`domain/`, `repositories/`, `services/`) cannot be imported from outside that module — only the barrel can.
- **Error handling**: throw `AppError` subclasses; `apiHandler` wraps every route to map them to HTTP responses.
- **Logging**: use `log` from `src/lib/log.ts`. Never `console.log` in production code.

## Required Environment Variables

| Variable | Purpose | Example (dev) |
|----------|---------|---------------|
| `DATABASE_URL` | Postgres connection | `postgres://user:pass@localhost:5432/shopapp` |
| `NEXTAUTH_SECRET` | Cookie signing for Auth.js + cart | (32-byte random hex) |
| `NEXTAUTH_URL` | Base URL for Auth.js callbacks | `http://localhost:3000` |
| `LOG_LEVEL` | Pino log level | `debug` |
| `CRON_SECRET` | Header check for `/api/cron/*` | (random string) |

`.env.example` lists all of these with placeholder values.

## Package Manager and Scripts

Package manager: **pnpm**.

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma migrate deploy && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:pbt": "vitest run tests/pbt",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

## Testing Strategy

| Layer | Tool | Location | What |
|-------|------|----------|------|
| Unit | Vitest | `tests/unit/` co-located via `*.test.ts` next to source | Pure functions: money formatting, time-range resolution, Zod schemas, Order aggregate methods |
| Integration | Vitest + test DB | `tests/integration/` | Repositories, transactional flows (checkout, advance, cancel), API route handlers |
| PBT | Vitest + fast-check | `tests/pbt/` | The four critical properties (see `correctness.md`) |
| E2E | Playwright | `tests/e2e/` | 4 critical flows: seller login + create product, buyer checkout end-to-end, seller advance status, seller cancel |

Test database: ephemeral Postgres via `docker-compose.test.yml` locally, and a separate Neon branch for CI. `vitest.integration.config.ts` runs migrations against this DB before each test file.

## CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate:deploy
        env: { DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres }
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm test:integration
        env: { DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres }
      - run: pnpm test:pbt
      # E2E run on a separate, slower job — left out of this minimal pipeline
```

Vercel auto-deploys on merge to `main` and creates preview deployments per PR.

## Implementation Phases (mapped to units' Development Sequence)

| Phase | Unit | Deliverables |
|-------|------|--------------|
| 1 | seller-account-catalog | Prisma schema + migrations, Auth.js setup, seller seed, login page, login throttle, product CRUD UI + API, ProductRepository |
| 2 | storefront-checkout | Cart cookie service, storefront pages (list + detail + search), CartDrawer, CheckoutForm, POST /api/checkout transaction (atomic stock decrement), confirmation page, OrderRepository |
| 3 | order-fulfillment | Orders list with status filter, OrderDetail page, advance-status/cancel APIs, Order.advanceStatus/cancel domain methods, OrderStatusEvent log, StatusTimeline UI |
| 4 | sales-analytics | analytics endpoints (sales, orders-by-status, top-sellers, top-products), TimeRangePicker, dashboard page wiring all 4 panels with Recharts |
| 5 (cross-cut) | — | E2E tests, README, deployment to Vercel + Neon, final lint/typecheck cleanup |

## Out-of-Scope Reminders

The implementation MUST NOT introduce: real payment integration, email/SMS notifications, shipping integration, reviews, advanced inventory features, promotions/coupons, refund workflow, buyer accounts, or self-service seller signup. These are explicitly excluded per requirements.md "Out of Scope" section and D1-11.
