import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRange, parseRangeParam } from "@/lib/time-range";
import { getSalesOverTime, getOrdersByStatus, getTopSellers, getTopProducts } from "@/modules/sales-analytics";
import { TimeRangePicker } from "@/modules/sales-analytics/ui/TimeRangePicker";
import { SalesOverTimeChart } from "@/modules/sales-analytics/ui/SalesOverTimeChart";
import { OrdersByStatusChart } from "@/modules/sales-analytics/ui/OrdersByStatusChart";
import { TopSellersTable } from "@/modules/sales-analytics/ui/TopSellersTable";
import { TopProductsTable } from "@/modules/sales-analytics/ui/TopProductsTable";

type Props = {
  searchParams: Promise<{ range?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { range: rangeParam } = await searchParams;
  const preset = parseRangeParam(rangeParam);
  const range = resolveRange(preset);

  const [sales, ordersByStatus, topSellers, topProducts] = await Promise.all([
    getSalesOverTime(session.user.id, range),
    getOrdersByStatus(session.user.id, range),
    getTopSellers(session.user.id, range),
    getTopProducts(session.user.id, range),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แดชบอร์ด</h1>
          <p className="text-sm text-slate-500">ภาพรวมยอดขายและสถิติร้านค้า</p>
        </div>
        <TimeRangePicker />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Over Time */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm">📈</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">ยอดขาย</h2>
              <p className="text-xs text-slate-400">รายได้รวมตามช่วงเวลา (เฉพาะออเดอร์ที่ชำระแล้ว)</p>
            </div>
          </div>
          <SalesOverTimeChart points={sales.points} interval={sales.interval} />
        </div>

        {/* Orders by Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm">📊</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">ออเดอร์แยกตามสถานะ</h2>
              <p className="text-xs text-slate-400">จำนวนออเดอร์ในแต่ละสถานะ</p>
            </div>
          </div>
          <OrdersByStatusChart counts={ordersByStatus.counts} />
        </div>
      </div>

      {/* Bottom Row: Top Sellers + Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-sm">🏆</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">ผู้ขายยอดเยี่ยม</h2>
              <p className="text-xs text-slate-400">Top 10 ตามยอดรวม</p>
            </div>
          </div>
          <TopSellersTable rows={topSellers} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm">🔥</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">สินค้าขายดี</h2>
              <p className="text-xs text-slate-400">Top 5 ของคุณตามจำนวนที่ขาย</p>
            </div>
          </div>
          <TopProductsTable rows={topProducts} />
        </div>
      </div>
    </div>
  );
}
