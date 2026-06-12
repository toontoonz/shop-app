"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTHB } from "@/lib/money";
import { CheckoutForm } from "@/modules/storefront-checkout/ui/CheckoutForm";
import { buttonVariants } from "@/components/ui/button";
import type { ResolvedCart } from "@/modules/storefront-checkout/services/cart";

export default function CheckoutPage() {
  const [cart, setCart] = useState<ResolvedCart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setCart(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!cart || cart.lineCount === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-lg text-gray-500">ตะกร้าว่าง — ไม่สามารถดำเนินการสั่งซื้อได้</p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          กลับหน้าร้าน
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">สั่งซื้อสินค้า</h1>

      {/* Cart Summary */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">สรุปสินค้า</h2>
        {cart.lines.map((line) => (
          <div key={line.productId} className="flex justify-between py-1 text-sm">
            <span>
              {line.productName} × {line.clampedQuantity}
            </span>
            <span>{formatTHB(line.unitPriceSatang * line.clampedQuantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>รวม</span>
          <span className="text-primary">{formatTHB(cart.totalSatang)}</span>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">ข้อมูลผู้สั่งซื้อ</h2>
        <CheckoutForm />
      </div>
    </div>
  );
}
