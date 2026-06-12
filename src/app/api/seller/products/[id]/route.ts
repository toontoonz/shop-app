import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { ProductRepository } from "@/modules/seller-account-catalog";
import { ProductUpdateSchema } from "@/lib/validation";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * GET /api/seller/products/[id] — Get own product detail.
 */
export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  withSellerAuth(async (_req, { seller }) => {
    const { id } = await params;
    const product = await ProductRepository.findActiveById(id);
    if (!product || product.sellerId !== seller.id) {
      throw new NotFoundError("ไม่พบสินค้า");
    }
    return NextResponse.json({ ok: true, data: { product } });
  })(req);

/**
 * PATCH /api/seller/products/[id] — Update own product.
 */
export const PATCH = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  withSellerAuth(async (innerReq, { seller }) => {
    const { id } = await params;
    const body = await innerReq.json();
    const parsed = ProductUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fields[key]) fields[key] = issue.message;
      }
      throw new ValidationError("ข้อมูลไม่ถูกต้อง", fields);
    }

    const updated = await ProductRepository.updateOwnedById(id, seller.id, parsed.data);
    if (!updated) {
      throw new NotFoundError("ไม่พบสินค้า");
    }
    return NextResponse.json({ ok: true, data: { product: updated } });
  })(req);

/**
 * DELETE /api/seller/products/[id] — Soft-delete own product.
 */
export const DELETE = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  withSellerAuth(async (_req, { seller }) => {
    const { id } = await params;
    const deleted = await ProductRepository.softDelete(id, seller.id);
    if (!deleted) {
      throw new NotFoundError("ไม่พบสินค้า");
    }
    return NextResponse.json({ ok: true, data: { deleted: true } });
  })(req);
