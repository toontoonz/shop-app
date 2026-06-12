import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTHB } from "@/lib/money";
import { StatusBadge } from "@/modules/order-fulfillment/ui/StatusBadge";
import { StatusTimeline } from "@/modules/order-fulfillment/ui/StatusTimeline";
import { AdvanceStatusButton } from "@/modules/order-fulfillment/ui/AdvanceStatusButton";
import { CancelOrderButton } from "@/modules/order-fulfillment/ui/CancelOrderButton";

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "โอนเงินผ่านธนาคาร",
  COD: "เก็บเงินปลายทาง",
  E_WALLET: "กระเป๋าเงินอิเล็กทรอนิกส์",
  CREDIT_CARD: "บัตรเครดิต",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
    },
  });

  if (!order || order.sellerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">ออเดอร์ #{order.id.slice(-8)}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-2">
          <AdvanceStatusButton orderId={order.id} currentStatus={order.status} />
          <CancelOrderButton orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items — takes 2 cols */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm">🛍️</span>
            <h2 className="text-sm font-semibold text-slate-800">รายการสินค้า</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.productNameAtOrder}</p>
                  <p className="text-xs text-slate-400">จำนวน: {item.quantity} ชิ้น × {formatTHB(item.unitPriceSatang)}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatTHB(item.unitPriceSatang * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-600">ยอดรวมทั้งหมด</p>
            <p className="text-xl font-bold text-indigo-600">{formatTHB(order.totalSatang)}</p>
          </div>
        </div>

        {/* Buyer Info — 1 col */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm">👤</span>
              <h2 className="text-sm font-semibold text-slate-800">ข้อมูลผู้ซื้อ</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">ชื่อ</dt>
                <dd className="font-medium text-slate-900">{order.buyerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">เบอร์โทร</dt>
                <dd className="font-medium text-slate-900">{order.buyerPhone}</dd>
              </div>
              {order.buyerEmail && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">อีเมล</dt>
                  <dd className="font-medium text-slate-900">{order.buyerEmail}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-500">ชำระเงิน</dt>
                <dd className="font-medium text-slate-900">
                  {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">วันที่สั่ง</dt>
                <dd className="font-medium text-slate-900">
                  {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm">📋</span>
          <h2 className="text-sm font-semibold text-slate-800">ประวัติการเปลี่ยนสถานะ</h2>
        </div>
        <StatusTimeline events={order.statusEvents} />
      </div>
    </div>
  );
}
