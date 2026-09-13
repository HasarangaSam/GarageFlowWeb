import { Router } from "express";

import {
  addJobPartController,
  addJobPartsController,
  getJobPartsController,
  removeJobPartController,
} from "../controllers/job-part.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/:id/parts", asyncHandler(getJobPartsController));

router.post(
  "/:id/parts/batch",
  requireRole("OWNER", "MANAGER", "MECHANIC"),
  asyncHandler(addJobPartsController),
);

router.post(
  "/:id/parts",
  requireRole("OWNER", "MANAGER", "MECHANIC"),
  asyncHandler(addJobPartController),
);

router.delete(
  "/:id/parts/:jobPartId",
  requireRole("OWNER", "MANAGER", "MECHANIC"),
  asyncHandler(removeJobPartController),
);

export default router;
