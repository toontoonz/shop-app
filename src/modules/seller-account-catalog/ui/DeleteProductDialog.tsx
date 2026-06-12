"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  productName: string;
};

export function DeleteProductDialog({ productId, productName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/seller/products/${productId}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);

    if (json.ok) {
      router.refresh();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm" />}
      >
        ลบ
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันลบสินค้า</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบ &ldquo;{productName}&rdquo; หรือไม่? สินค้าจะไม่แสดงบนหน้าร้านอีกต่อไป
            แต่ออเดอร์เดิมจะยังคงเห็นข้อมูลสินค้า
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "กำลังลบ..." : "ยืนยันลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
