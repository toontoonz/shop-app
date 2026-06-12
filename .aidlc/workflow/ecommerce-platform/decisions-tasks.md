# Tasks Decisions

## Context Summary
- **Feature**: ecommerce-platform — multi-seller e-commerce web app, Next.js 14+ Modular Monolith
- **Mode**: Comprehensive
- **Team**: Solo (1 developer), Standard MVP timeline (1-2 months)
- **Coverage**: ~25 components, 7 entities, 22 API endpoints, 0 external integrations, 4 PBT properties
- **Sequence**: seller-account-catalog → storefront-checkout → order-fulfillment → sales-analytics
- **Stack**: Next.js + TS + Prisma + Postgres + Auth.js + Tailwind/shadcn + TanStack Query + Recharts + Vitest + Playwright + fast-check

---

## Decision Questions

### D4-1: Task Breakdown Strategy
**Answer**: 1 — Feature-by-feature aligned with units (Phase 0 = setup, Phases 1-4 = one per unit, Phase 5 = hardening + deploy)

### D4-2: Implementation Approach (Test Discipline)
**Answer**: 1 — Hybrid: TDD for the 4 PBT properties + Order aggregate state machine; test-after for UI/integration code

### D4-3: Test Coverage Pyramid
**Answer**: 1 — Standard pyramid: Unit > Integration > 4 PBT properties > 4 selective E2E flows

### D4-4: Task Granularity
**Answer**: 1 — 1-2 days per task

### D4-5: Parallelism Strategy
**Answer**: 1 — Strictly sequential (single developer)

### D4-6: Estimates
**Answer**: 1 — T-shirt sizing (S = ~0.5 day, M = ~1 day, L = ~1.5-2 days)

### D4-7: E2E Test Inclusion
**Answer**: 1 — Yes, 4 critical flows: login throttle, buyer checkout, advance status, cancel order

### D4-8: Infrastructure & Deployment Tasks
**Answer**: 1 — Yes, included in Phase 0 (setup) and Phase 5 (production deploy)

### D4-9: PBT Tasks
**Answer**: 1 — One task per property (4 PBT tasks distributed across the relevant phases)

### D4-10: Database Migration Tasks
**Answer**: 1 — One explicit migration task in Phase 0 (initial Prisma schema with all models + DB-level CHECK constraints + dev seed)

### D4-11: API Documentation
**Answer**: 1 — No formal API docs; design/api-spec.md is the source of truth (internal-only API)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D4-1 BreakdownStrategy: Feature-by-feature aligned with units (Phase 0 setup → Phase 1-4 one per unit → Phase 5 hardening+deploy)
- D4-2 ImplementationApproach: Hybrid (TDD for PBT properties + Order state machine, test-after elsewhere)
- D4-3 TestPyramid: Standard pyramid (Unit > Integration > PBT > selective E2E)
- D4-4 TaskGranularity: 1-2 days per task
- D4-5 Parallelism: Strictly sequential (solo dev)
- D4-6 Estimates: T-shirt (S/M/L)
- D4-7 E2EInclusion: Yes — 4 critical flows
- D4-8 InfraTasks: Yes — Phase 0 setup + Phase 5 prod deploy
- D4-9 PBTTasks: One task per property (4 PBT tasks)
- D4-10 MigrationTasks: One explicit migration task in Phase 0
- D4-11 APIDocs: None (design/api-spec.md is source of truth)

---

**Validation Notes**: All 11 D4 answers checked.
- Testing strategy present (no flag)
- Sequential execution (no coordination conflict)
- E2E framework + tasks aligned (no flag)
- CI/CD pipeline tasks included (no flag)
- DB migration task included (no flag)
- Cloud deploy + infra tasks present (no flag)
- API docs decision consistent with D3 (internal-only)
- Task count vs timeline: ~33 tasks @ 1-2 days each fits in 1-2 month solo MVP timeline (within 🟡 medium range — flagged for awareness, not blocking; the "Hardening" phase is the natural cushion)

No blocking conflicts. Ready to generate tasks.md.
