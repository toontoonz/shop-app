/**
 * Property P2: Order Status State Machine
 *
 * Statement: For any Order, calling advanceStatus and cancel in arbitrary orders
 * SHALL only produce status sequences matching the allowed transitions.
 * Invalid transitions SHALL always throw InvalidTransitionError.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { Order } from "@/modules/storefront-checkout/domain/order";
import { FORWARD_TRANSITIONS, CANCELLABLE_STATUSES } from "@/modules/storefront-checkout/domain/order-status-machine";
import { InvalidTransitionError, ForbiddenError } from "@/lib/errors";
import { OrderStatus } from "@prisma/client";

const SELLER_ID = "seller-1";

describe("Property P2: Order Status State Machine", () => {
  it("status transitions only follow allowed paths for arbitrary operation sequences", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom("advance", "cancel") as fc.Arbitrary<"advance" | "cancel">,
          { minLength: 1, maxLength: 15 },
        ),
        (operations) => {
          const order = new Order({ id: "o1", sellerId: SELLER_ID, status: OrderStatus.ORDERED });

          for (const op of operations) {
            const before = order.status;
            try {
              if (op === "advance") {
                order.advanceStatus(SELLER_ID);
              } else {
                order.cancel(SELLER_ID);
              }
              // Transition succeeded — verify it was allowed
              const after = order.status;
              if (op === "advance") {
                expect(FORWARD_TRANSITIONS[before]).toBe(after);
              } else {
                expect(CANCELLABLE_STATUSES.has(before)).toBe(true);
                expect(after).toBe(OrderStatus.CANCELLED);
              }
            } catch (e) {
              // Transition rejected — verify it was NOT allowed
              expect(e).toBeInstanceOf(InvalidTransitionError);
              if (op === "advance") {
                expect(FORWARD_TRANSITIONS[before]).toBeNull();
              } else {
                expect(CANCELLABLE_STATUSES.has(before)).toBe(false);
              }
              // Status unchanged
              expect(order.status).toBe(before);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("ownership enforcement: wrong seller always throws ForbiddenError regardless of operation", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OrderStatus>(
          OrderStatus.ORDERED,
          OrderStatus.PAID,
          OrderStatus.PACKING,
          OrderStatus.SHIPPED,
          OrderStatus.CANCELLED,
        ),
        fc.constantFrom("advance", "cancel") as fc.Arbitrary<"advance" | "cancel">,
        (status, op) => {
          const order = new Order({ id: "o1", sellerId: SELLER_ID, status });
          try {
            if (op === "advance") {
              order.advanceStatus("wrong-seller");
            } else {
              order.cancel("wrong-seller");
            }
            // Should never reach here
            expect.unreachable("Expected ForbiddenError");
          } catch (e) {
            expect(e).toBeInstanceOf(ForbiddenError);
            // Status unchanged
            expect(order.status).toBe(status);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
