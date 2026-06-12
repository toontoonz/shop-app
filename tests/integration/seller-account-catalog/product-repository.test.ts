import { describe, it, expect, beforeEach } from "vitest";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { resetTestDb, seedSeller, seedProduct } from "../../helpers";

describe("ProductRepository (integration)", () => {
  let sellerId: string;
  let otherSellerId: string;

  beforeEach(async () => {
    await resetTestDb();
    const seller = await seedSeller({ username: "seller-a" });
    const otherSeller = await seedSeller({ username: "seller-b" });
    sellerId = seller.id;
    otherSellerId = otherSeller.id;
  });

  describe("create", () => {
    it("creates a product owned by the seller", async () => {
      const product = await ProductRepository.create(sellerId, {
        name: "Test Product",
        priceSatang: 10000,
        stock: 20,
      });
      expect(product.sellerId).toBe(sellerId);
      expect(product.name).toBe("Test Product");
      expect(product.priceSatang).toBe(10000);
      expect(product.stock).toBe(20);
      expect(product.active).toBe(true);
    });
  });

  describe("findActiveBySellerId", () => {
    it("returns only active products for that seller", async () => {
      await seedProduct(sellerId, { name: "Active" });
      await seedProduct(otherSellerId, { name: "Other seller" });
      const products = await ProductRepository.findActiveBySellerId(sellerId);
      expect(products).toHaveLength(1);
      expect(products[0]!.name).toBe("Active");
    });
  });

  describe("updateOwnedById", () => {
    it("updates an owned product", async () => {
      const product = await seedProduct(sellerId, { name: "Old Name" });
      const updated = await ProductRepository.updateOwnedById(product.id, sellerId, { name: "New Name" });
      expect(updated?.name).toBe("New Name");
    });

    it("returns null for product owned by another seller", async () => {
      const product = await seedProduct(otherSellerId, { name: "Not Mine" });
      const result = await ProductRepository.updateOwnedById(product.id, sellerId, { name: "Hacked" });
      expect(result).toBeNull();
    });
  });

  describe("softDelete", () => {
    it("sets active to false for owned product", async () => {
      const product = await seedProduct(sellerId);
      const result = await ProductRepository.softDelete(product.id, sellerId);
      expect(result).toBe(true);
      // No longer in active listings
      const found = await ProductRepository.findActiveById(product.id);
      expect(found).toBeNull();
      // But still accessible by raw findById
      const raw = await ProductRepository.findById(product.id);
      expect(raw?.active).toBe(false);
    });

    it("returns false for product not owned", async () => {
      const product = await seedProduct(otherSellerId);
      const result = await ProductRepository.softDelete(product.id, sellerId);
      expect(result).toBe(false);
    });
  });

  describe("tryDecrementStock (atomic)", () => {
    it("decrements stock when sufficient", async () => {
      const product = await seedProduct(sellerId, { stock: 10 });
      const updated = await ProductRepository.tryDecrementStock(product.id, 3);
      expect(updated?.stock).toBe(7);
    });

    it("returns null when insufficient stock", async () => {
      const product = await seedProduct(sellerId, { stock: 2 });
      const result = await ProductRepository.tryDecrementStock(product.id, 5);
      expect(result).toBeNull();
      // Stock unchanged
      const fresh = await ProductRepository.findById(product.id);
      expect(fresh?.stock).toBe(2);
    });

    it("returns null for inactive product", async () => {
      const product = await seedProduct(sellerId, { stock: 10 });
      await ProductRepository.softDelete(product.id, sellerId);
      const result = await ProductRepository.tryDecrementStock(product.id, 1);
      expect(result).toBeNull();
    });

    it("handles decrement to zero correctly", async () => {
      const product = await seedProduct(sellerId, { stock: 5 });
      const updated = await ProductRepository.tryDecrementStock(product.id, 5);
      expect(updated?.stock).toBe(0);
    });
  });

  describe("incrementStock", () => {
    it("increments stock (cancel restore)", async () => {
      const product = await seedProduct(sellerId, { stock: 3 });
      const updated = await ProductRepository.incrementStock(product.id, 7);
      expect(updated.stock).toBe(10);
    });
  });
});
