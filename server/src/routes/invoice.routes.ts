import { Router } from "express";

import {
  createInvoiceController,
  deleteInvoiceController,
  getInvoiceController,
  getInvoiceSummaryController,
  getInvoicesController,
  updateInvoiceController,
} from "../controllers/invoice.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getInvoicesController),
);

router.get(
  "/summary",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getInvoiceSummaryController),
);

router.get(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getInvoiceController),
);

router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(createInvoiceController),
);

router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  asyncHandler(updateInvoiceController),
);

router.delete(
  "/:id",
  requireRole("OWNER"),
  asyncHandler(deleteInvoiceController),
);

export default router;
