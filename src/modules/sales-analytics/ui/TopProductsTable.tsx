import { formatTHB } from "@/lib/money";
import type { TopProductRow } from "../queries/top-products";

type Props = {
  rows: TopProductRow[];
};

export function TopProductsTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-500">ยังไม่มียอดขายสินค้าในช่วงเวลานี้</p>;
  }

  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.productId} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50">
          <span>#{row.rank} {row.productName}</span>
          <span className="text-right">
            <span className="font-medium">{row.quantity} ชิ้น</span>
            <span className="ml-2 text-gray-500">{formatTHB(row.revenueSatang)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
