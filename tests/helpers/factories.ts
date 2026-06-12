/**
 * Test factory helpers — shared across integration and PBT tests.
 * Creates test data in the database using Prisma directly.
 */
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

let counter = 0;
function uniqueId(): string {
  return `test-${Date.now()}-${++counter}`;
}

export async function resetTestDb() {
  // Delete in correct order for FK constraints
  await db.orderStatusEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.failedLogin.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.seller.deleteMany();
}

export async function seedSeller(overrides?: { username?: string; password?: string; displayName?: string }) {
  const username = overrides?.username ?? `seller-${uniqueId()}`;
  const password = overrides?.password ?? "test1234";
  const passwordHash = await bcrypt.hash(password, 4); // Low cost for speed in tests
  return db.seller.create({
    data: {
      username,
      passwordHash,
      displayName: overrides?.displayName ?? `Test Seller ${username}`,
      active: true,
    },
  });
}

export async function seedProduct(sellerId: string, overrides?: { name?: string; priceSatang?: number; stock?: number }) {
  return db.product.create({
    data: {
      sellerId,
      name: overrides?.name ?? `Product ${uniqueId()}`,
      priceSatang: overrides?.priceSatang ?? 10000,
      stock: overrides?.stock ?? 50,
      active: true,
    },
  });
}

export async function seedOrder(
  sellerId: string,
  items: Array<{ productId: string; productNameAtOrder: string; unitPriceSatang: number; quantity: number }>,
  overrides?: { status?: OrderStatus; paymentMethod?: PaymentMethod },
) {
  const totalSatang = items.reduce((sum, item) => sum + item.unitPriceSatang * item.quantity, 0);
  return db.order.create({
    data: {
      sellerId,
      buyerName: "ผู้ซื้อทดสอบ",
      buyerPhone: "0812345678",
      paymentMethod: overrides?.paymentMethod ?? "COD",
      status: overrides?.status ?? "ORDERED",
      totalSatang,
      items: {
        create: items,
      },
    },
    include: { items: true },
  });
}
