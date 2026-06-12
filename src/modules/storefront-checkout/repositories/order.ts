import { db } from "@/lib/db";
import type { Order, OrderItem, OrderStatus } from "@prisma/client";

export type OrderWithItems = Order & { items: OrderItem[] };

export type OrderFilters = {
  status?: OrderStatus;
};

export const OrderRepository = {
  findById: async (id: string): Promise<OrderWithItems | null> => {
    return db.order.findUnique({
      where: { id },
      include: { items: true },
    });
  },

  findBySellerId: async (
    sellerId: string,
    filters?: OrderFilters,
  ): Promise<OrderWithItems[]> => {
    return db.order.findMany({
      where: {
        sellerId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findByDateRange: async (
    from: Date,
    to: Date,
    options?: { sellerId?: string; status?: OrderStatus | OrderStatus[] },
  ): Promise<Order[]> => {
    return db.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(options?.sellerId ? { sellerId: options.sellerId } : {}),
        ...(options?.status
          ? Array.isArray(options.status)
            ? { status: { in: options.status } }
            : { status: options.status }
          : {}),
      },
      orderBy: { createdAt: "asc" },
    });
  },

  countBySellerId: async (
    sellerId: string,
  ): Promise<Record<OrderStatus | "ALL", number>> => {
    const counts = await db.order.groupBy({
      by: ["status"],
      where: { sellerId },
      _count: true,
    });

    const result: Record<string, number> = {
      ORDERED: 0,
      PAID: 0,
      PACKING: 0,
      SHIPPED: 0,
      CANCELLED: 0,
      ALL: 0,
    };

    for (const row of counts) {
      result[row.status] = row._count;
      result["ALL"] = (result["ALL"] ?? 0) + row._count;
    }

    return result as Record<OrderStatus | "ALL", number>;
  },

  updateStatus: async (orderId: string, newStatus: OrderStatus): Promise<Order> => {
    return db.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  },
};
