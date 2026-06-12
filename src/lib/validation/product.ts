import { z } from "zod";

export const ProductCreateSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(200),
  description: z.string().max(2000).optional(),
  priceSatang: z.number().int().min(0, "ราคาต้องไม่น้อยกว่า 0"),
  stock: z.number().int().min(0, "จำนวนคงเหลือต้องไม่น้อยกว่า 0"),
  imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").optional(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
