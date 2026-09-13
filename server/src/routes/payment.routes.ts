import { Router } from "express";

import {
  createPaymentController,
  deletePaymentController,
  getInvoicePaymentsController,
} from "../controllers/payment.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("OWNER", "MANAGER"));

router.get("/:invoiceId/payments", asyncHandler(getInvoicePaymentsController));

router.post("/:invoiceId/payments", asyncHandler(createPaymentController));

router.delete(
  "/:invoiceId/payments/:paymentId",
  requireRole("OWNER"),
  asyncHandler(deletePaymentController),
);

export default router;
