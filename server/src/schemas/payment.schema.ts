import { z } from "zod";

export const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
]);

export const createPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),

  method: paymentMethodSchema,

  reference: z.string().trim().max(200, "Reference is too long").optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
