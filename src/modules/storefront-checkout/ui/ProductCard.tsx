"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTHB } from "@/lib/money";

type Props = {
  id: string;
  name: string;
  priceSatang: number;
  stock: number;
  imageUrl: string | null;
  sellerName: string;
};

export function ProductCard({ id, name, priceSatang, stock, imageUrl }: Props) {
  const outOfStock = stock === 0;
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    setError(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    const json = await res.json();
    setAdding(false);

    if (!json.ok) {
      setError(json.error?.message ?? "เพิ่มไม่ได้");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/product/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300"
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl opacity-30 transition-opacity group-hover:opacity-50">📦</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
              สินค้าหมด
            </span>
          </div>
        )}

        {/* Stock badge (in stock) */}
        {!outOfStock && (
          <div className="absolute bottom-2 right-2">
            <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              เหลือ {stock}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
          {name}
        </h3>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <p className="text-lg font-bold text-indigo-600">{formatTHB(priceSatang)}</p>
        </div>

        {/* Add to Cart button */}
        {!outOfStock && (
          <>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`mt-2 w-full rounded-lg py-2 text-xs font-semibold transition-all ${
                added
                  ? "bg-green-500 text-white"
                  : error
                    ? "bg-red-50 text-red-600"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.97]"
              } disabled:opacity-50`}
            >
              {adding ? "..." : added ? "✓ เพิ่มแล้ว" : error ? "⚠️ เต็ม" : "🛒 เพิ่มลงตะกร้า"}
            </button>
            {error && (
              <p className="mt-1 text-center text-[10px] text-red-500">{error}</p>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
