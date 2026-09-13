import { z } from "zod";

export const vehicleFormSchema = z.object({
  customerId: z.string().uuid("Please select a customer"),

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

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
