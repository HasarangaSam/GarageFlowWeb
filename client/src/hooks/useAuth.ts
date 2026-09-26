import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);

  const accessToken = useAuthStore((state) => state.accessToken);

  const isAuthenticated = Boolean(user && accessToken);

  return {
    user,
    accessToken,
    isAuthenticated,
  };
};
