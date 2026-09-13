import { api } from "./api";
import type {
  Mechanic,
  MechanicsResponse,
  StaffUser,
  StaffAccountInput,
  UsersResponse,
  UserRole,
} from "../types/user";

export const getUsers = async (params: {
  role?: UserRole;
  search?: string;
} = {}): Promise<StaffUser[]> => {
  const response = await api.get<UsersResponse>("/users", { params });
  return response.data.data.users;
};

export const getMechanics = async (search?: string): Promise<Mechanic[]> => {
  const response = await api.get<MechanicsResponse>("/users/mechanics", {
    params: search ? { search } : undefined,
  });
  return response.data.data.mechanics;
};

export const createStaffUser = async (
  data: StaffAccountInput,
): Promise<StaffUser> => {
  const response = await api.post<{ data: { user: StaffUser } }>("/users", data);
  return response.data.data.user;
};

export const updateStaffUser = async (
  userId: string,
  data: StaffAccountInput,
): Promise<StaffUser> => {
  const { password, ...staffData } = data;
  const response = await api.patch<{ data: { user: StaffUser } }>(`/users/${userId}`, {
    ...staffData,
    ...(password ? { password } : {}),
  });
  return response.data.data.user;
};

export const deleteStaffUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};
