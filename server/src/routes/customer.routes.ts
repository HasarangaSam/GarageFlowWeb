import { Router } from "express";

import {
  create,
  getCustomer,
  listCustomers,
  remove,
  update,
} from "../controllers/customer.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("OWNER", "MANAGER"), asyncHandler(listCustomers));

router.get("/:id", requireRole("OWNER", "MANAGER"), asyncHandler(getCustomer));

router.post("/", requireRole("OWNER", "MANAGER"), asyncHandler(create));

router.patch("/:id", requireRole("OWNER", "MANAGER"), asyncHandler(update));

router.delete("/:id", requireRole("OWNER"), asyncHandler(remove));

export default router;
