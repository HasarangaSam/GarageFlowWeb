import { api } from "./api";
import { useAuthStore } from "../stores/authStore";
import { refreshAccessToken } from "./authService";

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        const currentRefreshToken = useAuthStore.getState().refreshToken;

        refreshPromise = refreshAccessToken(currentRefreshToken)
          .then((data) => {
            useAuthStore
              .getState()
              .setAuth(data.user, data.accessToken, data.refreshToken);

            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();

      return Promise.reject(refreshError);
    }
  },
);
