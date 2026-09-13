import { z } from "zod";

export const addJobPartSchema = z.object({
  partId: z.string().uuid("Invalid part ID"),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const addJobPartsSchema = z.object({
  parts: z
    .array(addJobPartSchema)
    .min(1, "Select at least one part")
    .refine(
      (parts) => new Set(parts.map((part) => part.partId)).size === parts.length,
      "Each part can only be selected once",
    ),
});

export type AddJobPartInput = z.infer<typeof addJobPartSchema>;
export type AddJobPartsInput = z.infer<typeof addJobPartsSchema>;
