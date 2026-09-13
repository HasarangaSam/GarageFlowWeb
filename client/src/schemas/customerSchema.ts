import { z } from "zod";

export const customerFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required")
    .max(20, "Phone number is too long"),

  email: z.string().trim().email("Invalid email address").or(z.literal("")),

  address: z.string().trim().max(300, "Address is too long"),

  notes: z.string().trim().max(1000, "Notes are too long"),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
