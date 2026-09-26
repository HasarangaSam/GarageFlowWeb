import { Router } from "express";

import {
  createVehicleController,
  deleteVehicleController,
  getVehicleController,
  getVehiclesController,
  updateVehicleController,
} from "../controllers/vehicle.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("OWNER", "MANAGER"), asyncHandler(getVehiclesController));

router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(createVehicleController),
);

router.get("/:id", requireRole("OWNER", "MANAGER"), asyncHandler(getVehicleController));

router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(updateVehicleController),
);

router.delete(
  "/:id",
  requireRole("OWNER"),
  asyncHandler(deleteVehicleController),
);

export default router;
