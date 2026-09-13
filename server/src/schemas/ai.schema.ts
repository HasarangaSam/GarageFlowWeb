import { z } from "zod";

export const aiChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
