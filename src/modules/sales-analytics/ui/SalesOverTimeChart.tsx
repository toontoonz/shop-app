"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatTHB } from "@/lib/money";
import type { SalesPoint } from "../queries/sales";

type Props = {
  points: SalesPoint[];
  interval: "DAY" | "MONTH";
};

export function SalesOverTimeChart({ points, interval }: Props) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">ไม่มีข้อมูลในช่วงเวลานี้</p>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => formatTHB(v)} tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={(value) => [formatTHB(value as number), "ยอดขาย"]} />
          <Bar dataKey="revenueSatang" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
