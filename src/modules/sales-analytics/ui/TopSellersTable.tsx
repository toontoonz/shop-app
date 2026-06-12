import { formatTHB } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TopSellerRow } from "../queries/top-sellers";

type Props = {
  rows: TopSellerRow[];
};

export function TopSellersTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-500">ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>;
  }

  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div
          key={row.sellerId}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm",
            row.isCurrentSeller ? "bg-primary/10 font-semibold" : "hover:bg-gray-50",
          )}
        >
          <span>
            #{row.rank} {row.sellerName}
            {row.isCurrentSeller && <span className="ml-1 text-xs text-primary">(คุณ)</span>}
          </span>
          <span className="font-medium">{formatTHB(row.revenueSatang)}</span>
        </div>
      ))}
    </div>
  );
}
