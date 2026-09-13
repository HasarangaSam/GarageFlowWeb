import type { Request, Response } from "express";

type InvoiceIdParams = {
  id: string;
};

import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../schemas/invoice.schema.js";

import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  updateInvoice,
} from "../services/invoice.service.js";

import { AppError } from "../utils/errors.js";

export const getInvoicesController = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const status =
    typeof req.query.status === "string" && req.query.status !== "all"
      ? req.query.status
      : undefined;

  const result = await getInvoices({
    page,
    limit,
    search,
    status,
  });

  res.status(200).json({
    success: true,
    data: result,
    ...result,
  });
};

export const getInvoiceSummaryController = async (
  _req: Request,
  res: Response,
) => {
  const summary = await getInvoiceSummary();

  res.status(200).json({
    success: true,
    data: {
      summary,
    },
    summary,
  });
};

export const getInvoiceController = async (
  req: Request<InvoiceIdParams>,
  res: Response,
) => {
  const invoice = await getInvoiceById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      invoice,
    },
    invoice,
  });
};

export const createInvoiceController = async (req: Request, res: Response) => {
  const result = createInvoiceSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(JSON.stringify(result.error.flatten().fieldErrors), 400);
  }

  const invoice = await createInvoice(result.data);

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: {
      invoice,
    },
    invoice,
  });
};

export const updateInvoiceController = async (
  req: Request<InvoiceIdParams>,
  res: Response,
) => {
  const result = updateInvoiceSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(JSON.stringify(result.error.flatten().fieldErrors), 400);
  }

  const invoice = await updateInvoice(req.params.id, result.data);

  res.status(200).json({
    success: true,
    message: "Invoice updated successfully",
    data: {
      invoice,
    },
    invoice,
  });
};

export const deleteInvoiceController = async (
  req: Request<InvoiceIdParams>,
  res: Response,
) => {
  await deleteInvoice(req.params.id);

  res.status(200).json({
    success: true,
    message: "Invoice deleted successfully",
  });
};
