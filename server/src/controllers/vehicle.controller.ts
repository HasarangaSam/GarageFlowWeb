import type { Request, Response } from "express";

type VehicleIdParams = {
  id: string;
};

import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema.js";

import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
} from "../services/vehicle.service.js";

import { AppError } from "../utils/errors.js";

export const getVehiclesController = async (req: Request, res: Response) => {
  const page = Math.max(Number.parseInt(req.query.page as string) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit as string) || 10, 1),
    50,
  );

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const result = await getVehicles({
    page,
    limit,
    search,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getVehicleController = async (
  req: Request<VehicleIdParams>,
  res: Response,
) => {
  const vehicle = await getVehicleById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      vehicle,
    },
  });
};

export const createVehicleController = async (req: Request, res: Response) => {
  const result = createVehicleSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid vehicle data",
      400,
    );
  }

  const vehicle = await createVehicle(result.data);

  res.status(201).json({
    success: true,
    data: {
      vehicle,
    },
  });
};

export const updateVehicleController = async (
  req: Request<VehicleIdParams>,
  res: Response,
) => {
  const result = updateVehicleSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message || "Invalid vehicle data",
      400,
    );
  }

  const vehicle = await updateVehicle(req.params.id, result.data);

  res.status(200).json({
    success: true,
    data: {
      vehicle,
    },
  });
};

export const deleteVehicleController = async (
  req: Request<VehicleIdParams>,
  res: Response,
) => {
  await deleteVehicle(req.params.id);

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
  });
};
