import { z } from "zod";

/**
 * Thai phone number regex:
 * - Starts with 0 followed by 8-9 digits OR
 * - Starts with +66 followed by 8-9 digits
 */
export const ThaiPhoneRegex = /^(\+66|0)\d{8,9}$/;

export const BuyerInfoSchema = z.object({
  buyerName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  buyerPhone: z.string().regex(ThaiPhoneRegex, "กรุณากรอกเบอร์โทรที่ถูกต้อง"),
  buyerEmail: z
    .union([z.string().email("รูปแบบอีเมลไม่ถูกต้อง"), z.literal("")])
    .optional(),
});

export type BuyerInfoInput = z.infer<typeof BuyerInfoSchema>;
