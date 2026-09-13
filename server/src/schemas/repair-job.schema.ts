import { z } from "zod";

export const jobStatusSchema = z.enum([
  "RECEIVED",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "COMPLETED",
  "READY_FOR_PICKUP",
  "DELIVERED",
]);

export const jobPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const createRepairJobSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),

  vehicleId: z.string().uuid("Invalid vehicle ID"),

  mechanicId: z.string().uuid("Invalid mechanic ID").optional(),

  complaint: z
    .string()
    .trim()
    .min(5, "Complaint must be at least 5 characters")
    .max(2000, "Complaint is too long"),

  diagnosis: z.string().trim().max(2000, "Diagnosis is too long").optional(),

  status: jobStatusSchema.optional(),

  priority: jobPrioritySchema.optional(),

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
});

export const updateRepairJobSchema = createRepairJobSchema
  .omit({
    customerId: true,
    vehicleId: true,
  })
  .partial();

export const mechanicUpdateRepairJobSchema = z.object({
  diagnosis: z.string().trim().max(2000, "Diagnosis is too long").optional(),

  status: jobStatusSchema.optional(),

  mileageOut: z
    .number()
    .int("Mileage must be a whole number")
    .min(0, "Mileage cannot be negative")
    .optional(),

  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

export type CreateRepairJobInput = z.infer<typeof createRepairJobSchema>;

export type UpdateRepairJobInput = z.infer<typeof updateRepairJobSchema>;

export type MechanicUpdateRepairJobInput = z.infer<
  typeof mechanicUpdateRepairJobSchema
>;
