import {
  Bell,
  Bot,
  Car,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Users,
  UserRoundCog,
  Wrench,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";
import { logoutUser } from "../services/authService";
import { useSocket } from "../hooks/useSocket";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationStore } from "../stores/notificationStore";
import { useUIStore } from "../stores/uiStore";
import NotificationDropdown from "../components/layout/NotificationDropdown";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Gauge,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "My Jobs",
    path: "/my-jobs",
    icon: Wrench,
    roles: ["MECHANIC"],
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "Vehicles",
    path: "/vehicles",
    icon: Car,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "Jobs",
    path: "/jobs",
    icon: ClipboardList,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "Invoices",
    path: "/invoices",
    icon: FileText,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "AI Assistant",
    path: "/ai",
    icon: Bot,
    roles: ["OWNER", "MANAGER"],
  },
  {
    label: "Staff",
    path: "/staff",
    icon: UserRoundCog,
    roles: ["OWNER"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
    roles: ["OWNER", "MANAGER", "MECHANIC"],
  },
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const notificationPanelOpen = useUIStore(
    (state) => state.notificationPanelOpen,
  );
  const setNotificationPanelOpen = useUIStore(
    (state) => state.setNotificationPanelOpen,
  );
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  // Socket.IO connection + notification listeners
  const socket = useSocket();
  const { markAsRead, markAllAsRead, isMarkingAll } = useNotifications(socket);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleDashboardUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    socket.on("dashboard:updated", handleDashboardUpdated);

    return () => {
      socket.off("dashboard:updated", handleDashboardUpdated);
    };
  }, [queryClient, socket]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local authentication even if the server request fails.
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
      toast.success("Logged out successfully");
    }
  };

  const visibleNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GF";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Modern Minimal Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Wrench size={18} className="rotate-45" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                GarageFlow
              </span>
              <p className="text-[11px] font-medium text-slate-500">
                Automotive Suite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex h-[calc(100%-4rem)] flex-col justify-between overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </div>
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const isNotif = item.path === "/notifications";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600" />
                      )}
                      <div className="relative">
                        <Icon
                          size={18}
                          className={`transition-colors ${
                            isActive
                              ? "text-indigo-600"
                              : "text-slate-600 group-hover:text-slate-700"
                          }`}
                        />
                        {isNotif && unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>

                      <span className="flex-1 truncate">{item.label}</span>

                      {isNotif && unreadCount > 0 && (
                        <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Sign Out Footer */}
          <div className="mt-6 border-t border-slate-200/80 pt-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {user?.name ?? "User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    {user?.role ?? "MEMBER"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut
                size={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
              <span className="font-semibold text-slate-700">GarageFlow</span>
              <span>/</span>
              <span className="font-medium text-slate-600">Overview</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-600 sm:block">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).format(new Date())}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Bell icon with badge */}
            <div className="relative">
              <button
                type="button"
                id="notification-bell"
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Open notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationPanelOpen && (
                <NotificationDropdown
                  onClose={() => setNotificationPanelOpen(false)}
                  onMarkRead={(id) => {
                    markAsRead(id);
                  }}
                  onMarkAllRead={() => {
                    markAllAsRead();
                  }}
                  isMarkingAll={isMarkingAll}
                />
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
