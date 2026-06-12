import { db } from "@/lib/db";
import type { OrderStatusEvent } from "@prisma/client";

export const OrderStatusEventRepository = {
  findByOrderId: async (orderId: string): Promise<OrderStatusEvent[]> => {
    return db.orderStatusEvent.findMany({
      where: { orderId },
      orderBy: { occurredAt: "asc" },
    });
  },

  create: async (data: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    actorSellerId: string;
  }): Promise<OrderStatusEvent> => {
    return db.orderStatusEvent.create({
      data: {
        orderId: data.orderId,
        fromStatus: data.fromStatus as never,
        toStatus: data.toStatus as never,
        actorSellerId: data.actorSellerId,
      },
    });
  },
};
