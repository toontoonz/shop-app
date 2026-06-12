import Link from "next/link";
import { formatTHB } from "@/lib/money";
import { StatusBadge } from "./StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrderRow = {
  id: string;
  status: string;
  buyerName: string;
  buyerPhone: string;
  totalSatang: number;
  createdAt: string;
  itemSummary: string;
};

type Props = {
  orders: OrderRow[];
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrdersListAdmin({ orders }: Props) {
  if (orders.length === 0) {
    return <p className="py-8 text-center text-gray-500">ไม่มีออเดอร์ในสถานะนี้</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ออเดอร์</TableHead>
          <TableHead>สถานะ</TableHead>
          <TableHead>ผู้ซื้อ</TableHead>
          <TableHead>สินค้า</TableHead>
          <TableHead className="text-right">ยอดรวม</TableHead>
          <TableHead>วันที่</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={`/orders/${order.id}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                #{order.id.slice(-8)}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={order.status} />
            </TableCell>
            <TableCell>
              <div className="text-sm">{order.buyerName}</div>
              <div className="text-xs text-gray-500">{order.buyerPhone}</div>
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
              {order.itemSummary}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatTHB(order.totalSatang)}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
