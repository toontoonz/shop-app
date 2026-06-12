/**
 * Property P4: Cart Total Formula
 *
 * Statement: For any Cart whose lines have non-negative quantities and unit prices,
 * cartTotal = sum(line.unitPriceSatang * line.quantity).
 * The total SHALL be non-negative and SHALL equal zero if the cart is empty.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeCartTotal } from "@/modules/storefront-checkout/services/cart";

const lineArb = fc.record({
  unitPriceSatang: fc.integer({ min: 0, max: 100_000 }),
  quantity: fc.integer({ min: 1, max: 99 }),
});

describe("Property P4: Cart Total Formula", () => {
  it("cart total equals sum of line subtotals", () => {
    fc.assert(
      fc.property(fc.array(lineArb, { maxLength: 50 }), (lines) => {
        const total = computeCartTotal(lines);
        const expected = lines.reduce((s, l) => s + l.unitPriceSatang * l.quantity, 0);
        expect(total).toBe(expected);
        expect(total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it("empty cart total is zero", () => {
    expect(computeCartTotal([])).toBe(0);
  });

  it("single-line cart total equals unitPrice * quantity", () => {
    fc.assert(
      fc.property(lineArb, (line) => {
        const total = computeCartTotal([line]);
        expect(total).toBe(line.unitPriceSatang * line.quantity);
      }),
      { numRuns: 100 },
    );
  });
});
