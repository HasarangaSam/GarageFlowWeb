import { api } from "./api";

import type { DashboardResponse } from "../types/dashboard";

export const getDashboard = async (): Promise<DashboardResponse["data"]> => {
  const response = await api.get<DashboardResponse>("/dashboard");

  return response.data.data;
};
