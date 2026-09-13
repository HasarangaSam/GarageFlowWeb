import { Router } from "express";

import {
  getNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notification.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getNotificationsController));

router.patch("/:id/read", asyncHandler(markNotificationAsReadController));

router.patch("/read-all", asyncHandler(markAllNotificationsAsReadController));

export default router;
