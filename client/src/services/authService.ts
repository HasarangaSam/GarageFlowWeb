import { api } from "./api";

import type { AuthResponse, User } from "../types/auth";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterInput) => {
  const response = await api.post<{
    success: boolean;
    data: {
      user: User;
    };
  }>("/auth/register", data);

  return response.data.data.user;
};

export const loginUser = async (data: LoginInput) => {
  const response = await api.post<{
    success: boolean;
    data: AuthResponse;
  }>("/auth/login", data);

  return response.data.data;
};

export const refreshAccessToken = async () => {
  const response = await api.post<{
    success: boolean;
    data: AuthResponse;
  }>("/auth/refresh");

  return response.data.data;
};

export const logoutUser = async () => {
  await api.post("/auth/logout");
};

export const getCurrentUser = async () => {
  const response = await api.get<{
    success: boolean;
    data: {
      user: User;
    };
  }>("/auth/me");

  return response.data.data.user;
};
