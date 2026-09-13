import type { Request, Response } from "express";

import { getDashboardSummary } from "../services/dashboard.service.js";

export const getDashboard = async (_req: Request, res: Response) => {
  const dashboard = await getDashboardSummary();

  res.status(200).json({
    success: true,
    data: dashboard,
  });
};
