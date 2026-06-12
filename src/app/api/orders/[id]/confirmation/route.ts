import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id]/confirmation — Public read of order confirmation.
 * Returns minimal order info for the buyer confirmation page.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      seller: { select: { displayName: true } },
    },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "ไม่พบออเดอร์" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: order.id,
      sellerName: order.seller.displayName,
      totalSatang: order.totalSatang,
      paymentMethod: order.paymentMethod,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      buyerEmail: order.buyerEmail,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        productNameAtOrder: item.productNameAtOrder,
        quantity: item.quantity,
        unitPriceSatang: item.unitPriceSatang,
      })),
    },
  });
}
