/**
 * Property P1: Stock Non-Negativity
 *
 * Statement: For any sequence of legal Product mutations (create, tryDecrementStock,
 * incrementStock), the resulting Product.stock value SHALL never be negative.
 *
 * This is reinforced by the DB-level CHECK constraint `stock >= 0`, but the PBT
 * verifies the application-layer repository contract independently.
 */
import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { resetTestDb, seedSeller } from "../helpers";

describe("Property P1: Stock Non-Negativity", () => {
  let sellerId: string;

  beforeEach(async () => {
    await resetTestDb();
    const seller = await seedSeller({ username: "pbt-seller" });
    sellerId = seller.id;
  });

  it("stock never goes negative across arbitrary operation sequences", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // initial stock
        fc.array(
          fc.oneof(
            fc.record({ kind: fc.constant("decrement" as const), qty: fc.integer({ min: 1, max: 20 }) }),
            fc.record({ kind: fc.constant("increment" as const), qty: fc.integer({ min: 1, max: 20 }) }),
          ),
          { minLength: 1, maxLength: 20 },
        ),
        async (initialStock, ops) => {
          // Create a product with the generated initial stock
          const product = await ProductRepository.create(sellerId, {
            name: `PBT-Product-${Date.now()}`,
            priceSatang: 10000,
            stock: initialStock,
          });

          // Apply the sequence of operations
          for (const op of ops) {
            if (op.kind === "decrement") {
              // tryDecrementStock returns null on insufficient stock — never makes stock negative
              await ProductRepository.tryDecrementStock(product.id, op.qty);
            } else {
              await ProductRepository.incrementStock(product.id, op.qty);
            }
          }

          // Assert: stock must never be negative
          const fresh = await ProductRepository.findById(product.id);
          expect(fresh).not.toBeNull();
          expect(fresh!.stock).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 30 }, // Keep low for CI speed; locally can increase
    );
  });

  it("tryDecrementStock fails gracefully at exact boundary (stock = qty)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // stock = qty (exact boundary)
        async (qty) => {
          const product = await ProductRepository.create(sellerId, {
            name: `PBT-Boundary-${Date.now()}`,
            priceSatang: 5000,
            stock: qty,
          });

          // Decrement exactly the available stock — should succeed
          const result = await ProductRepository.tryDecrementStock(product.id, qty);
          expect(result).not.toBeNull();
          expect(result!.stock).toBe(0);

          // One more decrement — should fail (stock is 0 now)
          const secondResult = await ProductRepository.tryDecrementStock(product.id, 1);
          expect(secondResult).toBeNull();

          // Verify still 0
          const final = await ProductRepository.findById(product.id);
          expect(final!.stock).toBe(0);
        },
      ),
      { numRuns: 20 },
    );
  });
});
