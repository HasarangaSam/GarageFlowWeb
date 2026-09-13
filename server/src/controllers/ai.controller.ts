import type { Request, Response } from "express";

import { aiChatSchema } from "../schemas/ai.schema.js";

import { chatWithGarageFlowAI } from "../services/ai.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const chatWithAI = async (req: Request, res: Response) => {
  const authenticatedRequest = req as AuthenticatedRequest;

  const result = aiChatSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });

    return;
  }

  const answer = await chatWithGarageFlowAI(
    result.data.message,
    authenticatedRequest.user.role,
  );

  res.status(200).json({
    success: true,
    data: {
      answer,
    },
  });
};
