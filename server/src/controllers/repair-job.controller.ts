import type { Request, Response } from "express";

type RepairJobIdParams = {
  id: string;
};

import {
  createRepairJobSchema,
  jobPrioritySchema,
  jobStatusSchema,
  updateRepairJobSchema,
  mechanicUpdateRepairJobSchema,
} from "../schemas/repair-job.schema.js";

import {
  createRepairJob,
  deleteRepairJob,
  getRepairJobById,
  getRepairJobs,
  updateRepairJob,
  updateRepairJobAsMechanic,
  getMyRepairJobs,
} from "../services/repair-job.service.js";

import { AppError } from "../utils/errors.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getRepairJobsController = async (req: Request, res: Response) => {
  const page = Math.max(Number.parseInt(req.query.page as string) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit as string) || 10, 1),
    50,
  );

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const rawStatus =
    typeof req.query.status === "string" ? req.query.status.trim() : undefined;
  let parsedStatus: string | undefined = undefined;

  if (rawStatus) {
    if (rawStatus.includes(",")) {
      parsedStatus = rawStatus;
    } else {
      const statusValidation = jobStatusSchema.safeParse(rawStatus);
      if (!statusValidation.success) {
        throw new AppError("Invalid job status", 400);
      }
      parsedStatus = statusValidation.data;
    }
  }

  const priority =
    typeof req.query.priority === "string"
      ? jobPrioritySchema.safeParse(req.query.priority)
      : null;

  if (priority && !priority.success) {
    throw new AppError("Invalid job priority", 400);
  }

  const mechanicId =
    typeof req.query.mechanicId === "string"
      ? req.query.mechanicId.trim() || undefined
      : undefined;

  const hasInvoice =
    req.query.hasInvoice === "true"
      ? true
      : req.query.hasInvoice === "false"
        ? false
        : undefined;

  const result = await getRepairJobs({
    page,
    limit,
    search,
    status: parsedStatus,
    priority: priority?.success ? priority.data : undefined,
    mechanicId,
    hasInvoice,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getRepairJobController = async (
  req: Request<RepairJobIdParams>,
  res: Response,
) => {
  const authenticatedRequest = req as AuthenticatedRequest;

  const job = await getRepairJobById(req.params.id, authenticatedRequest.user);

  res.status(200).json({
    success: true,
    data: {
      job,
    },
  });
};

export const createRepairJobController = async (
  req: Request,
  res: Response,
) => {
  const result = createRepairJobSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid repair job data",
      400,
    );
  }

  const job = await createRepairJob(result.data);

  res.status(201).json({
    success: true,
    data: {
      job,
    },
  });
};

export const updateRepairJobController = async (
  req: Request<RepairJobIdParams>,
  res: Response,
) => {
  const result = updateRepairJobSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid repair job data",
      400,
    );
  }

  const job = await updateRepairJob(req.params.id, result.data);

  res.status(200).json({
    success: true,
    data: {
      job,
    },
  });
};

export const updateRepairJobAsMechanicController = async (
  req: Request<RepairJobIdParams>,
  res: Response,
) => {
  const result = mechanicUpdateRepairJobSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid repair job data",
      400,
    );
  }

  const authenticatedRequest = req as AuthenticatedRequest;

  const job = await updateRepairJobAsMechanic(
    req.params.id,
    authenticatedRequest.user.id,
    result.data,
  );

  res.status(200).json({
    success: true,
    data: {
      job,
    },
  });
};

export const deleteRepairJobController = async (
  req: Request<RepairJobIdParams>,
  res: Response,
) => {
  await deleteRepairJob(req.params.id);

  res.status(200).json({
    success: true,
    message: "Repair job deleted successfully",
  });
};

export const getMyRepairJobsController = async (
  req: Request,
  res: Response,
) => {
  const page = Math.max(Number.parseInt(req.query.page as string) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit as string) || 10, 1),
    50,
  );

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const status =
    typeof req.query.status === "string" ? req.query.status.trim() : undefined;
  const priority =
    typeof req.query.priority === "string"
      ? jobPrioritySchema.safeParse(req.query.priority)
      : null;

  if (status && !jobStatusSchema.safeParse(status).success) {
    throw new AppError("Invalid job status", 400);
  }

  if (priority && !priority.success) {
    throw new AppError("Invalid job priority", 400);
  }

  const authenticatedRequest = req as AuthenticatedRequest;

  const result = await getMyRepairJobs(
    authenticatedRequest.user.id,
    page,
    limit,
    search,
    status,
    priority?.success ? priority.data : undefined,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};
