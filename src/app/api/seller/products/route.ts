import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { ProductCreateSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";

/**
 * GET /api/seller/products — List current seller's active products.
 */
export const GET = withSellerAuth(async (_req, { seller }) => {
  const products = await ProductRepository.findActiveBySellerId(seller.id);
  return NextResponse.json({ ok: true, data: { products } });
});

/**
 * POST /api/seller/products — Create a new product for current seller.
 */
export const POST = withSellerAuth(async (req, { seller }) => {
  const body = await req.json();
  const parsed = ProductCreateSchema.safeParse(body);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fields[key]) fields[key] = issue.message;
    }
    throw new ValidationError("ข้อมูลสินค้าไม่ถูกต้อง", fields);
  }

  const product = await ProductRepository.create(seller.id, parsed.data);
  return NextResponse.json({ ok: true, data: { product } }, { status: 201 });
});
