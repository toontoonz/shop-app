"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OrderStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "สั่งซื้อ",
  PAID: "ชำระเงิน",
  PACKING: "กำลังแพ็ค",
  SHIPPED: "จัดส่ง",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLORS: Record<string, string> = {
  ORDERED: "#3b82f6",
  PAID: "#eab308",
  PACKING: "#f97316",
  SHIPPED: "#22c55e",
  CANCELLED: "#ef4444",
};

type Props = {
  counts: Record<OrderStatus, number>;
};

export function OrdersByStatusChart({ counts }: Props) {
  const data = Object.entries(counts).map(([status, count]) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    count,
    fill: STATUS_COLORS[status] ?? "#6b7280",
  }));

  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return <p className="py-8 text-center text-sm text-gray-500">ไม่มีข้อมูลในช่วงเวลานี้</p>;
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [value as number, "ออเดอร์"]} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
