import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readCartCookie, clearCart } from "@/modules/storefront-checkout/services/cart";
import { submitCheckout } from "@/modules/storefront-checkout/services/checkout";
import { CheckoutSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { log } from "@/lib/log";

/**
 * POST /api/checkout — Place order from cart contents.
 * POS model: requires seller login. Order is assigned to the logged-in seller.
 * Body: { buyerName, buyerPhone, buyerEmail?, paymentMethod }
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Require seller login (POS model)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "กรุณา login ก่อนใช้งาน" } },
        { status: 401 },
      );
    }
    const sellerId = session.user.id;

    // 1. Read cart
    const cartLines = await readCartCookie();
    if (cartLines.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "CONFLICT", message: "ตะกร้าว่าง" } },
        { status: 409 },
      );
    }

    // 2. Validate body
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fields[key]) fields[key] = issue.message;
      }
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "ข้อมูลไม่ถูกต้อง", fields } },
        { status: 400 },
      );
    }

    // 3. Submit checkout — all items go to the logged-in seller (POS model)
    const orders = await submitCheckout(cartLines, {
      buyerName: parsed.data.buyerName,
      buyerPhone: parsed.data.buyerPhone,
      buyerEmail: parsed.data.buyerEmail || undefined,
      paymentMethod: parsed.data.paymentMethod as "BANK_TRANSFER" | "COD" | "E_WALLET" | "CREDIT_CARD",
      sellerId, // POS: force all orders to logged-in seller
    });

    // 4. Clear cart
    await clearCart();

    // 5. Return created orders
    const data = orders.map((order) => ({
      id: order.id,
      sellerId: order.sellerId,
      totalSatang: order.totalSatang,
      paymentMethod: order.paymentMethod,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      buyerEmail: order.buyerEmail,
      items: order.items.map((item) => ({
        productNameAtOrder: item.productNameAtOrder,
        quantity: item.quantity,
        unitPriceSatang: item.unitPriceSatang,
      })),
    }));

    return NextResponse.json({ ok: true, data: { orders: data } }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message, fields: err.fields } },
        { status: err.httpStatus },
      );
    }
    log.error({ err }, "Checkout error");
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
