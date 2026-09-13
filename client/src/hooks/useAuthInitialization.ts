import { useEffect, useState } from "react";

import { refreshAccessToken } from "../services/authService";

import { useAuthStore } from "../stores/authStore";

export const useAuthInitialization = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        const data = await refreshAccessToken(currentRefreshToken);

        setAuth(data.user, data.accessToken, data.refreshToken);
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [setAuth]);

  return {
    isInitializing,
  };
};
