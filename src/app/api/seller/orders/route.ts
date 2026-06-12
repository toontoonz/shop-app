import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { OrderRepository } from "@/modules/storefront-checkout";
import type { OrderStatus } from "@prisma/client";

const VALID_STATUSES = new Set(["ORDERED", "PAID", "PACKING", "SHIPPED", "CANCELLED"]);

/**
 * GET /api/seller/orders?status=... — List current seller's orders with counts.
 */
export const GET = withSellerAuth(async (req, { seller }) => {
  const statusParam = req.nextUrl.searchParams.get("status");
  const statusFilter =
    statusParam && VALID_STATUSES.has(statusParam)
      ? (statusParam as OrderStatus)
      : undefined;

  const [orders, counts] = await Promise.all([
    OrderRepository.findBySellerId(seller.id, statusFilter ? { status: statusFilter } : undefined),
    OrderRepository.countBySellerId(seller.id),
  ]);

  const data = orders.map((order) => ({
    id: order.id,
    status: order.status,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    totalSatang: order.totalSatang,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.length,
    itemSummary: order.items.map((i) => `${i.productNameAtOrder} ×${i.quantity}`).join(", "),
  }));

  return NextResponse.json({ ok: true, data: { orders: data, counts } });
});
