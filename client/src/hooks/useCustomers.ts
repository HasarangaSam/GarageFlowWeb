import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../services/customerService";

import type {
  CreateCustomerInput,
  CustomerListParams,
  UpdateCustomerInput,
} from "../types/customer";

export const customerKeys = {
  all: ["customers"] as const,

  lists: () => [...customerKeys.all, "list"] as const,

  list: (params: CustomerListParams) =>
    [...customerKeys.lists(), params] as const,

  details: () => [...customerKeys.all, "detail"] as const,

  detail: (customerId: string) =>
    [...customerKeys.details(), customerId] as const,
};

export const useCustomers = (params: CustomerListParams = {}) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
  });
};

export const useCustomer = (customerId: string | null) => {
  return useQuery({
    queryKey: customerKeys.detail(customerId ?? ""),
    queryFn: () => getCustomerById(customerId!),
    enabled: Boolean(customerId),
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => createCustomer(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: UpdateCustomerInput;
    }) => updateCustomer(customerId, data),

    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
      });

      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),

    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
      });

      queryClient.removeQueries({
        queryKey: customerKeys.detail(customerId),
      });
    },
  });
};
