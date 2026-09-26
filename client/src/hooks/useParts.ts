import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  adjustPartStock,
  createPart,
  deletePart,
  getInventorySummary,
  getPartById,
  getParts,
  getPartTransactions,
  updatePart,
} from "../services/partService";
import type {
  AdjustStockInput,
  CreatePartInput,
  PartListParams,
  UpdatePartInput,
} from "../types/part";
import { getErrorMessage } from "../utils/errorMessage";

export const partKeys = {
  all: ["parts"] as const,
  lists: () => [...partKeys.all, "list"] as const,
  list: (params: PartListParams) => [...partKeys.lists(), params] as const,
  details: () => [...partKeys.all, "detail"] as const,
  detail: (id: string) => [...partKeys.details(), id] as const,
  summary: () => [...partKeys.all, "summary"] as const,
  transactions: (id: string) => [...partKeys.all, "transactions", id] as const,
};

export const useParts = (params: PartListParams = {}) => {
  return useQuery({
    queryKey: partKeys.list(params),
    queryFn: () => getParts(params),
  });
};

export const usePart = (partId: string | null) => {
  return useQuery({
    queryKey: partId ? partKeys.detail(partId) : partKeys.details(),
    queryFn: () => getPartById(partId as string),
    enabled: Boolean(partId),
  });
};

export const useInventorySummary = () => {
  return useQuery({
    queryKey: partKeys.summary(),
    queryFn: getInventorySummary,
  });
};

export const usePartTransactions = (partId: string | null) => {
  return useQuery({
    queryKey: partId ? partKeys.transactions(partId) : partKeys.all,
    queryFn: () => getPartTransactions(partId as string),
    enabled: Boolean(partId),
  });
};

export const useCreatePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePartInput) => createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: partKeys.all });
      toast.success("Part created successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create part"));
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartInput }) =>
      updatePart(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: partKeys.all });
      queryClient.invalidateQueries({ queryKey: partKeys.detail(variables.id) });
      toast.success("Part updated successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update part"));
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustStockInput }) =>
      adjustPartStock(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: partKeys.all });
      queryClient.invalidateQueries({ queryKey: partKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: partKeys.transactions(variables.id),
      });
      toast.success("Stock adjusted successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to adjust stock"));
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: partKeys.all });
      toast.success("Part deleted successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete part"));
    },
  });
};
