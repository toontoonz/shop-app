"use client";

import { useState } from "react";
import { formatTHB } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  productId: string;
  productName: string;
  unitPriceSatang: number;
  quantity: number;
  stock: number;
  wasClamped: boolean;
  onUpdate: () => void;
};

export function CartLineItem({
  productId,
  productName,
  unitPriceSatang,
  quantity,
  stock,
  wasClamped,
  onUpdate,
}: Props) {
  const [loading, setLoading] = useState(false);

  const changeQty = async (newQty: number) => {
    setLoading(true);
    if (newQty <= 0) {
      await fetch(`/api/cart/lines/${productId}`, { method: "DELETE" });
    } else {
      const clamped = Math.min(newQty, stock);
      await fetch(`/api/cart/lines/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: clamped }),
      });
    }
    setLoading(false);
    onUpdate();
  };

  const subtotal = unitPriceSatang * Math.min(quantity, stock);

  return (
    <div className="flex items-center gap-3 border-b py-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{productName}</p>
        <p className="text-xs text-gray-500">{formatTHB(unitPriceSatang)} / ชิ้น</p>
        {wasClamped && (
          <p className="text-xs text-orange-600">เกินจำนวนคงเหลือ (คงเหลือ {stock})</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={() => changeQty(quantity - 1)}
          disabled={loading}
        >
          −
        </Button>
        <Input
          type="number"
          value={Math.min(quantity, stock)}
          onChange={(e) => changeQty(Number(e.target.value))}
          className="w-12 text-center"
          min={1}
          max={stock}
          disabled={loading}
        />
        <Button
          variant="outline"
          size="xs"
          onClick={() => changeQty(quantity + 1)}
          disabled={loading || quantity >= stock}
        >
          +
        </Button>
      </div>
      <p className="w-20 text-right text-sm font-semibold">{formatTHB(subtotal)}</p>
      <Button variant="ghost" size="xs" onClick={() => changeQty(0)} disabled={loading}>
        ✕
      </Button>
    </div>
  );
}
