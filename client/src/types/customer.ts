export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vehicles: number;
  };
}

export interface CustomerVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  vehicles: CustomerVehicle[];
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerListResponse {
  success: boolean;
  data: {
    customers: Customer[];
    pagination: CustomerPagination;
  };
}

export interface CustomerResponse {
  success: boolean;
  data: {
    customer: CustomerDetails;
  };
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
