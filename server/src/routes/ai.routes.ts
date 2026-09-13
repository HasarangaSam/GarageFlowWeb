import { Router } from "express";

import { chatWithAI } from "../controllers/ai.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const aiRouter = Router();

aiRouter.post("/chat", requireAuth, requireRole("OWNER", "MANAGER"), chatWithAI);
