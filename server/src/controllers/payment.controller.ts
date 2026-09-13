import type { Request, Response } from "express";

import { createPaymentSchema } from "../schemas/payment.schema.js";

import {
  createPayment,
  deletePayment,
  getInvoicePayments,
} from "../services/payment.service.js";

import { AppError } from "../utils/errors.js";

type InvoiceParams = {
  invoiceId: string;
};

type PaymentParams = {
  invoiceId: string;
  paymentId: string;
};

export const getInvoicePaymentsController = async (
  req: Request<InvoiceParams>,
  res: Response,
) => {
  const result = await getInvoicePayments(req.params.invoiceId);

  res.status(200).json(result);
};

export const createPaymentController = async (
  req: Request<InvoiceParams>,
  res: Response,
) => {
  const result = createPaymentSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(JSON.stringify(result.error.flatten().fieldErrors), 400);
  }

  const payment = await createPayment(req.params.invoiceId, result.data);

  res.status(201).json({
    message: "Payment recorded successfully",
    ...payment,
  });
};

export const deletePaymentController = async (
  req: Request<PaymentParams>,
  res: Response,
) => {
  const result = await deletePayment(
    req.params.invoiceId,
    req.params.paymentId,
  );

  res.status(200).json({
    message: "Payment deleted successfully",
    ...result,
  });
};
