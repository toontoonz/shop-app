"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { canAdvance, getNextStatus } from "@/modules/storefront-checkout";
import type { OrderStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  PAID: "ชำระเงิน",
  PACKING: "กำลังแพ็ค",
  SHIPPED: "จัดส่ง",
};

type Props = {
  orderId: string;
  currentStatus: string;
};

export function AdvanceStatusButton({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!canAdvance(currentStatus as OrderStatus)) {
    return null;
  }

  const nextStatus = getNextStatus(currentStatus as OrderStatus);
  const nextLabel = nextStatus ? STATUS_LABELS[nextStatus] ?? nextStatus : "";

  const handleAdvance = async () => {
    setLoading(true);
    const res = await fetch(`/api/seller/orders/${orderId}/advance-status`, {
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
        <span className="text-sm">เปลี่ยนเป็น &ldquo;{nextLabel}&rdquo;?</span>
        <Button size="sm" onClick={handleAdvance} disabled={loading}>
          {loading ? "..." : "ยืนยัน"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)}>
          ยกเลิก
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => setShowConfirm(true)}>
      เปลี่ยนสถานะ → {nextLabel}
    </Button>
  );
}
