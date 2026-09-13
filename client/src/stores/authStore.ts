import { create } from "zustand";

import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken?: string | null,
  ) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) =>
    set((state) => ({
      user,
      accessToken,
      refreshToken:
        refreshToken !== undefined ? refreshToken : state.refreshToken,
    })),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
    }),

  setRefreshToken: (refreshToken) =>
    set({
      refreshToken,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
    }),
}));
