import { api } from "./api";
import type {
  Part,
  PartListParams,
  PartsResponse,
  PartResponse,
  InventorySummary,
  InventorySummaryResponse,
  PartTransactionsResponse,
  InventoryTransaction,
  CreatePartInput,
  UpdatePartInput,
  AdjustStockInput,
} from "../types/part";

export const getParts = async (
  params: PartListParams = {},
): Promise<{
  parts: Part[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const response = await api.get<PartsResponse>("/parts", { params });
  return response.data.data;
};

export const getInventorySummary = async (): Promise<InventorySummary> => {
  const response = await api.get<InventorySummaryResponse>("/parts/summary");
  return response.data.data.summary;
};

export const getPartById = async (partId: string): Promise<Part> => {
  const response = await api.get<PartResponse>(`/parts/${partId}`);
  return response.data.data.part;
};

export const getPartTransactions = async (
  partId: string,
): Promise<{
  part: { id: string; name: string; sku: string };
  transactions: InventoryTransaction[];
}> => {
  const response = await api.get<PartTransactionsResponse>(
    `/parts/${partId}/transactions`,
  );
  return response.data.data;
};

export const createPart = async (input: CreatePartInput): Promise<Part> => {
  const response = await api.post<PartResponse>("/parts", input);
  return response.data.data.part;
};

export const updatePart = async (
  partId: string,
  input: UpdatePartInput,
): Promise<Part> => {
  const response = await api.patch<PartResponse>(`/parts/${partId}`, input);
  return response.data.data.part;
};

export const adjustPartStock = async (
  partId: string,
  input: AdjustStockInput,
): Promise<Part> => {
  const response = await api.post<PartResponse>(
    `/parts/${partId}/adjust`,
    input,
  );
  return response.data.data.part;
};

export const deletePart = async (partId: string): Promise<void> => {
  await api.delete(`/parts/${partId}`);
};
