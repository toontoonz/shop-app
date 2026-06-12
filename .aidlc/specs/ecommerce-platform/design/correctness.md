# Design — Correctness & Property-Based Testing

Per D3-12, this project uses **fast-check** to assert critical business invariants via property-based tests. Properties live under `tests/pbt/`. Each property is encoded as one or more `fc.assert(fc.property(...))` declarations. Properties run in CI as part of the standard test pipeline.

The four properties below cover the highest-stakes invariants. Other properties may be added during implementation but these four are mandatory.

---

## P1: Stock Non-Negativity

**Statement**: For any sequence of legal Product mutations (createProduct, decrementStock, incrementStock), the resulting `Product.stock` value SHALL never be negative.

**Critical because**: Overselling is the worst possible failure of an e-commerce system. The atomic stock decrement at checkout (US-006 AC#3, AC#4) is the lynchpin.

**Test sketch** (`tests/pbt/stock-non-negativity.test.ts`):
```ts
import fc from 'fast-check';
import { ProductRepository } from '@/modules/seller-account-catalog';
import { resetTestDb, seedSeller } from '../helpers';

const operationArb = fc.oneof(
  fc.record({ kind: fc.constant('decrement'), qty: fc.integer({ min: 1, max: 10 }) }),
  fc.record({ kind: fc.constant('increment'), qty: fc.integer({ min: 1, max: 10 }) }),
);

it('Property: stock never goes negative across arbitrary operation sequences', () => {
  return fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 100 }),       // initial stock
      fc.array(operationArb, { maxLength: 30 }),
      async (initialStock, ops) => {
        await resetTestDb();
        const seller = await seedSeller();
        const product = await ProductRepository.create({ sellerId: seller.id, name: 'P', priceSatang: 100, stock: initialStock });
        for (const op of ops) {
          if (op.kind === 'decrement') {
            // The repository contract: returns null when insufficient stock; never produces a negative value
            await ProductRepository.tryDecrementStock(product.id, op.qty).catch(() => null);
          } else {
            await ProductRepository.incrementStock(product.id, op.qty);
          }
        }
        const fresh = await ProductRepository.findById(product.id);
        expect(fresh!.stock).toBeGreaterThanOrEqual(0);
      },
    ),
    { numRuns: 50 },
  );
});
```

This property is also reinforced at the database level by the migration constraint `CHECK stock >= 0` (see `data-model.md`).

---

## P2: Order Status State Machine

**Statement**: For any Order, calling `Order.advanceStatus(actorSellerId)` and `Order.cancel(actorSellerId)` in arbitrary orders SHALL only produce status sequences that match the allowed transitions:
- `ORDERED → PAID → PACKING → SHIPPED` (forward)
- `{ORDERED, PAID, PACKING} → CANCELLED` (cancel)
- Any other transition SHALL throw `InvalidTransitionError`.

**Critical because**: Status corruption (e.g., shipping a cancelled order, advancing past shipped) breaks fulfillment trust and analytics.

**Test sketch** (`tests/pbt/order-status-machine.test.ts`):
```ts
import fc from 'fast-check';
import { Order } from '@/modules/storefront-checkout';
import { OrderStatus } from '@prisma/client';

const ALLOWED_FORWARDS: Record<OrderStatus, OrderStatus | null> = {
  ORDERED: 'PAID', PAID: 'PACKING', PACKING: 'SHIPPED', SHIPPED: null, CANCELLED: null,
};
const CANCELLABLE = new Set(['ORDERED','PAID','PACKING'] as OrderStatus[]);

it('Property: status transitions only follow allowed paths', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom('advance','cancel') as fc.Arbitrary<'advance'|'cancel'>, { maxLength: 10 }),
      (operations) => {
        const order = new Order({ id: 'o1', sellerId: 's1', status: 'ORDERED', /* ...minimal fixture... */ });
        for (const op of operations) {
          const before = order.status;
          try {
            if (op === 'advance') order.advanceStatus('s1');
            else order.cancel('s1');
            // If no throw, the transition must be allowed.
            const after = order.status;
            if (op === 'advance') {
              expect(ALLOWED_FORWARDS[before]).toBe(after);
            } else {
              expect(CANCELLABLE.has(before)).toBe(true);
              expect(after).toBe('CANCELLED');
            }
          } catch (e) {
            // A throw must mean the transition was NOT allowed.
            if (op === 'advance') expect(ALLOWED_FORWARDS[before]).toBeNull();
            else expect(CANCELLABLE.has(before)).toBe(false);
          }
        }
      },
    ),
  );
});
```

---

## P3: Revenue Inclusion Rule

**Statement**: For any set of Orders with arbitrary statuses, the analytics revenue total SHALL equal the sum of `totalSatang` for orders whose status is exactly one of `{PAID, PACKING, SHIPPED}`. Orders with status `ORDERED` or `CANCELLED` SHALL NOT contribute.

**Critical because**: Revenue inconsistency between charts and the leaderboard would mislead sellers about their actual performance.

**Test sketch** (`tests/pbt/revenue-inclusion.test.ts`):
```ts
import fc from 'fast-check';
import { computeRevenue } from '@/modules/sales-analytics';

const QUALIFYING = new Set<OrderStatus>(['PAID','PACKING','SHIPPED']);

const orderArb = fc.record({
  totalSatang: fc.integer({ min: 0, max: 1_000_000 }),
  status: fc.constantFrom<OrderStatus>('ORDERED','PAID','PACKING','SHIPPED','CANCELLED'),
});

it('Property: revenue sums only qualifying-status orders', () => {
  fc.assert(
    fc.property(fc.array(orderArb, { maxLength: 100 }), (orders) => {
      const computed = computeRevenue(orders);
      const expected = orders
        .filter(o => QUALIFYING.has(o.status))
        .reduce((s, o) => s + o.totalSatang, 0);
      expect(computed).toBe(expected);
    }),
  );
});
```

The same `computeRevenue` (or its inline equivalent) is used by the sales-over-time chart, the top-seller leaderboard, and the top-products panel. The single source of truth is `AnalyticsCriteria.qualifyingStatuses` in `src/modules/sales-analytics/domain/`.

---

## P4: Cart Total Formula

**Statement**: For any Cart whose lines have non-negative quantities and unit prices, `cartTotal = sum(line.unitPriceSatang * line.quantity)`. The total SHALL be non-negative and SHALL equal zero if the cart is empty.

**Critical because**: Mismatched totals between the UI (`CartTotal`) and the server (`/api/checkout` order totals) would let buyers pay one amount and sellers see another.

**Test sketch** (`tests/pbt/cart-total.test.ts`):
```ts
import fc from 'fast-check';
import { computeCartTotal } from '@/modules/storefront-checkout';

const lineArb = fc.record({
  unitPriceSatang: fc.integer({ min: 0, max: 100_000 }),
  quantity: fc.integer({ min: 1, max: 99 }),
});

it('Property: cart total equals sum of line subtotals', () => {
  fc.assert(
    fc.property(fc.array(lineArb, { maxLength: 50 }), (lines) => {
      const total = computeCartTotal(lines);
      const expected = lines.reduce((s, l) => s + l.unitPriceSatang * l.quantity, 0);
      expect(total).toBe(expected);
      expect(total).toBeGreaterThanOrEqual(0);
    }),
  );
});

it('Property: empty cart total is zero', () => {
  expect(computeCartTotal([])).toBe(0);
});
```

`computeCartTotal` is also exercised by integration tests (against full checkout flows), but the property test guarantees the formula independent of any particular checkout transaction.

---

## Property Catalog Summary

| # | Property | Module | Source of Invariant |
|---|----------|--------|---------------------|
| P1 | Stock non-negativity | seller-account-catalog | US-002 AC#1, US-006 AC#3 |
| P2 | Order status state machine | storefront-checkout (Order aggregate) | US-008 AC#2-#4, US-009 AC#1-#2 |
| P3 | Revenue inclusion rule | sales-analytics | US-010 AC#4, US-011 AC#2, US-012 AC#2 |
| P4 | Cart total formula | storefront-checkout | US-004 AC#5 |

These are the four properties marked mandatory in D3-12. Additional properties (e.g., authorization invariants, time-range bucket coverage) may be added during implementation but are not gated.

## Running Properties

```bash
pnpm test:pbt
```

Default `numRuns` = 100 per property in CI; locally developers can crank up via `--params.numRuns=1000` for stress runs. fast-check's shrinker reports minimal failing examples to make debugging fast.
