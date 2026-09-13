export type JobStatus =
  | "RECEIVED"
  | "IN_PROGRESS"
  | "WAITING_FOR_PARTS"
  | "COMPLETED"
  | "READY_FOR_PICKUP"
  | "DELIVERED";

export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";

export interface DashboardSummary {
  activeJobs: number;
  completedToday: number;
  todayRevenue: number;
  outstandingPayments: number;
  lowStockParts: number;
}

export interface LowStockPart {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minimumStock: number;
  sellingPrice: number;
}

export interface RecentJob {
  id: string;
  jobNumber: string;
  complaint: string;
  status: JobStatus;
  priority: JobPriority;
  updatedAt: string;

  customer: {
    firstName: string;
    lastName: string;
  };

  vehicle: {
    registrationNumber: string;
    make: string;
    model: string;
  };

  mechanic: {
    id: string;
    name: string;
  } | null;
}

export interface RecentPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;

  invoice: {
    invoiceNumber: string;

    customer: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface MechanicWorkload {
  mechanicId: string;
  mechanicName: string;
  total: number;
  received: number;
  inProgress: number;
  waitingForParts: number;
}

export interface JobStatusCounts {
  received: number;
  inProgress: number;
  waitingForParts: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  lowStockParts: LowStockPart[];
  recentJobs: RecentJob[];
  jobStatusCounts: JobStatusCounts;
  recentPayments: RecentPayment[];
  mechanicWorkload: MechanicWorkload[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}
