/**
 * Development seed: creates 2 admin-issued sellers + 6 demo products.
 *
 * Run with: pnpm db:seed
 *
 * Idempotent — uses upsert by username so re-running won't duplicate sellers.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const BCRYPT_COST = 12;

async function main() {
  const password = process.env.DEMO_SELLER_PASSWORD ?? "demo1234";
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const sellerA = await db.seller.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      passwordHash,
      displayName: "ร้านเดโม่ A",
      active: true,
    },
  });

  const sellerB = await db.seller.upsert({
    where: { username: "demo2" },
    update: {},
    create: {
      username: "demo2",
      passwordHash,
      displayName: "ร้านเดโม่ B",
      active: true,
    },
  });

  // Wipe and re-seed products so changing this script keeps the catalog clean.
  await db.product.deleteMany({ where: { seller: { username: { in: ["demo", "demo2"] } } } });

  await db.product.createMany({
    data: [
      // Seller A — 4 products
      { sellerId: sellerA.id, name: "เสื้อยืดผ้าฝ้าย", description: "เสื้อยืดผ้าคอตตอน 100%", priceSatang: 29900, stock: 50 },
      { sellerId: sellerA.id, name: "หมวกเบสบอล", description: "หมวกแก๊ปสีพื้น ปรับขนาดได้", priceSatang: 19900, stock: 30 },
      { sellerId: sellerA.id, name: "กระเป๋าผ้า", description: "กระเป๋าโทเทผ้าหนา", priceSatang: 24900, stock: 25 },
      { sellerId: sellerA.id, name: "ถุงเท้า (3 คู่)", description: "ถุงเท้าผ้าฝ้าย แพ็ค 3 คู่", priceSatang: 14900, stock: 100 },
      // Seller B — 2 products
      { sellerId: sellerB.id, name: "แก้วเซรามิก", description: "แก้วน้ำขนาด 350 มล.", priceSatang: 17900, stock: 40 },
      { sellerId: sellerB.id, name: "สมุดโน้ตปกแข็ง", description: "สมุดเส้นบรรทัด 200 หน้า", priceSatang: 22900, stock: 20 },
    ],
  });

  const productCount = await db.product.count();
  console.log(`✅ Seeded ${productCount} products across 2 sellers (demo, demo2).`);
  console.log(`✅ Login with username=demo or demo2, password=${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
