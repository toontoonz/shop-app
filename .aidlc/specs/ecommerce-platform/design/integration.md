# Design — Integration

This system has **no external integrations** in MVP. All "integrations" here are internal patterns that connect modules, the framework, and infrastructure.

## Inter-Module Communication

Per D2-4, modules communicate via direct method calls through typed service interfaces. There is no in-process event bus and no inter-service HTTP. Each module exposes its public surface from `src/modules/{module}/index.ts`:

```ts
// src/modules/seller-account-catalog/index.ts
export { SellerAuthService } from './services/auth';
export { SellerRepository } from './repositories/seller';
export { ProductRepository } from './repositories/product';
export type { Seller, Product } from '@prisma/client';
```

Other modules import from this barrel:

```ts
// src/modules/storefront-checkout/services/checkout.ts
import { ProductRepository } from '@/modules/seller-account-catalog';
```

**Boundary rule** (enforced by ESLint `no-restricted-imports`): A module MAY import from `@/modules/{another-module}` only via the barrel `index.ts`. Direct deep imports (e.g., `@/modules/seller-account-catalog/repositories/seller`) from outside that module are forbidden.

## Order Aggregate Boundary (Cross-Module Detail)

The Order aggregate is owned by `storefront-checkout` (it's born at checkout). `order-fulfillment` consumes it via aggregate methods rather than duplicating state-machine logic:

```ts
// src/modules/storefront-checkout/domain/order.ts
export class Order {
  // ...constructor and properties...
  advanceStatus(actorSellerId: string): void {
    if (this.sellerId !== actorSellerId) throw new ForbiddenError();
    if (!FORWARD_TRANSITIONS[this.status]) throw new InvalidTransitionError();
    this.status = FORWARD_TRANSITIONS[this.status]!;
  }
  cancel(actorSellerId: string): void {
    if (this.sellerId !== actorSellerId) throw new ForbiddenError();
    if (!CANCELLABLE_STATUSES.has(this.status)) throw new InvalidTransitionError();
    this.status = OrderStatus.CANCELLED;
  }
}
```

`order-fulfillment` calls these methods inside a transaction, then persists the new state and writes the OrderStatusEvent. Stock restoration on cancel is delegated to `ProductRepository.incrementStock(productId, qty)` (owned by `seller-account-catalog`).

## Auth.js Integration

Auth.js v5 sits at `src/lib/auth.ts`:

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { CredentialsSchema } from '@/lib/validation/auth';
import { LoginThrottle } from '@/modules/seller-account-catalog/services/login-throttle';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  providers: [
    Credentials({
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        if (await LoginThrottle.isBlocked(username)) {
          throw new Error('THROTTLED');
        }

        const seller = await db.seller.findUnique({ where: { username, active: true } });
        if (!seller) {
          await LoginThrottle.recordFailure(username);
          return null;
        }
        const ok = await bcrypt.compare(password, seller.passwordHash);
        if (!ok) {
          await LoginThrottle.recordFailure(username);
          return null;
        }
        await LoginThrottle.clear(username);
        return { id: seller.id, name: seller.displayName, email: null };
      },
    }),
  ],
  pages: { signIn: '/login' },
});
```

`LoginThrottle` lives in `seller-account-catalog`:
- `isBlocked(username)` → `count(FailedLogin where username = ? AND attemptedAt > now() - 15m) >= 5`
- `recordFailure(username)` → insert FailedLogin row
- `clear(username)` → delete recent FailedLogin rows for username on success

## API Authorization Wrapper

Every seller-side route handler is wrapped in `withSellerAuth`:

```ts
// src/lib/auth-middleware.ts
export function withSellerAuth<T>(
  handler: (req: NextRequest, ctx: { seller: Seller }) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } }, { status: 401 });
    }
    const seller = await db.seller.findUnique({ where: { id: session.user.id, active: true } });
    if (!seller) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } }, { status: 401 });
    }
    return handler(req, { seller });
  };
}
```

## Cart Cookie Strategy

Anonymous buyer cart lives in a single cookie (`cart`). Storage approach:

```ts
// src/modules/storefront-checkout/services/cart.ts
type CartCookie = { lines: Array<{ productId: string; quantity: number }> };

const COOKIE_NAME = 'cart';
const COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax' as const, secure: true, maxAge: 60 * 60 * 24 * 7 };

// Encoded as JSON, then signed with HMAC-SHA256 using NEXTAUTH_SECRET.
// On read, signature is verified; tampered cookies → cart cleared silently.
```

The cookie holds only `productId` + `quantity` — never prices or stock. Prices and stock are re-resolved from the database on every read so concurrent product edits or stock changes are reflected immediately.

## Money Handling

Internal: `priceSatang`, `unitPriceSatang`, `totalSatang`, `revenueSatang` are all `number` (integer satang).
Boundary: a single `formatTHB(satang: number)` function in `src/lib/money.ts` produces display strings; a single `parseTHBInput(input: string)` parses user form input (e.g., `"1,234.50"` → `123450`).

```ts
// src/lib/money.ts
export const SATANG_PER_THB = 100;
export const formatTHB = (s: number) => `฿${(s / SATANG_PER_THB).toFixed(2)}`;
export const parseTHBInput = (input: string): number => {
  const cleaned = input.replace(/,/g, '').trim();
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid amount');
  return Math.round(n * SATANG_PER_THB);
};
```

## Time Range Resolution

`src/lib/time-range.ts` resolves the 5 presets to `[from, to)` UTC ranges:

```ts
type RangePreset = 'TODAY' | 'LAST_7D' | 'LAST_30D' | 'THIS_MONTH' | 'THIS_YEAR';

export function resolveRange(preset: RangePreset, now: Date = new Date()): { from: Date; to: Date; interval: 'DAY' | 'MONTH' } {
  // - TODAY → from = startOfDay(now), to = endOfDay(now), interval = 'DAY'
  // - LAST_7D → from = startOfDay(now - 6d), to = endOfDay(now), interval = 'DAY'
  // - LAST_30D → from = startOfDay(now - 29d), to = endOfDay(now), interval = 'DAY'
  // - THIS_MONTH → from = startOfMonth(now), to = endOfMonth(now), interval = 'DAY'
  // - THIS_YEAR → from = startOfYear(now), to = endOfYear(now), interval = 'MONTH'
}
```

Used by all analytics endpoints. Single source of truth for what each range means.

## Error Handling

Custom `AppError` classes (`ValidationError`, `NotFoundError`, `ForbiddenError`, `InvalidTransitionError`, `InsufficientStockError`, `RateLimitedError`) live in `src/lib/errors/`. A wrapper `apiHandler(fn)` catches these, maps each to a JSON envelope and HTTP status code, and logs unexpected `Error` instances as `INTERNAL_ERROR` (500).

## Logging and Observability

Vercel built-in logging captures `console.log`/`console.error` from server functions. Structured logs use the `pino` logger configured at `src/lib/log.ts`:

```ts
import pino from 'pino';
export const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });
```

For MVP, no APM, no distributed tracing, no Sentry. Adding Sentry is a documented post-MVP follow-up.

## Cron Jobs (Vercel Cron)

One cron job: `vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/cleanup-failed-logins", "schedule": "0 3 * * *" }] }
```

The endpoint deletes `FailedLogin` rows older than 24 hours.

## Database Connection

Single Prisma client instance with connection pooling. In serverless contexts (Vercel), the recommended pattern:

```ts
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

For Neon, use the Neon-Vercel integration which auto-injects `DATABASE_URL` and uses Neon's serverless driver underneath.
