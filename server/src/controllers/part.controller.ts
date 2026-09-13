import type { Request, Response } from "express";

import {
  createPartSchema,
  updatePartSchema,
  adjustStockSchema,
} from "../schemas/part.schema.js";

import {
  createPart,
  deletePart,
  getPartById,
  getParts,
  updatePart,
  adjustPartStock,
  getPartTransactions,
  getInventorySummary,
} from "../services/part.service.js";

import { AppError } from "../utils/errors.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

type PartIdParams = {
  id: string;
};

export const getPartsController = async (req: Request, res: Response) => {
  const page = Math.max(Number.parseInt(req.query.page as string) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit as string) || 10, 1),
    100,
  );

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const statusQuery = req.query.status as string | undefined;
  const status =
    statusQuery === "inStock" ||
    statusQuery === "lowStock" ||
    statusQuery === "outOfStock"
      ? statusQuery
      : "all";

  const result = await getParts({
    page,
    limit,
    search,
    status,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getInventorySummaryController = async (
  _req: Request,
  res: Response,
) => {
  const summary = await getInventorySummary();

  res.status(200).json({
    success: true,
    data: {
      summary,
    },
  });
};

export const getPartController = async (
  req: Request<PartIdParams>,
  res: Response,
) => {
  const part = await getPartById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      part,
    },
  });
};

export const createPartController = async (req: Request, res: Response) => {
  const result = createPartSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid part data",
      400,
    );
  }

  const part = await createPart(result.data);

  res.status(201).json({
    success: true,
    data: {
      part,
    },
  });
};

export const updatePartController = async (
  req: Request<PartIdParams>,
  res: Response,
) => {
  const result = updatePartSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid part data",
      400,
    );
  }

  const part = await updatePart(req.params.id, result.data);

  res.status(200).json({
    success: true,
    data: {
      part,
    },
  });
};

export const adjustPartStockController = async (
  req: Request<PartIdParams>,
  res: Response,
) => {
  const result = adjustStockSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid stock adjustment data",
      400,
    );
  }

  const authReq = req as unknown as AuthenticatedRequest;
  const part = await adjustPartStock(
    req.params.id,
    result.data,
    authReq.user?.id,
  );

  res.status(200).json({
    success: true,
    data: {
      part,
    },
  });
};

export const getPartTransactionsController = async (
  req: Request<PartIdParams>,
  res: Response,
) => {
  const result = await getPartTransactions(req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const deletePartController = async (
  req: Request<PartIdParams>,
  res: Response,
) => {
  await deletePart(req.params.id);

  res.status(200).json({
    success: true,
    message: "Part deleted successfully",
  });
};
