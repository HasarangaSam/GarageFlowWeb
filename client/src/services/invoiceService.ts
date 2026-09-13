import { api } from "./api";
import type {
  CreateInvoiceInput,
  CreatePaymentInput,
  Invoice,
  InvoiceListParams,
  InvoicePagination,
  InvoiceSummary,
  Payment,
  UpdateInvoiceInput,
} from "../types/invoice";

export const getInvoices = async (
  params: InvoiceListParams = {},
): Promise<{
  invoices: Invoice[];
  pagination: InvoicePagination;
}> => {
  const response = await api.get("/invoices", { params });
  if (response.data.data?.invoices) {
    return response.data.data;
  }
  return {
    invoices: response.data.invoices || [],
    pagination: response.data.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
};

export const getInvoiceSummary = async (): Promise<InvoiceSummary> => {
  const response = await api.get("/invoices/summary");
  return response.data.data?.summary ?? response.data.summary;
};

export const getInvoiceById = async (invoiceId: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${invoiceId}`);
  return response.data.data?.invoice ?? response.data.invoice;
};

export const createInvoice = async (
  input: CreateInvoiceInput,
): Promise<Invoice> => {
  const response = await api.post("/invoices", input);
  return response.data.data?.invoice ?? response.data.invoice;
};

export const updateInvoice = async (
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<Invoice> => {
  const response = await api.patch(`/invoices/${invoiceId}`, input);
  return response.data.data?.invoice ?? response.data.invoice;
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  await api.delete(`/invoices/${invoiceId}`);
};

export const recordPayment = async (
  invoiceId: string,
  input: CreatePaymentInput,
): Promise<{
  payment: Payment;
  paidAmount: number;
  remainingBalance: number;
  status: string;
}> => {
  const response = await api.post(`/invoices/${invoiceId}/payments`, input);
  return response.data.data ?? response.data;
};

export const deletePayment = async (
  invoiceId: string,
  paymentId: string,
): Promise<void> => {
  await api.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
};

export const getInvoicePayments = async (
  invoiceId: string,
): Promise<{
  payments: Payment[];
  summary: {
    invoiceTotal: number;
    paidAmount: number;
    remainingBalance: number;
    status: string;
  };
}> => {
  const response = await api.get(`/invoices/${invoiceId}/payments`);
  return response.data.data ?? response.data;
};
