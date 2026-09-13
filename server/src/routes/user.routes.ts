import { Router } from "express";

import {
  createStaffController,
  deleteStaffController,
  listMechanicsController,
  listUsersController,
  updateStaffController,
} from "../controllers/user.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

// GET /api/users — owner/manager only; supports ?role=MECHANIC&search=...
router.get(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(listUsersController),
);

// Staff account management is restricted to the garage owner.
router.post("/", requireRole("OWNER"), asyncHandler(createStaffController));
router.patch("/:id", requireRole("OWNER"), asyncHandler(updateStaffController));
router.delete("/:id", requireRole("OWNER"), asyncHandler(deleteStaffController));

// GET /api/users/mechanics — owner/manager only; returns all mechanics
router.get(
  "/mechanics",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(listMechanicsController),
);

export default router;
