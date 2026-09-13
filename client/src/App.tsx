import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AIPage from "./pages/AIPage";
import CustomersPage from "./pages/CustomersPage";
import VehiclesPage from "./pages/VehiclesPage";
import JobsPage from "./pages/JobsPage";
import InventoryPage from "./pages/InventoryPage";
import InvoicesPage from "./pages/InvoicesPage";
import NotificationsPage from "./pages/NotificationsPage";
import StaffPage from "./pages/StaffPage";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleRoute from "./components/layout/RoleRoute";

import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "./hooks/useAuth";

function DefaultRedirect() {
  const { user } = useAuth();
  if (user?.role === "MECHANIC") {
    return <Navigate to="/my-jobs" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route element={<RoleRoute allowedRoles={["OWNER", "MANAGER"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* AI Assistant */}
          <Route element={<RoleRoute allowedRoles={["OWNER", "MANAGER"]} />}>
            <Route path="/ai" element={<AIPage />} />
          </Route>

          {/* Mechanic */}
          <Route element={<RoleRoute allowedRoles={["MECHANIC"]} />}>
            <Route path="/my-jobs" element={<JobsPage isMyJobs />} />
          </Route>

          {/* All authenticated users */}
          <Route
            element={
              <RoleRoute allowedRoles={["OWNER", "MANAGER", "MECHANIC"]} />
            }
          >
            <Route path="/customers" element={<CustomersPage />} />

            <Route path="/vehicles" element={<VehiclesPage />} />

            <Route path="/inventory" element={<InventoryPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Owner and Manager */}
          <Route element={<RoleRoute allowedRoles={["OWNER", "MANAGER"]} />}>
            <Route path="/jobs" element={<JobsPage />} />

            <Route path="/invoices" element={<InvoicesPage />} />
          </Route>

          {/* Owner only */}
          <Route element={<RoleRoute allowedRoles={["OWNER"]} />}>
            <Route path="/staff" element={<StaffPage />} />
          </Route>
        </Route>
      </Route>

      {/* Default route */}
      <Route path="/" element={<DefaultRedirect />} />

      {/* Unknown route */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
