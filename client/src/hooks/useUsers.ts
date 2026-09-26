import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaffUser,
  deleteStaffUser,
  getMechanics,
  getUsers,
  updateStaffUser,
} from "../services/userService";
import type { StaffAccountInput, UserRole } from "../types/user";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: { role?: UserRole; search?: string }) =>
    [...userKeys.lists(), params] as const,
  mechanics: () => [...userKeys.all, "mechanics"] as const,
};

export const useUsers = (params: { role?: UserRole; search?: string } = {}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
  });
};

export const useMechanics = (search?: string, enabled = true) => {
  return useQuery({
    queryKey: userKeys.mechanics(),
    queryFn: () => getMechanics(search),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — mechanics list changes infrequently
  });
};

export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useUpdateStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: StaffAccountInput;
    }) => updateStaffUser(userId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useDeleteStaffUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStaffUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};
