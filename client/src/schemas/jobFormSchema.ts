import { z } from "zod";

export const jobFormSchema = z
  .object({
    customerId: z.string().uuid("Please select a customer"),

    vehicleId: z.string().uuid("Please select a vehicle"),

    mechanicId: z.string().optional(),

    complaint: z
      .string()
      .trim()
      .min(5, "Complaint must be at least 5 characters")
      .max(2000, "Complaint is too long"),

    diagnosis: z.string().trim().max(2000, "Diagnosis is too long").optional(),

    status: z.enum([
      "RECEIVED",
      "IN_PROGRESS",
      "WAITING_FOR_PARTS",
      "COMPLETED",
      "READY_FOR_PICKUP",
      "DELIVERED",
    ]),

    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),

    mileageIn: z
      .number()
      .int("Mileage must be a whole number")
      .min(0, "Mileage cannot be negative")
      .optional(),

    mileageOut: z
      .number()
      .int("Mileage must be a whole number")
      .min(0, "Mileage cannot be negative")
      .optional(),

    notes: z.string().trim().max(2000, "Notes are too long").optional(),
  })
  .superRefine((values, context) => {
    if (
      values.mileageIn !== undefined &&
      values.mileageOut !== undefined &&
      values.mileageOut < values.mileageIn
    ) {
      context.addIssue({
        code: "custom",
        path: ["mileageOut"],
        message: "Mileage out cannot be lower than mileage in",
      });
    }
  });

export const mechanicJobUpdateSchema = z.object({
  diagnosis: z.string().trim().max(2000, "Diagnosis is too long").optional(),
  status: z
    .enum([
      "RECEIVED",
      "IN_PROGRESS",
      "WAITING_FOR_PARTS",
      "COMPLETED",
      "READY_FOR_PICKUP",
      "DELIVERED",
    ])
    .optional(),
  mileageOut: z
    .number()
    .int("Mileage must be a whole number")
    .min(0, "Mileage cannot be negative")
    .optional(),
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;
