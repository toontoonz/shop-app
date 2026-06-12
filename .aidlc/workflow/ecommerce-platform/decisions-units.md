# Decomposition Decisions

## Context Summary
- **Project**: Multi-seller e-commerce web app (greenfield)
- **Team**: Solo (1 developer), Standard MVP timeline (1-2 months)
- **Stories**: 12 stories across 5 functional areas
- **Functional areas**: Authentication (1), Catalog (1), Storefront & Checkout (4), Order Management (3), Analytics (3)
- **User types**: Buyer (anonymous), Seller (authenticated, multi-seller marketplace)
- **Integrations**: None — payment is mocked
- **Key shared entities**: Seller, Product, Order (with line items), BuyerInfo

---

## Decision Questions

### D2-1: Architecture Pattern
**Question**: ระบบจะใช้ architecture pattern แบบไหน?
- 1) **Modular Monolith** — single deployment, แบ่ง module ภายใน, communication ผ่าน function/method calls **(Recommended)**
- 2) Microservices
- 3) Frontend SPA + Single backend API
- 4) Other: _______

**Answer**: 1 — Modular Monolith

---

### D2-2: Decomposition Strategy
**Question**: ใช้กลยุทธ์การแบ่งหน่วยงานแบบไหน?
- 1) **Domain-Driven** — แบ่งตาม business domain ตาม functional area **(Recommended)**
- 2) Layer-Based
- 3) User Journey-Based
- 4) Hybrid
- 5) Other: _______

**Answer**: 1 — Domain-Driven

---

### D2-3: Unit Breakdown Proposal
**Question**: ควรแบ่งเป็นกี่ unit?
- 1) **4 units** — `seller-account-catalog`, `storefront-checkout`, `order-fulfillment`, `sales-analytics` **(Recommended)**
- 2) 3 units (รวม fulfillment+analytics)
- 3) 5 units (แยก auth ออกจาก catalog)
- 4) Other: _______

**Answer**: 1 — 4 units

| Unit | Stories | Purpose |
|------|---------|---------|
| `seller-account-catalog` | US-001, US-002 | Seller authentication + Product CRUD |
| `storefront-checkout` | US-003, US-004, US-005, US-006 | Buyer browse, cart, info collection, mock payment, order placement |
| `order-fulfillment` | US-007, US-008, US-009 | Seller views/filters orders, advances status, cancels |
| `sales-analytics` | US-010, US-011, US-012 | Sales charts, top-seller leaderboard, top products |

---

### D2-4: Inter-Unit Communication Pattern
**Question**: หน่วยต่างๆ สื่อสารกันอย่างไร? (สำหรับ Modular Monolith)
- 1) **Direct method/function calls** — ผ่าน service interfaces ภายใน process เดียวกัน **(Recommended)**
- 2) Domain events (in-process)
- 3) HTTP API ระหว่าง units
- 4) Other: _______

**Answer**: 1 — Direct method/function calls via service interfaces

---

### D2-5: Data Ownership Model
**Question**: แต่ละ unit เป็นเจ้าของ data อย่างไร?
- 1) **Single shared database, ownership by table** **(Recommended)**
- 2) Database per unit
- 3) Shared DB with schemas per unit
- 4) Other: _______

**Answer**: 1 — Single shared database, ownership by table (each unit "owns" specific tables by convention)

---

### D2-6: Shared Kernel
**Question**: จัดการ shared types/entities ที่ใช้ข้าม units อย่างไร?
- 1) **No formal shared kernel — define entities in their owner unit, other units import from there** **(Recommended)**
- 2) Dedicated shared-kernel unit
- 3) Each unit defines its own DTO and maps at boundary
- 4) Other: _______

**Answer**: 1 — No formal shared kernel; entities live in their owner unit, other units import via direct dependency

---

### D2-7: Development Sequence
**Question**: ลำดับการพัฒนาที่เหมาะสม?
- 1) **Sequential dependency-first**: `seller-account-catalog` → `storefront-checkout` → `order-fulfillment` → `sales-analytics` **(Recommended)**
- 2) Parallel by user type
- 3) Vertical slice
- 4) Other: _______

**Answer**: 1 — Sequential dependency-first

---

### D2-8: Frontend Decomposition
**Question**: ฝั่ง frontend จะแบ่งตาม unit เดียวกันกับ backend หรือไม่?
- 1) **Yes — unit boundary applies to both frontend and backend** (full-stack vertical slice per unit) **(Recommended)**
- 2) No — frontend เป็น app เดียว
- 3) Frontend แบ่งเป็น 2 apps (storefront/backend) เท่านั้น
- 4) Other: _______

**Answer**: 1 — Yes, unit boundary applies to both frontend and backend (full-stack vertical slice)

---

## Decisions Summary
<!-- Machine-readable compact summary. Downstream phases: read ONLY this section. -->
- D2-1 ArchitecturePattern: Modular Monolith — single deployment, module-internal function calls
- D2-2 DecompositionStrategy: Domain-Driven — units align with business domains
- D2-3 UnitBreakdown: 4 units — seller-account-catalog, storefront-checkout, order-fulfillment, sales-analytics
- D2-4 CommunicationPattern: Direct method/function calls via typed service interfaces
- D2-5 DataOwnership: Single shared database, ownership by table convention
- D2-6 SharedKernel: No formal shared kernel; entities live in their owner unit, consumed via direct import
- D2-7 DevelopmentSequence: Sequential dependency-first (Unit 1 → 2 → 3 → 4)
- D2-8 FrontendDecomposition: Yes — full-stack vertical slice per unit

---

**Validation Notes**: All answers checked against D2 validation rules.
- Over-Decomposition: stories=12 > threshold 10 → not flagged
- Microservices for Small Team: arch=Modular Monolith → not applicable
- Circular Dependencies: dependency chain is forward (1→2→3, 1→2→4, 1→3, 2→4) → no cycles
- Unit Too Small: minimum 2 stories per unit (Unit 1) → at threshold, justified by clear seller-side foundational role
- Unit Too Large: maximum 4 stories per unit (Unit 2) → well below 15
- Bottleneck Unit: Unit 1 has 3 dependents (Units 2, 3, 4) → at threshold but not exceeding (rule: >3)
- Missing Shared Kernel: Resolved by D2-6 — owner-based entity ownership designates a single owner per entity
- Unbalanced Distribution: max/min ratio = 4/2 = 2x → below 3x threshold

No conflicts detected. Ready to generate units.md.
