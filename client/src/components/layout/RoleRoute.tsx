import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

interface RoleRouteProps {
  allowedRoles: string[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === "MECHANIC" ? "/my-jobs" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
