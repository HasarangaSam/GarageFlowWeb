import { z } from "zod";

export const createVehicleSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),

  registrationNumber: z
    .string()
    .trim()
    .min(2, "Registration number is required")
    .max(20, "Registration number is too long"),

  make: z
    .string()
    .trim()
    .min(2, "Make must be at least 2 characters")
    .max(50, "Make is too long"),

  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(50, "Model is too long"),

  year: z
    .number()
    .int("Year must be a whole number")
    .min(1900, "Invalid vehicle year")
    .max(new Date().getFullYear() + 1, "Invalid vehicle year")
    .optional(),

  mileage: z
    .number()
    .int("Mileage must be a whole number")
    .min(0, "Mileage cannot be negative")
    .optional(),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({
    customerId: true,
  })
  .partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
