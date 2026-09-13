import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);

  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const isAuthenticated = Boolean(user && accessToken);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
  };
};
