import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
} from "../services/vehicleService";

import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleListParams,
} from "../types/vehicle";

export const vehicleKeys = {
  all: ["vehicles"] as const,

  lists: () => [...vehicleKeys.all, "list"] as const,

  list: (params: VehicleListParams) =>
    [...vehicleKeys.lists(), params] as const,

  details: () => [...vehicleKeys.all, "detail"] as const,

  detail: (vehicleId: string) => [...vehicleKeys.details(), vehicleId] as const,
};

export const useVehicles = (params: VehicleListParams = {}) => {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => getVehicles(params),
  });
};

export const useVehicle = (vehicleId: string | null) => {
  return useQuery({
    queryKey: vehicleId ? vehicleKeys.detail(vehicleId) : vehicleKeys.details(),
    queryFn: () => getVehicleById(vehicleId as string),
    enabled: Boolean(vehicleId),
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleInput) => createVehicle(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.lists(),
      });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vehicleId,
      data,
    }: {
      vehicleId: string;
      data: UpdateVehicleInput;
    }) => updateVehicle(vehicleId, data),

    onSuccess: (updatedVehicle) => {
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.lists(),
      });

      queryClient.setQueryData(
        vehicleKeys.detail(updatedVehicle.id),
        updatedVehicle,
      );
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(vehicleId),

    onSuccess: (_, vehicleId) => {
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.lists(),
      });

      queryClient.removeQueries({
        queryKey: vehicleKeys.detail(vehicleId),
      });
    },
  });
};
