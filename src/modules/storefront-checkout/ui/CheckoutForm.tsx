"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CheckoutSchema, type CheckoutInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethodPicker } from "./PaymentMethodPicker";

export function CheckoutForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      buyerEmail: "",
      paymentMethod: undefined,
    },
  });

  const onSubmit = async (data: CheckoutInput) => {
    setServerError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!json.ok) {
      if (json.error?.code === "INSUFFICIENT_STOCK") {
        setServerError("สินค้าบางรายการมีจำนวนคงเหลือไม่พอ กรุณากลับไปตรวจสอบตะกร้า");
      } else if (json.error?.code === "CONFLICT") {
        setServerError("ตะกร้าว่าง กรุณาเพิ่มสินค้าก่อนสั่งซื้อ");
      } else {
        setServerError(json.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return;
    }

    // Success — redirect to confirmation page for the first order
    const firstOrderId = json.data.orders[0]?.id;
    if (firstOrderId) {
      router.push(`/confirmation/${firstOrderId}`);
    } else {
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Buyer Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerName">ชื่อ *</Label>
        <Input
          id="buyerName"
          placeholder="ชื่อผู้สั่งซื้อ"
          {...register("buyerName")}
          aria-invalid={!!errors.buyerName}
        />
        {errors.buyerName && (
          <p className="text-sm text-red-600">{errors.buyerName.message}</p>
        )}
      </div>

      {/* Buyer Phone */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerPhone">เบอร์โทร *</Label>
        <Input
          id="buyerPhone"
          placeholder="08x-xxxxxxx"
          type="tel"
          {...register("buyerPhone")}
          aria-invalid={!!errors.buyerPhone}
        />
        {errors.buyerPhone && (
          <p className="text-sm text-red-600">{errors.buyerPhone.message}</p>
        )}
      </div>

      {/* Buyer Email (optional) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerEmail">อีเมล (ไม่บังคับ)</Label>
        <Input
          id="buyerEmail"
          placeholder="email@example.com"
          type="email"
          {...register("buyerEmail")}
          aria-invalid={!!errors.buyerEmail}
        />
        {errors.buyerEmail && (
          <p className="text-sm text-red-600">{errors.buyerEmail.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <Controller
        name="paymentMethod"
        control={control}
        render={({ field, fieldState }) => (
          <PaymentMethodPicker
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      {/* Server Error */}
      {serverError && (
        <p className="rounded-md bg-red-50 p-3 text-center text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full" size="lg">
        {isSubmitting ? "กำลังสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
      </Button>
    </form>
  );
}
