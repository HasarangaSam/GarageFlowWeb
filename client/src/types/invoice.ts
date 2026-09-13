export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID";

export type InvoiceItemType = "PART" | "LABOUR";

export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  partId?: string | null;
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number | string;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  vehicleId: string;
  repairJobId: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    year?: number;
  };
  job?: {
    id: string;
    jobNumber: string;
    status: string;
    mechanic?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  draftCount: number;
  issuedCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  voidCount: number;
}

export interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface InvoicesResponse {
  success?: boolean;
  invoices: Invoice[];
  pagination: InvoicePagination;
}

export interface CreateInvoiceLabourItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  repairJobId: string;
  labourItems: CreateInvoiceLabourItem[];
  discount: number;
  tax: number;
  dueDate?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  discount?: number;
  tax?: number;
  dueDate?: string;
}

export interface CreatePaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
}
