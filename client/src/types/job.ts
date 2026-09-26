export type JobStatus =
  | "RECEIVED"
  | "IN_PROGRESS"
  | "WAITING_FOR_PARTS"
  | "COMPLETED"
  | "READY_FOR_PICKUP"
  | "DELIVERED";

export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface JobCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface JobVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

export interface JobMechanic {
  id: string;
  name: string;
  email: string;
  role?: "MECHANIC";
}

export interface JobPart {
  id: string;
  jobId: string;
  partId: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
  createdAt: string;
  part: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    quantity: number;
    minimumStock: number;
    costPrice: number | string;
    sellingPrice: number | string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface JobInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
  type: string;
}

export interface JobPayment {
  id: string;
  invoiceId: string;
  amount: number | string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface JobInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  items: JobInvoiceItem[];
  payments: JobPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface RepairJob {
  id: string;
  jobNumber: string;
  customerId: string;
  vehicleId: string;
  mechanicId: string | null;
  complaint: string;
  diagnosis: string | null;
  status: JobStatus;
  priority: JobPriority;
  mileageIn: number | null;
  mileageOut: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  customer: JobCustomer;
  vehicle: JobVehicle;
  mechanic: JobMechanic | null;

  _count?: {
    parts: number;
  };
}

export interface RepairJobDetails extends RepairJob {
  customer: JobCustomer & {
    email: string | null;
    address: string | null;
    notes: string | null;
  };

  vehicle: JobVehicle & {
    year: number | null;
    mileage: number | null;
  };

  parts: JobPart[];

  invoice?: JobInvoice | null;
}

export interface JobListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus | string;
  priority?: JobPriority;
  mechanicId?: string;
  hasInvoice?: boolean;
}

export interface JobPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobListResponse {
  success: boolean;
  data: {
    jobs: RepairJob[];
    pagination: JobPagination;
  };
}

export interface JobResponse {
  success: boolean;
  data: {
    job: RepairJobDetails;
  };
}

export interface MyJobsResponse {
  success: boolean;
  data: {
    jobs: RepairJob[];
    pagination: JobPagination;
  };
}

export interface CreateRepairJobInput {
  customerId: string;
  vehicleId: string;
  mechanicId?: string;
  complaint: string;
  diagnosis?: string;
  status?: JobStatus;
  priority?: JobPriority;
  mileageIn?: number;
  mileageOut?: number;
  notes?: string;
}

export interface UpdateRepairJobInput {
  mechanicId?: string;
  complaint?: string;
  diagnosis?: string;
  status?: JobStatus;
  priority?: JobPriority;
  mileageIn?: number;
  mileageOut?: number;
  notes?: string;
}

export interface MechanicUpdateRepairJobInput {
  diagnosis?: string;
  status?: JobStatus;
  mileageOut?: number;
  notes?: string;
}

export interface AddJobPartInput {
  partId: string;
  quantity: number;
}

export interface AddJobPartsInput {
  parts: AddJobPartInput[];
}

export interface JobPartsResponse {
  success: boolean;
  data: {
    parts: JobPart[];
  };
}

export interface JobPartResponse {
  success: boolean;
  data: {
    jobPart: JobPart;
  };
}
