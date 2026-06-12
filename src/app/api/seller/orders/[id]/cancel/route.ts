import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { Order } from "@/modules/storefront-checkout/domain/order";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/seller/orders/[id]/cancel
 * Cancels an order and restores stock for each line item.
 */
export const POST = (req: NextRequest, { params }: Params) =>
  withSellerAuth(async (_req, { seller }) => {
    const { id } = await params;

    const updatedOrder = await db.$transaction(async (tx) => {
      const raw = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!raw || raw.sellerId !== seller.id) {
        throw new NotFoundError("ไม่พบออเดอร์");
      }

      // Use domain aggregate for cancel logic
      const orderAggregate = new Order({
        id: raw.id,
        sellerId: raw.sellerId,
        status: raw.status,
      });

      const fromStatus = raw.status;
      orderAggregate.cancel(seller.id);

      // Persist cancelled status
      const updated = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { items: true },
      });

      // Record status event
      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          fromStatus,
          toStatus: "CANCELLED",
          actorSellerId: seller.id,
        },
      });

      // Restore stock for each line item
      for (const item of raw.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return updated;
    });

    return NextResponse.json({ ok: true, data: { order: updatedOrder } });
  })(req);
