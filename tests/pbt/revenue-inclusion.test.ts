/**
 * Property P3: Revenue Inclusion Rule
 *
 * Statement: For any set of Orders with arbitrary statuses, the analytics revenue
 * total SHALL equal the sum of totalSatang for orders whose status is exactly one
 * of {PAID, PACKING, SHIPPED}. Orders with status ORDERED or CANCELLED SHALL NOT contribute.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeRevenue, QUALIFYING_STATUSES } from "@/modules/sales-analytics";
import { OrderStatus } from "@prisma/client";

const ALL_STATUSES = Object.values(OrderStatus);
const QUALIFYING_SET = new Set(QUALIFYING_STATUSES);

const orderArb = fc.record({
  totalSatang: fc.integer({ min: 0, max: 1_000_000 }),
  status: fc.constantFrom(...ALL_STATUSES),
});

describe("Property P3: Revenue Inclusion Rule", () => {
  it("revenue sums only qualifying-status orders", () => {
    fc.assert(
      fc.property(fc.array(orderArb, { maxLength: 100 }), (orders) => {
        const computed = computeRevenue(orders);
        const expected = orders
          .filter((o) => QUALIFYING_SET.has(o.status))
          .reduce((s, o) => s + o.totalSatang, 0);
        expect(computed).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("orders with ORDERED status are excluded from revenue", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (amount) => {
        const orders = [{ totalSatang: amount, status: OrderStatus.ORDERED }];
        expect(computeRevenue(orders)).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  it("orders with CANCELLED status are excluded from revenue", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (amount) => {
        const orders = [{ totalSatang: amount, status: OrderStatus.CANCELLED }];
        expect(computeRevenue(orders)).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  it("empty order list returns 0 revenue", () => {
    expect(computeRevenue([])).toBe(0);
  });

  it("QUALIFYING_STATUSES contains exactly PAID, PACKING, SHIPPED", () => {
    expect(new Set(QUALIFYING_STATUSES)).toEqual(
      new Set([OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.SHIPPED]),
    );
  });
});
