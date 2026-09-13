import type { Request, Response } from "express";

import {
  createStaffUser,
  deleteStaffUser,
  getMechanics,
  getUsers,
  updateStaffUser,
} from "../services/user.service.js";
import { createStaffSchema, updateStaffSchema } from "../schemas/auth.schema.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const listUsersController = async (req: Request, res: Response) => {
  const role = req.query.role as "OWNER" | "MANAGER" | "MECHANIC" | undefined;

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const users = await getUsers({ role, search });

  res.status(200).json({
    success: true,
    data: {
      users,
    },
  });
};

export const listMechanicsController = async (req: Request, res: Response) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const mechanics = await getMechanics(search);

  res.status(200).json({
    success: true,
    data: {
      mechanics,
    },
  });
};

export const createStaffController = async (req: Request, res: Response) => {
  const result = createStaffSchema.safeParse(req.body);
  if (!result.success) throw new AppError(result.error.issues[0]?.message ?? "Invalid staff account data", 400);

  const user = await createStaffUser(result.data);
  res.status(201).json({ success: true, data: { user } });
};

export const updateStaffController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = updateStaffSchema.safeParse(req.body);
  if (!result.success) throw new AppError(result.error.issues[0]?.message ?? "Invalid staff account data", 400);

  const actor = (req as AuthenticatedRequest).user;
  if (actor.id === req.params.id) {
    throw new AppError("You cannot edit your own account from staff management", 400);
  }

  const user = await updateStaffUser(req.params.id, result.data);
  res.status(200).json({ success: true, data: { user } });
};

export const deleteStaffController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const actor = (req as AuthenticatedRequest).user;
  if (actor.id === req.params.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  await deleteStaffUser(req.params.id);
  res.status(204).send();
};
