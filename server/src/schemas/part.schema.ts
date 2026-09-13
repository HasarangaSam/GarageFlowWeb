import { z } from "zod";

export const createPartSchema = z.object({
  sku: z.string().trim().min(2, "SKU is required").max(50, "SKU is too long"),

  name: z
    .string()
    .trim()
    .min(2, "Part name must be at least 2 characters")
    .max(100, "Part name is too long"),

  description: z.string().trim().max(500, "Description is too long").optional(),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative")
    .default(0),

  minimumStock: z
    .number()
    .int("Minimum stock must be a whole number")
    .min(0, "Minimum stock cannot be negative")
    .default(5),

  costPrice: z.number().min(0, "Cost price cannot be negative"),

  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

export const updatePartSchema = createPartSchema.partial();

export const adjustStockSchema = z.object({
  type: z.enum(["PURCHASE", "ADJUSTMENT", "RETURN", "DAMAGE"]),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .refine((n) => n !== 0, "Quantity cannot be zero"),
  reason: z.string().trim().max(255, "Reason is too long").optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
