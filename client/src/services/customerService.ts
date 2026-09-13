import { api } from "./api";

import type {
  CreateCustomerInput,
  CustomerDetails,
  CustomerListParams,
  CustomerListResponse,
  CustomerPagination,
  CustomerResponse,
  Customer,
  UpdateCustomerInput,
} from "../types/customer";

export const getCustomers = async (
  params: CustomerListParams = {},
): Promise<{
  customers: Customer[];
  pagination: CustomerPagination;
}> => {
  const response = await api.get<CustomerListResponse>("/customers", {
    params,
  });

  return response.data.data;
};

export const getCustomerById = async (
  customerId: string,
): Promise<CustomerDetails> => {
  const response = await api.get<CustomerResponse>(`/customers/${customerId}`);

  return response.data.data.customer;
};

export const createCustomer = async (
  data: CreateCustomerInput,
): Promise<CustomerDetails> => {
  const response = await api.post<CustomerResponse>("/customers", data);

  return response.data.data.customer;
};

export const updateCustomer = async (
  customerId: string,
  data: UpdateCustomerInput,
): Promise<CustomerDetails> => {
  const response = await api.patch<CustomerResponse>(
    `/customers/${customerId}`,
    data,
  );

  return response.data.data.customer;
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  await api.delete(`/customers/${customerId}`);
};
