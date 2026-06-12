# Shop App — Multi-Seller E-Commerce Platform

เว็บแอพฯ ร้านค้าออนไลน์ระบบ marketplace ที่ผู้ซื้อเลือกสินค้าและสั่งซื้อแบบ mock payment, ผู้ขายจัดการออเดอร์ตามสถานะ 4 ขั้น + ดูกราฟวิเคราะห์ยอดขาย

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript strict)
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: Auth.js v5 (Credentials + database sessions + bcrypt)
- **UI**: Tailwind CSS + shadcn/ui (base-nova) + Noto Sans Thai
- **Charts**: Recharts
- **Testing**: Vitest + fast-check (PBT) + Playwright (E2E)
- **Hosting**: Vercel + Neon (managed Postgres)

## Prerequisites

- Node.js 22+
- pnpm 11+
- Docker (for local Postgres)

## Local Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd shop-app
pnpm install

# 2. Start Postgres (port 5433 to avoid conflicts)
docker compose up -d

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your secrets (defaults work with docker-compose)

# 4. Run migrations + seed
pnpm db:migrate:dev
pnpm db:seed

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — storefront.
Login at [http://localhost:3000/login](http://localhost:3000/login) — seller backend (username: `demo`, password: `demo1234`).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:integration` | Integration tests (requires DB) |
| `pnpm test:pbt` | Property-based tests (fast-check) |
| `pnpm test:e2e` | End-to-end tests (Playwright, requires dev server) |
| `pnpm db:migrate:dev` | Create/apply Prisma migrations |
| `pnpm db:seed` | Seed demo data (2 sellers, 6 products) |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Architecture

Modular Monolith — 4 domain modules under `src/modules/`:

| Module | Responsibility |
|--------|----------------|
| `seller-account-catalog` | Seller auth, product CRUD, login throttle |
| `storefront-checkout` | Public browse, cart, checkout, order creation |
| `order-fulfillment` | Order status management, advance/cancel |
| `sales-analytics` | Dashboard charts, top-sellers, top-products |

Modules communicate via barrel imports (`@/modules/{name}`). ESLint enforces no deep cross-module imports.

## Creating Seller Accounts

Seller accounts are admin-issued (no self-signup). To create a new seller:

```bash
# Via Prisma Studio
pnpm db:studio
# → Create a new Seller record with username + bcrypt-hashed password
```

Or add to `prisma/seed.ts` and re-run `pnpm db:seed`.

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Create Vercel project, link to repo
3. Create Neon Postgres database
4. Set environment variables in Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`
5. Deploy — Prisma migrations run automatically in the build step

## Out of Scope (MVP)

- Real payment API integration
- Email/SMS notifications
- Shipping/tracking integration
- Reviews and ratings
- Advanced inventory (low-stock alerts, auto-reorder)
- Promotions/coupons
- Refund workflow
- Buyer accounts (anonymous checkout only)
- Self-service seller signup
