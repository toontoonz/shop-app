import { db } from "@/lib/db";
import type { Product } from "@prisma/client";
import type { ProductCreateInput, ProductUpdateInput } from "@/lib/validation";

export const ProductRepository = {
  /** Find an active product by ID (visible on storefront). */
  findActiveById: async (id: string): Promise<Product | null> => {
    return db.product.findFirst({ where: { id, active: true } });
  },

  /** Find all active products (storefront listing). */
  findActiveAll: async (search?: string): Promise<Product[]> => {
    return db.product.findMany({
      where: {
        active: true,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Find active products owned by a specific seller. */
  findActiveBySellerId: async (sellerId: string): Promise<Product[]> => {
    return db.product.findMany({
      where: { sellerId, active: true },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Find by ID regardless of active status (for historical order references). */
  findById: async (id: string): Promise<Product | null> => {
    return db.product.findUnique({ where: { id } });
  },

  /** Create a new product owned by the given seller. */
  create: async (sellerId: string, data: ProductCreateInput): Promise<Product> => {
    return db.product.create({
      data: {
        sellerId,
        name: data.name,
        description: data.description ?? null,
        priceSatang: data.priceSatang,
        stock: data.stock,
        imageUrl: data.imageUrl ?? null,
      },
    });
  },

  /** Update an owned product. Returns null if product not found or not owned. */
  updateOwnedById: async (
    id: string,
    sellerId: string,
    data: ProductUpdateInput,
  ): Promise<Product | null> => {
    const existing = await db.product.findFirst({ where: { id, sellerId, active: true } });
    if (!existing) return null;

    return db.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.priceSatang !== undefined && { priceSatang: data.priceSatang }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl ?? null }),
      },
    });
  },

  /** Soft-delete an owned product. Returns false if not found/not owned. */
  softDelete: async (id: string, sellerId: string): Promise<boolean> => {
    const result = await db.product.updateMany({
      where: { id, sellerId, active: true },
      data: { active: false },
    });
    return result.count > 0;
  },

  /**
   * Atomically decrement stock. Returns the updated product if successful,
   * or null if insufficient stock. Uses conditional update for atomicity.
   *
   * This is the critical method for preventing overselling (see US-006 AC#3, PBT P1).
   */
  tryDecrementStock: async (productId: string, qty: number): Promise<Product | null> => {
    const result = await db.product.updateMany({
      where: { id: productId, stock: { gte: qty }, active: true },
      data: { stock: { decrement: qty } },
    });
    if (result.count === 0) return null;
    return db.product.findUnique({ where: { id: productId } });
  },

  /**
   * Increment stock (used when cancelling an order to restore inventory).
   * See US-009 AC#1.
   */
  incrementStock: async (productId: string, qty: number): Promise<Product> => {
    return db.product.update({
      where: { id: productId },
      data: { stock: { increment: qty } },
    });
  },
};
