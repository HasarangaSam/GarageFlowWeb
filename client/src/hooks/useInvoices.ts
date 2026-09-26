import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createInvoice,
  deleteInvoice,
  deletePayment,
  getInvoiceById,
  getInvoicePayments,
  getInvoices,
  getInvoiceSummary,
  recordPayment,
  updateInvoice,
} from "../services/invoiceService";
import type {
  CreateInvoiceInput,
  CreatePaymentInput,
  InvoiceListParams,
  UpdateInvoiceInput,
} from "../types/invoice";
import { jobKeys } from "./useJobs";
import { getErrorMessage } from "../utils/errorMessage";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params: InvoiceListParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, "summary"] as const,
  payments: (id: string) => [...invoiceKeys.all, "payments", id] as const,
};

export const useInvoices = (params: InvoiceListParams = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoices(params),
  });
};

export const useInvoice = (invoiceId: string | null) => {
  return useQuery({
    queryKey: invoiceId ? invoiceKeys.detail(invoiceId) : invoiceKeys.details(),
    queryFn: () => getInvoiceById(invoiceId as string),
    enabled: Boolean(invoiceId),
  });
};

export const useInvoiceSummary = () => {
  return useQuery({
    queryKey: invoiceKeys.summary(),
    queryFn: getInvoiceSummary,
  });
};

export const useInvoicePayments = (invoiceId: string | null) => {
  return useQuery({
    queryKey: invoiceId
      ? invoiceKeys.payments(invoiceId)
      : [...invoiceKeys.all, "payments"],
    queryFn: () => getInvoicePayments(invoiceId as string),
    enabled: Boolean(invoiceId),
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success(`Invoice ${invoice.invoiceNumber} created`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to create invoice"));
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      updateInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Invoice updated successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update invoice"));
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete invoice"));
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: CreatePaymentInput;
    }) => recordPayment(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.payments(variables.invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Payment recorded successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to record payment"));
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
    }: {
      invoiceId: string;
      paymentId: string;
    }) => deletePayment(invoiceId, paymentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.payments(variables.invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Payment removed successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to remove payment"));
    },
  });
};
