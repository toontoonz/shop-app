"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePreset } from "@/lib/time-range";

const LABELS: Record<RangePreset, string> = {
  TODAY: "วันนี้",
  LAST_7D: "7 วัน",
  LAST_30D: "30 วัน",
  THIS_MONTH: "เดือนนี้",
  THIS_YEAR: "ปีนี้",
};

export function TimeRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("range") ?? "LAST_30D") as RangePreset;

  const handleSelect = (preset: RangePreset) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {RANGE_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => handleSelect(preset)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            current === preset
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {LABELS[preset]}
        </button>
      ))}
    </div>
  );
}
