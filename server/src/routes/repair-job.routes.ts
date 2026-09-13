import { Router } from "express";

import {
  createRepairJobController,
  deleteRepairJobController,
  getRepairJobController,
  getRepairJobsController,
  updateRepairJobController,
  updateRepairJobAsMechanicController,
  getMyRepairJobsController,
} from "../controllers/repair-job.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getRepairJobsController));

router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(createRepairJobController),
);

router.get(
  "/my",
  requireRole("MECHANIC"),
  asyncHandler(getMyRepairJobsController),
);

router.get("/:id", asyncHandler(getRepairJobController));

router.patch(
  "/:id/mechanic",
  requireRole("MECHANIC"),
  asyncHandler(updateRepairJobAsMechanicController),
);

router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(updateRepairJobController),
);

router.delete(
  "/:id",
  requireRole("OWNER"),
  asyncHandler(deleteRepairJobController),
);

export default router;
