import { NextRequest, NextResponse } from "next/server";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { db } from "@/lib/db";

/**
 * GET /api/products — Public endpoint. Lists all active products with seller info.
 * Supports ?q= for case-insensitive name search.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;

  const products = await db.product.findMany({
    where: {
      active: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      seller: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    priceSatang: p.priceSatang,
    stock: p.stock,
    imageUrl: p.imageUrl,
    seller: { id: p.seller.id, displayName: p.seller.displayName },
  }));

  return NextResponse.json({ ok: true, data: { products: data } });
}
