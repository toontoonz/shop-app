"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCreateSchema, type ProductCreateInput } from "@/lib/validation";
import { parseTHBInput } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  /** If provided, pre-fill form for editing. */
  defaultValues?: {
    id: string;
    name: string;
    description: string | null;
    priceSatang: number;
    stock: number;
    imageUrl: string | null;
  };
};

export function ProductForm({ defaultValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!defaultValues;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          description: defaultValues.description ?? undefined,
          priceSatang: defaultValues.priceSatang,
          stock: defaultValues.stock,
          imageUrl: defaultValues.imageUrl ?? undefined,
        }
      : { name: "", priceSatang: 0, stock: 0 },
  });

  const onSubmit = async (data: ProductCreateInput) => {
    setServerError(null);

    const url = isEdit
      ? `/api/seller/products/${defaultValues!.id}`
      : "/api/seller/products";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!json.ok) {
      setServerError(json.error?.message ?? "เกิดข้อผิดพลาด");
      return;
    }

    router.push("/products");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? "แก้ไขสินค้า" : "สร้างสินค้าใหม่"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">ชื่อสินค้า *</Label>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priceSatang">ราคา (สตางค์) *</Label>
            <Input
              id="priceSatang"
              type="number"
              min={0}
              {...register("priceSatang", { valueAsNumber: true })}
              aria-invalid={!!errors.priceSatang}
            />
            {errors.priceSatang && <p className="text-sm text-red-600">{errors.priceSatang.message}</p>}
            <p className="text-xs text-gray-500">ใส่เป็นสตางค์ เช่น 29900 = ฿299.00</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock">จำนวนคงเหลือ *</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              {...register("stock", { valueAsNumber: true })}
              aria-invalid={!!errors.stock}
            />
            {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="imageUrl">URL รูปภาพ</Label>
            <Input id="imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
            {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 p-2 text-center text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/products")}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
