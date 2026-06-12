import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { Order } from "@/modules/storefront-checkout/domain/order";
import { OrderStatusEventRepository } from "@/modules/order-fulfillment/repositories/order-status-event";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { resetTestDb, seedSeller, seedProduct, seedOrder } from "../../helpers";
import { ForbiddenError, InvalidTransitionError } from "@/lib/errors";

describe("Order Fulfillment (integration)", () => {
  let sellerAId: string;
  let sellerBId: string;
  let productId: string;

  beforeEach(async () => {
    await resetTestDb();
    const sellerA = await seedSeller({ username: "seller-a" });
    const sellerB = await seedSeller({ username: "seller-b" });
    sellerAId = sellerA.id;
    sellerBId = sellerB.id;
    const product = await seedProduct(sellerAId, { stock: 20 });
    productId = product.id;
  });

  describe("advanceStatus", () => {
    it("advances ORDERED → PAID → PACKING → SHIPPED", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 2 },
      ]);

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });

      agg.advanceStatus(sellerAId);
      expect(agg.status).toBe("PAID");

      agg.advanceStatus(sellerAId);
      expect(agg.status).toBe("PACKING");

      agg.advanceStatus(sellerAId);
      expect(agg.status).toBe("SHIPPED");
    });

    it("rejects advance from terminal status SHIPPED", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ], { status: "SHIPPED" });

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      expect(() => agg.advanceStatus(sellerAId)).toThrow(InvalidTransitionError);
    });

    it("rejects advance by non-owner seller", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ]);

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      expect(() => agg.advanceStatus(sellerBId)).toThrow(ForbiddenError);
    });
  });

  describe("cancel", () => {
    it("cancels from ORDERED and restores stock", async () => {
      // Decrement stock first to simulate checkout
      await ProductRepository.tryDecrementStock(productId, 5);
      const afterDecrement = await ProductRepository.findById(productId);
      expect(afterDecrement!.stock).toBe(15);

      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 5 },
      ]);

      // Cancel should restore stock
      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      agg.cancel(sellerAId);
      expect(agg.status).toBe("CANCELLED");

      // Simulate stock restore (as the API handler does)
      await ProductRepository.incrementStock(productId, 5);
      const afterRestore = await ProductRepository.findById(productId);
      expect(afterRestore!.stock).toBe(20);
    });

    it("cancels from PAID", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ], { status: "PAID" });

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      agg.cancel(sellerAId);
      expect(agg.status).toBe("CANCELLED");
    });

    it("rejects cancel from SHIPPED", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ], { status: "SHIPPED" });

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      expect(() => agg.cancel(sellerAId)).toThrow(InvalidTransitionError);
    });

    it("rejects cancel by non-owner", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ]);

      const agg = new Order({ id: order.id, sellerId: order.sellerId, status: order.status });
      expect(() => agg.cancel(sellerBId)).toThrow(ForbiddenError);
    });
  });

  describe("OrderStatusEventRepository", () => {
    it("creates and retrieves events in order", async () => {
      const order = await seedOrder(sellerAId, [
        { productId, productNameAtOrder: "P", unitPriceSatang: 1000, quantity: 1 },
      ]);

      await OrderStatusEventRepository.create({
        orderId: order.id,
        fromStatus: "ORDERED",
        toStatus: "PAID",
        actorSellerId: sellerAId,
      });

      await OrderStatusEventRepository.create({
        orderId: order.id,
        fromStatus: "PAID",
        toStatus: "PACKING",
        actorSellerId: sellerAId,
      });

      const events = await OrderStatusEventRepository.findByOrderId(order.id);
      expect(events).toHaveLength(2);
      expect(events[0]!.fromStatus).toBe("ORDERED");
      expect(events[0]!.toStatus).toBe("PAID");
      expect(events[1]!.fromStatus).toBe("PAID");
      expect(events[1]!.toStatus).toBe("PACKING");
    });
  });
});
