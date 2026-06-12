import { NextRequest, NextResponse } from "next/server";
import {
  updateCartLineQuantity,
  removeFromCart,
  resolveCart,
} from "@/modules/storefront-checkout/services/cart";

type Params = { params: Promise<{ productId: string }> };

/**
 * PATCH /api/cart/lines/[productId] — Update quantity for a cart line.
 * Body: { quantity: number }
 * Quantity <= 0 removes the line.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { productId } = await params;
  const body = await req.json();
  const quantity = body?.quantity;

  if (typeof quantity !== "number") {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "quantity is required" } },
      { status: 400 },
    );
  }

  const lines = await updateCartLineQuantity(productId, quantity);
  const cart = await resolveCart(lines);
  return NextResponse.json({ ok: true, data: cart });
}

/**
 * DELETE /api/cart/lines/[productId] — Remove a line from the cart.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { productId } = await params;
  const lines = await removeFromCart(productId);
  const cart = await resolveCart(lines);
  return NextResponse.json({ ok: true, data: cart });
}
