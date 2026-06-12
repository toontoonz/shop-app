"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatTHB } from "@/lib/money";
import { CartLineItem } from "@/modules/storefront-checkout/ui/CartLine";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import type { ResolvedCart } from "@/modules/storefront-checkout/services/cart";

export default function CartPage() {
  const [cart, setCart] = useState<ResolvedCart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/cart");
    const json = await res.json();
    if (json.ok) setCart(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">กำลังโหลดตะกร้า...</p>
      </div>
    );
  }

  if (!cart || cart.lineCount === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-lg text-gray-500">ตะกร้าว่าง</p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          กลับหน้าร้าน
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">ตะกร้าสินค้า ({cart.lineCount} รายการ)</h1>

      <div className="rounded-lg border bg-white p-4">
        {cart.lines.map((line) => (
          <CartLineItem
            key={line.productId}
            productId={line.productId}
            productName={line.productName}
            unitPriceSatang={line.unitPriceSatang}
            quantity={line.quantity}
            stock={line.stock}
            wasClamped={line.wasClamped}
            onUpdate={fetchCart}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-4">
        <p className="text-lg font-semibold">รวมทั้งหมด</p>
        <p className="text-xl font-bold text-primary">{formatTHB(cart.totalSatang)}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/checkout" className={buttonVariants({ className: "flex-1" })}>
          ดำเนินการสั่งซื้อ
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          เลือกซื้อเพิ่ม
        </Link>
      </div>
    </div>
  );
}
