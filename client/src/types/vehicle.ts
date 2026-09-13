export interface VehicleCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  createdAt: string;
  updatedAt: string;
  customer: VehicleCustomer;
  _count?: {
    jobs: number;
  };
}

export interface VehicleJob {
  id: string;
  jobNumber: string;
  complaint: string;
  diagnosis: string | null;
  status: string;
  priority: string;
  mileageIn: number | null;
  mileageOut: number | null;
  createdAt: string;
  updatedAt: string;
  mechanic: {
    id: string;
    name: string;
  } | null;
}

export interface VehicleDetails extends Vehicle {
  customer: VehicleCustomer;
  jobs: VehicleJob[];
}

export interface VehicleListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface VehiclePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VehicleListResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    pagination: VehiclePagination;
  };
}

export interface VehicleResponse {
  success: boolean;
  data: {
    vehicle: VehicleDetails;
  };
}

export interface CreateVehicleInput {
  customerId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  mileage?: number;
}

export interface UpdateVehicleInput {
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
}
