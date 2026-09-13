import type { Request, Response } from "express";

type CustomerIdParams = {
  id: string;
};

import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../schemas/customer.schema.js";

import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../services/customer.service.js";

import { AppError } from "../utils/errors.js";

export const listCustomers = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const result = await getCustomers({
    page,
    limit,
    search,
  });

  res.json({
    success: true,
    data: result,
  });
};

export const getCustomer = async (
  req: Request<CustomerIdParams>,
  res: Response,
) => {
  const customer = await getCustomerById(req.params.id);

  res.json({
    success: true,
    data: {
      customer,
    },
  });
};

export const create = async (req: Request, res: Response) => {
  const result = createCustomerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid customer data", 400);
  }

  const customer = await createCustomer(result.data);

  res.status(201).json({
    success: true,
    data: {
      customer,
    },
  });
};

export const update = async (req: Request<CustomerIdParams>, res: Response) => {
  const result = updateCustomerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid customer data", 400);
  }

  const customer = await updateCustomer(req.params.id, result.data);

  res.json({
    success: true,
    data: {
      customer,
    },
  });
};

export const remove = async (req: Request<CustomerIdParams>, res: Response) => {
  await deleteCustomer(req.params.id);

  res.json({
    success: true,
    message: "Customer deleted successfully",
  });
};
