import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Cart cookie service.
 *
 * Stores cart lines (productId + quantity) in a JSON cookie.
 * Prices and stock are always re-resolved from the database — never stored in the cookie.
 * Simple approach for MVP: plain JSON (no HMAC signing for now; can be added later).
 */

export type CartLine = {
  productId: string;
  quantity: number;
};

export type ResolvedCartLine = CartLine & {
  productName: string;
  unitPriceSatang: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  /** If cart quantity exceeds current stock, this is the clamped value. */
  clampedQuantity: number;
  wasClamped: boolean;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  totalSatang: number;
  lineCount: number;
};

const COOKIE_NAME = "cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ─── Cookie I/O ───────────────────────────────────────────

export async function readCartCookie(): Promise<CartLine[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l: unknown): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).productId === "string" &&
        typeof (l as CartLine).quantity === "number" &&
        (l as CartLine).quantity > 0,
    );
  } catch {
    return [];
  }
}

export async function writeCartCookie(lines: CartLine[]): Promise<void> {
  const cookieStore = await cookies();
  const filtered = lines.filter((l) => l.quantity > 0);
  if (filtered.length === 0) {
    cookieStore.delete(COOKIE_NAME);
  } else {
    cookieStore.set(COOKIE_NAME, JSON.stringify(filtered), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
}

// ─── Business Operations ─────────────────────────────────

export async function resolveCart(lines: CartLine[]): Promise<ResolvedCart> {
  if (lines.length === 0) {
    return { lines: [], totalSatang: 0, lineCount: 0 };
  }

  const productIds = lines.map((l) => l.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { seller: { select: { id: true, displayName: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const resolvedLines: ResolvedCartLine[] = [];
  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) continue; // Product deleted/inactive → silently removed from cart

    const clampedQuantity = Math.min(line.quantity, product.stock);
    resolvedLines.push({
      productId: line.productId,
      quantity: line.quantity,
      productName: product.name,
      unitPriceSatang: product.priceSatang,
      stock: product.stock,
      sellerId: product.seller.id,
      sellerName: product.seller.displayName,
      clampedQuantity,
      wasClamped: clampedQuantity < line.quantity,
    });
  }

  const totalSatang = resolvedLines.reduce(
    (sum, l) => sum + l.unitPriceSatang * l.clampedQuantity,
    0,
  );

  return { lines: resolvedLines, totalSatang, lineCount: resolvedLines.length };
}

export async function addToCart(productId: string, quantity: number = 1): Promise<CartLine[]> {
  const lines = await readCartCookie();
  const existing = lines.find((l) => l.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ productId, quantity });
  }
  await writeCartCookie(lines);
  return lines;
}

export async function updateCartLineQuantity(productId: string, quantity: number): Promise<CartLine[]> {
  let lines = await readCartCookie();
  if (quantity <= 0) {
    lines = lines.filter((l) => l.productId !== productId);
  } else {
    const existing = lines.find((l) => l.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    }
  }
  await writeCartCookie(lines);
  return lines;
}

export async function removeFromCart(productId: string): Promise<CartLine[]> {
  const lines = (await readCartCookie()).filter((l) => l.productId !== productId);
  await writeCartCookie(lines);
  return lines;
}

export async function clearCart(): Promise<void> {
  await writeCartCookie([]);
}

export function computeCartTotal(lines: Array<{ unitPriceSatang: number; quantity: number }>): number {
  return lines.reduce((sum, l) => sum + l.unitPriceSatang * l.quantity, 0);
}
