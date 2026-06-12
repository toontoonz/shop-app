"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { canCancel } from "@/modules/storefront-checkout";
import type { OrderStatus } from "@prisma/client";

type Props = {
  orderId: string;
  currentStatus: string;
};

export function CancelOrderButton({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!canCancel(currentStatus as OrderStatus)) {
    return null;
  }

  const handleCancel = async () => {
    setLoading(true);
    const res = await fetch(`/api/seller/orders/${orderId}/cancel`, {
      method: "POST",
    });
    setLoading(false);
    setShowConfirm(false);

    if (res.ok) {
      router.refresh();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">ยกเลิกออเดอร์นี้?</span>
        <Button size="sm" variant="destructive" onClick={handleCancel} disabled={loading}>
          {loading ? "..." : "ยืนยันยกเลิก"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)}>
          ไม่
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
      ยกเลิกออเดอร์
    </Button>
  );
}
