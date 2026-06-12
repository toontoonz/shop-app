"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "ทั้งหมด", key: "ALL" },
  { value: "ORDERED", label: "สั่งซื้อ", key: "ORDERED" },
  { value: "PAID", label: "ชำระเงิน", key: "PAID" },
  { value: "PACKING", label: "กำลังแพ็ค", key: "PACKING" },
  { value: "SHIPPED", label: "จัดส่ง", key: "SHIPPED" },
  { value: "CANCELLED", label: "ยกเลิก", key: "CANCELLED" },
] as const;

type Props = {
  counts: Record<string, number>;
};

export function StatusFilter({ counts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "";

  const handleSelect = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    router.push(`/orders?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const count = counts[filter.key] ?? 0;
        const isActive = current === filter.value;
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => handleSelect(filter.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {filter.label}
            <span className="ml-1 text-xs opacity-75">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
