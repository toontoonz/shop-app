"use client";

import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h2 className="text-lg font-bold text-red-700">เกิดข้อผิดพลาด</h2>
      <p className="mt-2 text-sm text-gray-600">กรุณาลองใหม่อีกครั้ง</p>
      <Button onClick={reset} className="mt-4">
        ลองใหม่
      </Button>
    </div>
  );
}
