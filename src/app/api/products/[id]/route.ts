import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id] — Public product detail with seller info.
 * Returns 404 if not found or inactive.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, active: true },
    include: {
      seller: { select: { id: true, displayName: true } },
    },
  });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "ไม่พบสินค้า" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: product.id,
      name: product.name,
      description: product.description,
      priceSatang: product.priceSatang,
      stock: product.stock,
      imageUrl: product.imageUrl,
      seller: { id: product.seller.id, displayName: product.seller.displayName },
    },
  });
}
