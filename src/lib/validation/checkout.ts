import { z } from "zod";
import { BuyerInfoSchema } from "./buyer-info";

export const PaymentMethodEnum = z.enum(["BANK_TRANSFER", "COD", "E_WALLET", "CREDIT_CARD"]);

export const CheckoutSchema = BuyerInfoSchema.extend({
  paymentMethod: PaymentMethodEnum.describe("กรุณาเลือกวิธีชำระเงิน"),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
