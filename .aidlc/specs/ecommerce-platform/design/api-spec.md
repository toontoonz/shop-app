# Design — API Specification

All endpoints are Next.js Route Handlers under `src/app/api/`. Public endpoints have no auth requirement; seller endpoints are wrapped with `withSellerAuth` middleware that resolves the authenticated Seller and rejects unauthenticated requests with `401`.

Response envelope (consistent across all endpoints):
```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiError      = { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

Error codes used: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

## Public — Storefront

### GET /api/products
Query params: `q?` (search string, optional)

Response 200:
```ts
{
  ok: true,
  data: {
    products: Array<{
      id: string;
      name: string;
      priceSatang: number;
      stock: number;
      imageUrl: string | null;
      seller: { id: string; displayName: string };
    }>
  }
}
```

Filters: `active=true` only. If `q` provided, case-insensitive name match.

### GET /api/products/[id]
Response 200:
```ts
{
  ok: true,
  data: {
    id: string;
    name: string;
    description: string | null;
    priceSatang: number;
    stock: number;
    imageUrl: string | null;
    seller: { id: string; displayName: string };
  }
}
```
Returns 404 if not found or `active=false`.

---

## Public — Cart

The cart is stored in a signed/encrypted cookie (`cart`). All endpoints read the cookie, mutate it, and write it back.

### POST /api/cart
Body:
```ts
{ productId: string; quantity: number; }
```
Behavior: adds line OR increments existing line by `quantity`. Re-validates against current product stock; if quantity exceeds stock, clamps to stock and returns the clamped value. Returns 200 with updated cart.

### PATCH /api/cart/lines/[productId]
Body: `{ quantity: number }`
Behavior: sets line quantity. Quantity ≤ 0 → equivalent to delete. Quantity > stock → clamps to stock.

### DELETE /api/cart/lines/[productId]
Removes the line. Returns 200 with updated cart.

### GET /api/cart
Returns 200 with current cart, including stock/price re-validation. Each line includes `clampedQuantity` if it was reduced server-side because stock fell below the cart's stored quantity.

---

## Public — Checkout

### POST /api/checkout
Body:
```ts
{
  buyerName: string;        // required, 1-100 chars after trim
  buyerPhone: string;       // required, Thai phone format
  buyerEmail?: string;      // optional, valid email if present
  paymentMethod: 'BANK_TRANSFER' | 'COD' | 'E_WALLET' | 'CREDIT_CARD';
}
```

Behavior:
1. Read cart cookie. If empty → 409 `CONFLICT` with code `EMPTY_CART`.
2. Validate body via Zod. If invalid → 400 `VALIDATION_ERROR` with `fields` map.
3. Open Prisma transaction:
   a. For each cart line, attempt `prisma.product.updateMany({ where: { id, stock: { gte: qty }, active: true }, data: { stock: { decrement: qty } } })`. If `count === 0` for any line → throw `INSUFFICIENT_STOCK` with affected items.
   b. Group cart lines by `sellerId`.
   c. For each seller group, create one Order with its OrderItems (snapshotting `productNameAtOrder` and `unitPriceSatang` from the current Product). Status = `ORDERED`.
4. On success: clear cart cookie, return 201 with the array of created orders (each with id, total, items).
5. On `INSUFFICIENT_STOCK`: return 409 with `code: 'INSUFFICIENT_STOCK'`, `fields: { items: [{ productId, available }] }`.

Response 201:
```ts
{
  ok: true,
  data: {
    orders: Array<{
      id: string;
      sellerId: string;
      sellerName: string;
      totalSatang: number;
      paymentMethod: PaymentMethod;
      buyerName: string;
      buyerPhone: string;
      buyerEmail: string | null;
      items: Array<{ productNameAtOrder: string; quantity: number; unitPriceSatang: number }>;
    }>
  }
}
```

### GET /api/orders/[id]/confirmation
Public read of an order's confirmation view. Used by the confirmation page if the buyer revisits via the URL. Returns minimal info (no other orders by same buyer, no PII beyond what they entered).

---

## Auth — Auth.js standard routes

`/api/auth/[...nextauth]/route.ts` mounts Auth.js v5 with:
- Credentials provider (username + password)
- Prisma adapter
- Database session strategy
- `authorize` callback verifies bcrypt password, checks throttle (rejects with 429 if 5+ failed attempts in last 15 min for the username), inserts FailedLogin row on failure
- HTTP-only secure cookies

---

## Seller (auth required)

All routes require an authenticated Seller. Authorization beyond authentication is enforced inside each handler — e.g., `where: { sellerId: currentSeller.id }` on every query/mutation.

### Products

#### GET /api/seller/products
Returns 200 with all products owned by current seller (`active=true` only by default; `?includeInactive=1` to include soft-deleted).

#### POST /api/seller/products
Body:
```ts
{
  name: string;             // required, 1-200 chars
  description?: string;     // optional, 0-2000 chars
  priceSatang: number;      // required, >= 0
  stock: number;            // required, >= 0
  imageUrl?: string;        // optional, must be valid URL
}
```
Returns 201 with created product.

#### PATCH /api/seller/products/[id]
Body: any subset of the POST fields.
Behavior: 404 if product doesn't belong to current seller (don't reveal existence). Validates ownership via `where: { id, sellerId: currentSeller.id }`.

#### DELETE /api/seller/products/[id]
Behavior: soft-delete (`UPDATE Product SET active = false`). 404 if not owned.

### Orders

#### GET /api/seller/orders?status=...
Query params:
- `status` (optional): one of `ORDERED | PAID | PACKING | SHIPPED | CANCELLED`. Omitted = all.

Response 200:
```ts
{
  ok: true,
  data: {
    orders: Order[];
    counts: { ORDERED: number; PAID: number; PACKING: number; SHIPPED: number; CANCELLED: number; ALL: number };
  }
}
```
`counts` is always returned (powers status filter badges). `orders` is filtered by the `status` param.

#### GET /api/seller/orders/[id]
Returns 200 with full order detail including `items`, `statusEvents`. 404 if not owned.

#### POST /api/seller/orders/[id]/advance-status
No body. Calls `Order.advanceStatus(currentSeller.id)` which:
- Loads order with row lock (`SELECT ... FOR UPDATE` via `prisma.$transaction`).
- Verifies order belongs to current seller.
- Verifies current status is one of `{ORDERED, PAID, PACKING}` (otherwise returns 409 `INVALID_TRANSITION`).
- Computes next status: `ORDERED→PAID`, `PAID→PACKING`, `PACKING→SHIPPED`. `SHIPPED` and `CANCELLED` reject.
- Updates order status, inserts `OrderStatusEvent` with `fromStatus`, `toStatus`, `actorSellerId`, `occurredAt`.
- Returns 200 with updated order.

#### POST /api/seller/orders/[id]/cancel
No body. Calls `Order.cancel(currentSeller.id)` which:
- In a transaction, loads order with row lock.
- Verifies ownership.
- Verifies current status ∈ `{ORDERED, PAID, PACKING}` (otherwise 409).
- Sets status to `CANCELLED`, inserts `OrderStatusEvent`.
- For each `OrderItem`, calls `prisma.product.update({ where: { id }, data: { stock: { increment: quantity } } })` to restore stock.
- Returns 200 with updated order.

### Analytics

All analytics endpoints accept `?range=` with values `TODAY | LAST_7D | LAST_30D | THIS_MONTH | THIS_YEAR`. Default = `LAST_30D`. The range maps to a `[from, to)` UTC interval computed server-side.

Sales/leaderboard/top-products queries restrict to orders with `status IN (PAID, PACKING, SHIPPED)`.
Orders-by-status counts span all 5 statuses.

#### GET /api/seller/analytics/sales?range=...
Returns 200:
```ts
{
  ok: true,
  data: {
    interval: 'DAY' | 'MONTH';   // chosen automatically by range size
    points: Array<{ bucket: string; revenueSatang: number }>;  // bucket is ISO date or YYYY-MM
  }
}
```
Filters: `sellerId = currentSeller.id`, `createdAt ∈ range`, `status IN (PAID, PACKING, SHIPPED)`.

#### GET /api/seller/analytics/orders-by-status?range=...
Returns 200:
```ts
{
  ok: true,
  data: { counts: { ORDERED: number; PAID: number; PACKING: number; SHIPPED: number; CANCELLED: number } }
}
```
Filters: `sellerId = currentSeller.id`, `createdAt ∈ range`.

#### GET /api/seller/analytics/top-sellers?range=...
Returns 200:
```ts
{
  ok: true,
  data: {
    rows: Array<{
      rank: number;
      sellerId: string;
      sellerName: string;
      revenueSatang: number;
      isCurrentSeller: boolean;
    }>;
  }
}
```
Computes leaderboard ACROSS all sellers (not restricted to current). Filters: `createdAt ∈ range`, `status IN (PAID, PACKING, SHIPPED)`. Top 10.

#### GET /api/seller/analytics/top-products?range=...
Returns 200:
```ts
{
  ok: true,
  data: {
    rows: Array<{ rank: number; productId: string; productName: string; quantity: number; revenueSatang: number }>;
  }
}
```
Restricted to current seller's products. Filters and ranking by sum of `OrderItem.quantity` from qualifying orders. Top 5.

---

## Validation Schemas (excerpt)

All request bodies validated by Zod schemas living in `src/lib/validation/`. Examples:

```ts
// src/lib/validation/buyer-info.ts
export const ThaiPhoneRegex = /^(\+66|0)\d{8,9}$/;

export const BuyerInfoSchema = z.object({
  buyerName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100),
  buyerPhone: z.string().regex(ThaiPhoneRegex, 'กรุณากรอกเบอร์โทรที่ถูกต้อง'),
  buyerEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
});

// src/lib/validation/checkout.ts
export const CheckoutSchema = BuyerInfoSchema.extend({
  paymentMethod: z.enum(['BANK_TRANSFER','COD','E_WALLET','CREDIT_CARD'], {
    required_error: 'กรุณาเลือกวิธีชำระเงิน',
  }),
});
```
