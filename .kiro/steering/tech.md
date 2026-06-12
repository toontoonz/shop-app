---
inclusion: always
---

# Technology Context

## Summary
- **Stack**: TypeScript / Next.js 14+ (App Router) / PostgreSQL / Prisma
- **Architecture**: Modular Monolith / REST via Next.js Route Handlers
- **Infra**: Vercel + Neon (managed Postgres) / GitHub Actions CI

## Stack

- **Languages**: TypeScript (strict mode)
- **Frameworks**: Next.js 14+ (App Router, React Server Components), React 18+
- **Build System**: Next.js / Turbopack (dev), Vercel build pipeline (production)
- **Package Manager**: pnpm
- **Testing**: Vitest (unit + integration), Playwright (selective E2E), fast-check (property-based)

## Architecture

- **Pattern**: Modular Monolith — single Next.js deployment, internal module boundaries (`src/modules/{seller-account-catalog,storefront-checkout,order-fulfillment,sales-analytics}`), direct method calls via barrel imports
- **API Style**: REST (Next.js Route Handlers under `src/app/api/`)

## Infrastructure

- **Cloud Provider**: Vercel (app), Neon (managed Postgres)
- **Compute**: Vercel serverless functions (Edge runtime where applicable; Node runtime for Prisma)
- **Database**: PostgreSQL (Neon serverless driver in production, local Docker in dev)
- **IaC Tool**: None — Vercel project + Neon configured through their dashboards. Vercel cron config in `vercel.json`.

## Patterns & Conventions

- **Architecture pattern**: Layered within each module — `domain/` (entities, value objects) → `repositories/` (Prisma data access) → `services/` (business logic) → `ui/` (React components). Page-level routes in `src/app/` import services from modules via the barrel.
- **Data access**: Prisma ORM with schema-first model (`prisma/schema.prisma`). Migrations via `prisma migrate dev` (local) and `prisma migrate deploy` (Vercel build hook).
- **API response format**: Envelope `{ ok: true, data: T } | { ok: false, error: { code, message, fields? } }`. Error codes: `VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_ERROR`.
- **Error handling**: Custom `AppError` subclasses thrown from services; `apiHandler(fn)` wrapper maps them to HTTP responses; uncaught errors logged as `INTERNAL_ERROR` (500).
- **Authentication**: Auth.js v5 with Credentials provider, database session strategy via Prisma adapter, bcrypt (cost 12) for password hashing. Login throttle: 5 failures / 15 min / username (FailedLogin table + LoginThrottle service).
- **Validation**: Zod schemas in `src/lib/validation/`. Same schema used by React Hook Form (client) and route handlers (server) — single source of truth.
- **Logging**: pino structured JSON via `src/lib/log.ts`. Levels controlled by `LOG_LEVEL` env var. No `console.log` in production code.
- **Code style**: ESLint + Prettier with default Next.js config plus `no-restricted-imports` to enforce module boundaries (modules importable only via barrel `index.ts`).
- **Naming conventions**: kebab-case for non-component filenames; PascalCase for React component files and types/classes; camelCase for variables; UPPER_SNAKE for constants. Path alias `@/*` → `src/*`.
- **Branch strategy**: Trunk-based — `main` branch deploys to production via Vercel; PRs get preview deployments.

## Environment Configuration

- **Config approach**: `.env.local` for development (gitignored); Vercel project environment variables for staging/production.
- **Environments**: development (local), preview (Vercel per-PR), production (Vercel main).
- **Secrets management**: Vercel encrypted env vars + `NEXTAUTH_SECRET` rotation per deployment.
- **Required env vars**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LOG_LEVEL`, `CRON_SECRET`. Listed in `.env.example`.

## CI/CD Pipeline

- **Tool**: GitHub Actions (`.github/workflows/ci.yml`) for lint/typecheck/tests; Vercel for build + deploy.
- **Stages**: install → migrate (test DB) → lint → typecheck → unit tests → integration tests → PBT → (Vercel auto-deploy)
- **Deploy target**: Vercel (auto on push to main, preview per PR)

## Dependency Management

- **Lockfile**: `pnpm-lock.yaml` committed
- **Version strategy**: Caret ranges in `package.json` for libraries, exact for dev tools where reproducibility matters. Renovate or Dependabot for periodic upgrade PRs (post-MVP).
- **Monorepo tooling**: N/A — single-package repo

## Money Handling Convention

- All monetary values stored, computed, and serialized as integer **satang** (1 THB = 100 satang) under field names ending in `Satang`.
- Display: `formatTHB(satang)` in `src/lib/money.ts` produces `฿X.XX`.
- Form input: `parseTHBInput(input)` parses user-entered THB string to satang.

## UI Convention

- Tailwind CSS with shadcn/ui components copied into `src/components/ui/`. Customize through Tailwind theme rather than per-component overrides where possible.
- Font: Noto Sans Thai (loaded via `next/font/google`).
- Charts: Recharts.
- Forms: React Hook Form + Zod resolver.
- Server state: TanStack Query v5 for client interactivity; Server Components for initial render.

## Testing Convention

- Unit + integration tests live in `tests/` mirroring `src/`. Test files end in `.test.ts`/`.test.tsx`.
- Property-based tests in `tests/pbt/` cover the four mandatory invariants (stock non-negativity, status state machine, revenue inclusion, cart total).
- E2E tests in `tests/e2e/` cover four critical user flows (login throttle, buyer checkout, advance status, cancel order).
