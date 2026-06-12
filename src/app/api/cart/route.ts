import { NextRequest, NextResponse } from "next/server";
import {
  readCartCookie,
  resolveCart,
  addToCart,
} from "@/modules/storefront-checkout/services/cart";

/**
 * GET /api/cart — Return current cart with resolved product details.
 */
export async function GET() {
  const lines = await readCartCookie();
  const cart = await resolveCart(lines);
  return NextResponse.json({ ok: true, data: cart });
}

/**
 * POST /api/cart — Add a product to the cart.
 * Body: { productId: string; quantity?: number }
 * Checks current stock before adding — rejects if insufficient.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const productId = body?.productId;
  const quantity = body?.quantity ?? 1;

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "productId is required" } },
      { status: 400 },
    );
  }

  if (typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "quantity must be >= 1" } },
      { status: 400 },
    );
  }

  // Check product exists and has enough stock
  const { db } = await import("@/lib/db");
  const product = await db.product.findFirst({ where: { id: productId, active: true } });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "ไม่พบสินค้า" } },
      { status: 404 },
    );
  }

  // Check if adding this quantity would exceed stock
  const currentLines = await readCartCookie();
  const existingQty = currentLines.find((l) => l.productId === productId)?.quantity ?? 0;
  const totalAfterAdd = existingQty + quantity;

  if (totalAfterAdd > product.stock) {
    return NextResponse.json(
      { ok: false, error: { code: "INSUFFICIENT_STOCK", message: `สินค้าเหลือ ${product.stock} ชิ้น (ในตะกร้ามีอยู่ ${existingQty} แล้ว)` } },
      { status: 409 },
    );
  }

  const lines = await addToCart(productId, quantity);
  const cart = await resolveCart(lines);
  return NextResponse.json({ ok: true, data: cart });
}
