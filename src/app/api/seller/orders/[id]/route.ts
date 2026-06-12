import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { handleApiErrors } from "@/lib/api-handler";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/seller/orders/[id] — Full order detail with items + statusEvents.
 */
export const GET = (req: NextRequest, { params }: Params) =>
  withSellerAuth(async (_req, { seller }) => {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusEvents: { orderBy: { occurredAt: "asc" } },
      },
    });

    if (!order || order.sellerId !== seller.id) {
      throw new NotFoundError("ไม่พบออเดอร์");
    }

    return NextResponse.json({ ok: true, data: { order } });
  })(req);
