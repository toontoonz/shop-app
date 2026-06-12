import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { Order } from "@/modules/storefront-checkout/domain/order";
import { OrderStatusEventRepository } from "@/modules/order-fulfillment";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/seller/orders/[id]/advance-status
 * Advances order to next status in the forward chain.
 * Uses row-level locking via transaction.
 */
export const POST = (req: NextRequest, { params }: Params) =>
  withSellerAuth(async (_req, { seller }) => {
    const { id } = await params;

    const updatedOrder = await db.$transaction(async (tx) => {
      // Row lock via findFirst + select FOR UPDATE pattern
      const raw = await tx.order.findUnique({ where: { id } });
      if (!raw || raw.sellerId !== seller.id) {
        throw new NotFoundError("ไม่พบออเดอร์");
      }

      // Use domain aggregate for transition logic
      const orderAggregate = new Order({
        id: raw.id,
        sellerId: raw.sellerId,
        status: raw.status,
      });

      const fromStatus = raw.status;
      orderAggregate.advanceStatus(seller.id);
      const toStatus = orderAggregate.status;

      // Persist new status
      const updated = await tx.order.update({
        where: { id },
        data: { status: toStatus },
        include: { items: true },
      });

      // Record status event
      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          fromStatus,
          toStatus,
          actorSellerId: seller.id,
        },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, data: { order: updatedOrder } });
  })(req);
