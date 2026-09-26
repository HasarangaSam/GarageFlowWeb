import type { Request, Response } from "express";

import { addJobPartSchema, addJobPartsSchema } from "../schemas/job-part.schema.js";

import {
  addJobPart,
  addJobParts,
  getJobParts,
  removeJobPart,
} from "../services/job-part.service.js";

import { AppError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

type JobPartParams = {
  id: string;
  jobPartId: string;
};

export const getJobPartsController = async (
  req: Request<JobPartParams>,
  res: Response,
) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const parts = await getJobParts(req.params.id, authReq.user);

  res.status(200).json({
    success: true,
    data: {
      parts,
    },
  });
};

export const addJobPartController = async (
  req: Request<JobPartParams>,
  res: Response,
) => {
  const result = addJobPartSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid job part data",
      400,
    );
  }

  const authReq = req as unknown as AuthenticatedRequest;
  const jobPart = await addJobPart(req.params.id, result.data, authReq.user);

  res.status(201).json({
    success: true,
    data: {
      jobPart,
    },
  });
};

export const addJobPartsController = async (
  req: Request<JobPartParams>,
  res: Response,
) => {
  const result = addJobPartsSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid job parts data",
      400,
    );
  }

  const authReq = req as unknown as AuthenticatedRequest;
  const jobParts = await addJobParts(req.params.id, result.data.parts, authReq.user);

  res.status(201).json({
    success: true,
    data: { jobParts },
  });
};

export const removeJobPartController = async (
  req: Request<JobPartParams>,
  res: Response,
) => {
  const authReq = req as unknown as AuthenticatedRequest;
  await removeJobPart(req.params.id, req.params.jobPartId, authReq.user);

  res.status(200).json({
    success: true,
    message: "Part removed from repair job successfully",
  });
};
