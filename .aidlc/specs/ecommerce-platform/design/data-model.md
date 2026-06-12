# Design — Data Model

## Conventions

- **IDs**: All entities use `cuid()` strings as primary keys.
- **Money**: Stored as `Int` in **satang** (1 THB = 100 satang). Display layer divides by 100 to show `฿X.XX`. Avoids floating-point drift.
- **Timestamps**: All entities have `createdAt`. Mutable entities have `updatedAt` (Prisma `@updatedAt`).
- **Soft-delete**: Only `Product` uses soft-delete via `active` boolean (preserves order line-item readability). Other entities are not deleted in MVP.
- **Indexes**: Added on every foreign key, every status field used in filtering, and on `createdAt` for time-range queries.
- **Enums**: Use Prisma enums for fixed value sets (OrderStatus, PaymentMethod) — generates TypeScript types and DB constraints simultaneously.

## Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────────────────────────────────────────
// Module: seller-account-catalog
// ───────────────────────────────────────────────

model Seller {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  displayName  String
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  products  Product[]
  orders    Order[]
  sessions  Session[]   // Auth.js
  accounts  Account[]   // Auth.js

  @@index([active])
}

model Product {
  id          String   @id @default(cuid())
  sellerId    String
  seller      Seller   @relation(fields: [sellerId], references: [id])
  name        String
  description String?
  priceSatang Int      // money in satang
  stock       Int      @default(0)
  imageUrl    String?
  active      Boolean  @default(true)   // soft-delete flag
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems OrderItem[]

  @@index([sellerId])
  @@index([active])
  @@index([sellerId, active])
}

model FailedLogin {
  id          String   @id @default(cuid())
  username    String
  attemptedAt DateTime @default(now())

  @@index([username, attemptedAt])
}

// ───────────────────────────────────────────────
// Module: storefront-checkout
// ───────────────────────────────────────────────

enum OrderStatus {
  ORDERED
  PAID
  PACKING
  SHIPPED
  CANCELLED
}

enum PaymentMethod {
  BANK_TRANSFER
  COD
  E_WALLET
  CREDIT_CARD
}

model Order {
  id            String        @id @default(cuid())
  sellerId      String
  seller        Seller        @relation(fields: [sellerId], references: [id])
  buyerName     String
  buyerPhone    String
  buyerEmail    String?
  paymentMethod PaymentMethod
  status        OrderStatus   @default(ORDERED)
  totalSatang   Int
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items        OrderItem[]
  statusEvents OrderStatusEvent[]

  @@index([sellerId])
  @@index([sellerId, status])
  @@index([sellerId, createdAt])
  @@index([status, createdAt])
  @@index([createdAt])
}

model OrderItem {
  id                 String  @id @default(cuid())
  orderId            String
  order              Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId          String
  product            Product @relation(fields: [productId], references: [id], onDelete: Restrict)
  productNameAtOrder String   // snapshot at order time
  unitPriceSatang    Int      // snapshot at order time
  quantity           Int

  @@index([productId])
  @@index([orderId])
}

// ───────────────────────────────────────────────
// Module: order-fulfillment
// ───────────────────────────────────────────────

model OrderStatusEvent {
  id            String       @id @default(cuid())
  orderId       String
  order         Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fromStatus    OrderStatus?
  toStatus      OrderStatus
  actorSellerId String
  occurredAt    DateTime     @default(now())

  @@index([orderId, occurredAt])
}

// ───────────────────────────────────────────────
// Auth.js v5 (Prisma adapter standard models)
// ───────────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user Seller @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user Seller @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Entity Notes

### Seller
Represents an authenticated marketplace vendor. `username` is unique. `passwordHash` is bcrypt with cost factor 12. `active=false` disables login (Auth.js authorize callback checks this). Auth.js's `User` is mapped to Seller via the Prisma adapter — the `Account` and `Session` tables are required by Auth.js standards even when only Credentials provider is in use.

### Product
Owned by exactly one Seller. `priceSatang` is integer money. `stock` is non-negative (enforced both at DB level via `CHECK stock >= 0` constraint added in migration, and at application level in repository methods). `active=false` is soft-delete: storefront filters by `active=true`, but historical OrderItems can still resolve `productId` to load the row.

### Order
One Order per Seller per checkout — multi-seller carts split into multiple Orders. `totalSatang` is computed at creation as `sum(item.unitPriceSatang * item.quantity)` and stored, so analytics queries don't need to re-aggregate items. `status` defaults to `ORDERED` and progresses via the Order aggregate's domain methods (no direct UPDATE in services other than via `Order.advanceStatus` / `Order.cancel`).

### OrderItem
Snapshots `productNameAtOrder` and `unitPriceSatang` at the moment of order so the line stays readable even if the Product is later edited or soft-deleted. `onDelete: Restrict` on `productId` prevents accidental hard deletes of products that have order history.

### OrderStatusEvent
Append-only audit log of every status transition. Used by `StatusTimeline` UI and (potentially) by analytics if time-on-status reports are added later.

### FailedLogin
Tracks failed credential attempts for the throttle rule (5 attempts in 15 minutes per username). A daily cron (Vercel Cron Job) deletes rows older than 1 day.

## DB-Level Invariants (Migration Guards)

These are added in the initial migration via raw SQL beyond what Prisma generates:

```sql
ALTER TABLE "Product" ADD CONSTRAINT "stock_non_negative" CHECK (stock >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "price_non_negative" CHECK ("priceSatang" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "qty_positive" CHECK (quantity > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "unit_price_non_negative" CHECK ("unitPriceSatang" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "total_non_negative" CHECK ("totalSatang" >= 0);
```

These guards back up the application-level checks. PBT properties also assert these invariants at the integration test level.

## Migration Strategy

- All schema changes go through Prisma Migrate (`prisma migrate dev` locally, `prisma migrate deploy` in CI).
- Migrations run automatically in the Vercel build step before the app starts.
- Seed script (`prisma/seed.ts`) creates one admin-issued seller account and a handful of demo products in development.
