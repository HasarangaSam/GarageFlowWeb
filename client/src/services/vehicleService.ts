import { api } from "./api";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  Vehicle,
  VehicleDetails,
  VehicleListParams,
  VehicleListResponse,
  VehiclePagination,
  VehicleResponse,
} from "../types/vehicle";

export const getVehicles = async (
  params: VehicleListParams = {},
): Promise<{
  vehicles: Vehicle[];
  pagination: VehiclePagination;
}> => {
  const response = await api.get<VehicleListResponse>("/vehicles", {
    params,
  });

  return response.data.data;
};

export const getVehicleById = async (
  vehicleId: string,
): Promise<VehicleDetails> => {
  const response = await api.get<VehicleResponse>(`/vehicles/${vehicleId}`);

  return response.data.data.vehicle;
};

export const createVehicle = async (
  data: CreateVehicleInput,
): Promise<VehicleDetails> => {
  const response = await api.post<VehicleResponse>("/vehicles", data);

  return response.data.data.vehicle;
};

export const updateVehicle = async (
  vehicleId: string,
  data: UpdateVehicleInput,
): Promise<VehicleDetails> => {
  const response = await api.patch<VehicleResponse>(
    `/vehicles/${vehicleId}`,
    data,
  );

  return response.data.data.vehicle;
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  await api.delete(`/vehicles/${vehicleId}`);
};
