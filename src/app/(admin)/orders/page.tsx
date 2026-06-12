import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OrderRepository } from "@/modules/storefront-checkout";
import { OrdersListAdmin } from "@/modules/order-fulfillment/ui/OrdersListAdmin";
import { StatusFilter } from "@/modules/order-fulfillment/ui/StatusFilter";
import type { OrderStatus } from "@prisma/client";

const VALID_STATUSES = new Set(["ORDERED", "PAID", "PACKING", "SHIPPED", "CANCELLED"]);

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function OrdersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { status } = await searchParams;
  const statusFilter = status && VALID_STATUSES.has(status) ? (status as OrderStatus) : undefined;

  const [orders, counts] = await Promise.all([
    OrderRepository.findBySellerId(session.user.id, statusFilter ? { status: statusFilter } : undefined),
    OrderRepository.countBySellerId(session.user.id),
  ]);

  const orderRows = orders.map((order) => ({
    id: order.id,
    status: order.status,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    totalSatang: order.totalSatang,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.length,
    itemSummary: order.items.map((i) => `${i.productNameAtOrder} ×${i.quantity}`).join(", "),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ออเดอร์</h1>
      <StatusFilter counts={counts} />
      <OrdersListAdmin orders={orderRows} />
    </div>
  );
}
