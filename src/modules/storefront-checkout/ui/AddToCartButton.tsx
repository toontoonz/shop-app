"use client";

import { useState } from "react";

type Props = {
  productId: string;
  stock: number;
};

export function AddToCartButton({ productId, stock }: Props) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const disabled = stock === 0;

  const handleAdd = async () => {
    setLoading(true);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setLoading(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (disabled) {
    return (
      <button
        disabled
        className="mt-4 w-full rounded-xl bg-slate-200 py-3.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
      >
        สินค้าหมด
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`mt-4 w-full rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-all ${
        added
          ? "bg-green-500 text-white scale-[0.98]"
          : "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]"
      } disabled:opacity-60`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          กำลังเพิ่ม...
        </span>
      ) : added ? (
        <span className="flex items-center justify-center gap-2">
          ✓ เพิ่มลงตะกร้าแล้ว
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          🛒 เพิ่มลงตะกร้า
        </span>
      )}
    </button>
  );
}
