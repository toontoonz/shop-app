import { db } from "@/lib/db";
import { InsufficientStockError } from "@/lib/errors";
import type { Order, OrderItem, PaymentMethod } from "@prisma/client";
import type { CartLine } from "./cart";

export type CheckoutInput = {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  paymentMethod: PaymentMethod;
  sellerId: string; // POS model: the logged-in seller who made the sale
};

export type CreatedOrder = Order & { items: OrderItem[] };

/**
 * Submit checkout: atomically decrement stock for all cart lines,
 * split into one Order per Seller, create OrderItems with snapshots.
 *
 * Uses Prisma interactive transaction for atomicity.
 * See US-006 AC#2, #3, #4, #5.
 */
export async function submitCheckout(
  cartLines: CartLine[],
  buyerInfo: CheckoutInput,
): Promise<CreatedOrder[]> {
  if (cartLines.length === 0) {
    throw new Error("Cart is empty");
  }

  return db.$transaction(async (tx) => {
    // 1. Resolve products and validate stock
    const productIds = cartLines.map((l) => l.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { seller: { select: { id: true } } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Attempt atomic stock decrement for each line
    const insufficientItems: Array<{ productId: string; available: number }> = [];

    for (const line of cartLines) {
      const product = productMap.get(line.productId);
      if (!product) {
        insufficientItems.push({ productId: line.productId, available: 0 });
        continue;
      }

      const result = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity }, active: true },
        data: { stock: { decrement: line.quantity } },
      });

      if (result.count === 0) {
        // Re-read to get actual stock for error message
        const fresh = await tx.product.findUnique({ where: { id: line.productId } });
        insufficientItems.push({
          productId: line.productId,
          available: fresh?.stock ?? 0,
        });
      }
    }

    if (insufficientItems.length > 0) {
      // Entire transaction will rollback — no stock was actually decremented
      const fields: Record<string, string> = {};
      fields.items = JSON.stringify(insufficientItems);
      throw new InsufficientStockError(
        "สินค้าบางรายการมีจำนวนคงเหลือไม่พอ",
        fields,
      );
    }

    // 3. All items belong to the logged-in seller (POS model — no split by product owner)
    const sellerId = buyerInfo.sellerId;

    const totalSatang = cartLines.reduce((sum, line) => {
      const product = productMap.get(line.productId)!;
      return sum + product.priceSatang * line.quantity;
    }, 0);

    const order = await tx.order.create({
      data: {
        sellerId,
        buyerName: buyerInfo.buyerName,
        buyerPhone: buyerInfo.buyerPhone,
        buyerEmail: buyerInfo.buyerEmail || null,
        paymentMethod: buyerInfo.paymentMethod,
        status: "ORDERED",
        totalSatang,
        items: {
          create: cartLines.map((line) => {
            const product = productMap.get(line.productId)!;
            return {
              productId: line.productId,
              productNameAtOrder: product.name,
              unitPriceSatang: product.priceSatang,
              quantity: line.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    return [order];
  });
}
