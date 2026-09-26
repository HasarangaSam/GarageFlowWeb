import { Router } from "express";

import {
  createPartController,
  deletePartController,
  getPartController,
  getPartsController,
  updatePartController,
  adjustPartStockController,
  getPartTransactionsController,
  getInventorySummaryController,
} from "../controllers/part.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getPartsController));

router.get(
  "/summary",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getInventorySummaryController),
);

router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(createPartController),
);

router.get("/:id", requireRole("OWNER", "MANAGER"), asyncHandler(getPartController));

router.get(
  "/:id/transactions",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getPartTransactionsController),
);

router.post(
  "/:id/adjust",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(adjustPartStockController),
);

router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(updatePartController),
);

router.delete("/:id", requireRole("OWNER"), asyncHandler(deletePartController));

export default router;
