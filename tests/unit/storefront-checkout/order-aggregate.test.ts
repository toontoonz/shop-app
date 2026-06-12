import { describe, it, expect } from "vitest";
import { Order } from "@/modules/storefront-checkout/domain/order";
import { ForbiddenError, InvalidTransitionError } from "@/lib/errors";

const SELLER_ID = "seller-1";
const OTHER_SELLER = "seller-2";

function makeOrder(status: string) {
  return new Order({ id: "order-1", sellerId: SELLER_ID, status: status as never });
}

describe("Order aggregate", () => {
  describe("advanceStatus", () => {
    it("advances ORDERED → PAID", () => {
      const order = makeOrder("ORDERED");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("PAID");
    });

    it("advances PAID → PACKING", () => {
      const order = makeOrder("PAID");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("PACKING");
    });

    it("advances PACKING → SHIPPED", () => {
      const order = makeOrder("PACKING");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("SHIPPED");
    });

    it("throws InvalidTransitionError from SHIPPED (terminal)", () => {
      const order = makeOrder("SHIPPED");
      expect(() => order.advanceStatus(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("throws InvalidTransitionError from CANCELLED (terminal)", () => {
      const order = makeOrder("CANCELLED");
      expect(() => order.advanceStatus(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("throws ForbiddenError when actor is not the seller", () => {
      const order = makeOrder("ORDERED");
      expect(() => order.advanceStatus(OTHER_SELLER)).toThrow(ForbiddenError);
    });
  });

  describe("cancel", () => {
    it("cancels from ORDERED", () => {
      const order = makeOrder("ORDERED");
      order.cancel(SELLER_ID);
      expect(order.status).toBe("CANCELLED");
    });

    it("cancels from PAID", () => {
      const order = makeOrder("PAID");
      order.cancel(SELLER_ID);
      expect(order.status).toBe("CANCELLED");
    });

    it("cancels from PACKING", () => {
      const order = makeOrder("PACKING");
      order.cancel(SELLER_ID);
      expect(order.status).toBe("CANCELLED");
    });

    it("throws InvalidTransitionError from SHIPPED", () => {
      const order = makeOrder("SHIPPED");
      expect(() => order.cancel(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("throws InvalidTransitionError from CANCELLED", () => {
      const order = makeOrder("CANCELLED");
      expect(() => order.cancel(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("throws ForbiddenError when actor is not the seller", () => {
      const order = makeOrder("ORDERED");
      expect(() => order.cancel(OTHER_SELLER)).toThrow(ForbiddenError);
    });
  });

  describe("sequential transitions", () => {
    it("full forward chain: ORDERED → PAID → PACKING → SHIPPED", () => {
      const order = makeOrder("ORDERED");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("PAID");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("PACKING");
      order.advanceStatus(SELLER_ID);
      expect(order.status).toBe("SHIPPED");
      // Cannot advance further
      expect(() => order.advanceStatus(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("cannot advance after cancel", () => {
      const order = makeOrder("PAID");
      order.cancel(SELLER_ID);
      expect(order.status).toBe("CANCELLED");
      expect(() => order.advanceStatus(SELLER_ID)).toThrow(InvalidTransitionError);
    });

    it("cannot cancel after shipped", () => {
      const order = makeOrder("PACKING");
      order.advanceStatus(SELLER_ID); // → SHIPPED
      expect(() => order.cancel(SELLER_ID)).toThrow(InvalidTransitionError);
    });
  });
});
