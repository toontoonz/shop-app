---
inclusion: always
---

# Project Structure

## Summary
- **Repo**: Single repo, Modular Monolith
- **Source**: `src/app/` (Next.js routes), `src/modules/` (4 domain modules), `src/lib/` (cross-cutting)
- **Entry**: Next.js app — pages and route handlers under `src/app/`

## Repository

- **Type**: Single repo, single package
- **Root**: `shop-app/` workspace root containing the Next.js application

## Key Directories

| Directory | Purpose | Key Contents |
|-----------|---------|-------------|
| `prisma/` | Database schema and migrations | `schema.prisma`, `migrations/`, `seed.ts` |
| `src/app/` | Next.js App Router routes | `(storefront)/` route group (public buyer pages), `(admin)/` route group (auth-guarded seller pages), `api/` route handlers |
| `src/modules/` | Domain modules (Modular Monolith boundaries) | `seller-account-catalog/`, `storefront-checkout/`, `order-fulfillment/`, `sales-analytics/` — each with `domain/`, `repositories/`, `services/`, `ui/`, `index.ts` |
| `src/lib/` | Cross-cutting infrastructure | `db.ts`, `auth.ts`, `auth-middleware.ts`, `api-handler.ts`, `validation/`, `errors/`, `money.ts`, `time-range.ts`, `log.ts` |
| `src/components/ui/` | Shared shadcn/ui primitives | Button, Input, Form, Dialog, Table, etc. |
| `tests/` | Test suites by layer | `unit/`, `integration/`, `pbt/`, `e2e/` |
| `.github/workflows/` | CI configuration | `ci.yml` |

## Key Files

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Dependencies and scripts | Scripts: dev, build, start, lint, typecheck, test, test:integration, test:pbt, test:e2e, db:* |
| `tsconfig.json` | TypeScript config | Strict mode, `@/*` → `src/*` path alias |
| `next.config.ts` | Next.js config | App Router enabled, image domains for product images |
| `tailwind.config.ts` | Tailwind theme | Noto Sans Thai font, shadcn/ui color tokens |
| `prisma/schema.prisma` | Database schema | All models: Seller, Product, Order, OrderItem, OrderStatusEvent, FailedLogin, Auth.js tables |
| `vitest.config.ts` | Unit test config | jsdom env for component tests, node for service tests |
| `vitest.integration.config.ts` | Integration test config | Sets up test DB before each file |
| `playwright.config.ts` | E2E test config | Chromium only for MVP |
| `.env.example` | Environment variable documentation | Lists required vars with placeholder values |
| `vercel.json` | Vercel cron config | Daily cleanup of FailedLogin rows |

## Entry Points

| Entry Point | Type | Description |
|-------------|------|-------------|
| `src/app/(storefront)/page.tsx` | Public buyer storefront | Product list with search |
| `src/app/(admin)/login/page.tsx` | Seller login page | Auth.js Credentials sign-in |
| `src/app/(admin)/dashboard/page.tsx` | Seller analytics dashboard | After-login landing |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js routes | All Auth.js endpoints |
| `src/app/api/checkout/route.ts` | Mock-payment checkout | POST creates orders atomically |
| `src/app/api/cron/cleanup-failed-logins/route.ts` | Daily cron | Vercel-triggered cleanup |

## Module Boundaries

Per ESLint `no-restricted-imports`:
- A module may import from another module ONLY via the barrel: `import { X } from '@/modules/{other-module}'`
- Direct deep imports (e.g., `@/modules/seller-account-catalog/repositories/seller`) from outside that module are **forbidden**
- Within a module, files may import each other freely

This rule keeps the Modular Monolith honest — modules are physically reorganizable into separate packages later if growth requires it.
