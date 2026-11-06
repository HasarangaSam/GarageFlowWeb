import { z } from "zod";

export const invoiceStatusSchema = z.enum([
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "VOID",
]);

// Date inputs submit YYYY-MM-DD, while API callers may send full ISO datetimes.
const invoiceDueDateSchema = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
          new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
        : z.iso.datetime().safeParse(value).success,
    "Invalid due date",
  );

export const createInvoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description is too long"),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),

  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  repairJobId: z.string().uuid("Invalid repair job ID"),

  labourItems: z.array(createInvoiceItemSchema).default([]),

  discount: z.number().min(0, "Discount cannot be negative").default(0),

  tax: z.number().min(0, "Tax cannot be negative").default(0),

  dueDate: invoiceDueDateSchema.optional(),
});

export const updateInvoiceSchema = z.object({
  discount: z.number().min(0, "Discount cannot be negative").optional(),

  tax: z.number().min(0, "Tax cannot be negative").optional(),

  dueDate: invoiceDueDateSchema.optional(),

  status: invoiceStatusSchema.optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
