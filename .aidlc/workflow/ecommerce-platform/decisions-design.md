# Design Decisions

## Context Summary
- **Project**: Multi-seller e-commerce web app, Greenfield, Modular Monolith
- **Mode**: Comprehensive (single design pass for all 4 units: seller-account-catalog, storefront-checkout, order-fulfillment, sales-analytics)
- **Team**: Solo (1 developer), Standard MVP timeline (1-2 months)
- **Stories**: 12 stories, no external integrations (mock payment), Thai-only UI
- **Architecture (D2-1)**: Modular Monolith
- **Communication (D2-4)**: Direct method/function calls
- **Data Ownership (D2-5)**: Single shared database, ownership by table convention

---

## Decision Questions

### D3-1: Tech Stack Approach
- 1) **Next.js (App Router) full-stack (Recommended)**
- 2) Separate React + Express/Fastify
- 3) Remix
- 4) SvelteKit

**Answer**: 1 — Next.js 14+ App Router full-stack

### D3-2: Programming Language
- 1) **TypeScript (Recommended)**
- 2) JavaScript

**Answer**: 1 — TypeScript

### D3-3: Database Technology
- 1) **PostgreSQL (Recommended)**
- 2) MySQL/MariaDB
- 3) SQLite
- 4) MongoDB

**Answer**: 1 — PostgreSQL (managed via Neon / Vercel Postgres for production, local Docker for dev)

### D3-4: Database ORM
- 1) **Prisma (Recommended)**
- 2) Drizzle
- 3) TypeORM
- 4) Raw SQL

**Answer**: 1 — Prisma

### D3-5: Authentication Strategy
- 1) **Auth.js (NextAuth) v5 with Credentials provider + database session (Recommended)**
- 2) Custom session-based
- 3) JWT-based custom
- 4) Lucia Auth

**Answer**: 1 — Auth.js v5 with Credentials provider, database sessions, bcrypt password hashing

### D3-6: Validation Library
- 1) **Zod (Recommended)**
- 2) Yup
- 3) Joi
- 4) Valibot

**Answer**: 1 — Zod

### D3-7: UI Styling and Component Library
- 1) **Tailwind CSS + shadcn/ui (Recommended)**
- 2) MUI
- 3) Ant Design
- 4) Chakra
- 5) Plain CSS

**Answer**: 1 — Tailwind CSS + shadcn/ui (with Thai-friendly font: IBM Plex Sans Thai or Noto Sans Thai)

### D3-8: Data Fetching
- 1) **TanStack Query for client + Next.js Server Components for SSR pages (Recommended)**
- 2) SWR
- 3) Server-only
- 4) Direct fetch

**Answer**: 1 — TanStack Query (React Query v5) for client interactivity, Next.js Server Components for initial render of storefront and dashboard pages

### D3-9: Form Handling
- 1) **React Hook Form + Zod resolver (Recommended)**
- 2) Formik
- 3) Native + Server Actions

**Answer**: 1 — React Hook Form + @hookform/resolvers (zod)

### D3-10: Charts Library
- 1) **Recharts (Recommended)**
- 2) Chart.js
- 3) Tremor
- 4) Visx

**Answer**: 1 — Recharts

### D3-11: Testing Approach
- 1) **Vitest (unit) + Playwright (E2E selective) (Recommended)**
- 2) Jest + Cypress
- 3) Vitest only

**Answer**: 1 — Vitest for unit + integration; Playwright for critical end-to-end flows (checkout, status update, login throttle)

### D3-12: Correctness & Property-Based Testing (MANDATORY)
- 1) **Yes — fast-check for critical invariants (Recommended)**
- 2) Yes — comprehensive
- 3) No

**Answer**: 1 — fast-check (TypeScript) for the four critical invariants: stock-non-negative, order-status state machine, revenue inclusion rule, cart-total formula

### D3-13: Repository Structure
- 1) **Single repo, Modular Monolith with src/modules/ (Recommended)**
- 2) Monorepo (Turborepo)
- 3) Multi-repo

**Answer**: 1 — Single repo with `src/modules/{seller-account-catalog,storefront-checkout,order-fulfillment,sales-analytics}/` plus shared `src/lib/` and `src/components/ui/`

### D3-14: Hosting & Deployment
- 1) **Vercel (Recommended)**
- 2) Self-hosted Docker
- 3) Railway/Render
- 4) AWS

**Answer**: 1 — Vercel for the Next.js app + Neon (or Vercel Postgres) for managed PostgreSQL

### D3-15: CI/CD
- 1) **GitHub Actions (Recommended)**
- 2) Vercel built-in only
- 3) GitLab CI
- 4) None

**Answer**: 1 — GitHub Actions pipeline (lint → typecheck → unit/integration tests → PBT) + Vercel auto-deploy on push to main and per-PR preview

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D3-1 TechStack: Next.js 14+ App Router full-stack
- D3-2 Language: TypeScript (strict)
- D3-3 Database: PostgreSQL (Neon/Vercel Postgres in prod, Docker locally)
- D3-4 ORM: Prisma (schema-first, migrations)
- D3-5 Auth: Auth.js v5 Credentials provider + database sessions + bcrypt
- D3-6 Validation: Zod (shared schemas for forms and API)
- D3-7 UI: Tailwind CSS + shadcn/ui + Noto Sans Thai font
- D3-8 DataFetching: TanStack Query v5 + Next.js Server Components
- D3-9 Forms: React Hook Form + Zod resolver
- D3-10 Charts: Recharts
- D3-11 Testing: Vitest (unit/integration) + Playwright (selective E2E)
- D3-12 PBT: Yes — fast-check for stock/status/revenue/cart invariants
- D3-13 RepoStructure: Single repo, src/modules/{4-units} + src/lib + src/components/ui
- D3-14 Hosting: Vercel + managed Postgres (Neon)
- D3-15 CICD: GitHub Actions pipeline + Vercel auto-deploy

---

**Validation Notes**: All answers checked against D3 validation rules (foundation consistency N/A — comprehensive mode, no foundation). Tech stack is internally consistent (Next.js + TS + Prisma + PostgreSQL + Auth.js). No microservices conflicts (Modular Monolith). No PII compliance flags. Single platform (web). No conflicts detected. Ready to generate design documents.
