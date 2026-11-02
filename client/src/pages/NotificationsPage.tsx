/* eslint-disable react-hooks/set-state-in-effect -- Loading state is synchronized with the initial page fetch. */
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  CreditCard,
  PackageX,
  Wrench,
  Loader2,
} from "lucide-react";
import { useNotificationStore } from "../stores/notificationStore";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import type { Notification, NotificationType } from "../types/notification";
import { formatNotificationMessage } from "../utils/notificationMessage";

// ── Helpers ────────────────────────────────────────────────────────────────

type FilterType = "all" | "unread" | NotificationType;

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "JOB_ASSIGNED", label: "Job Assigned" },
  { key: "JOB_COMPLETED", label: "Job Completed" },
  { key: "LOW_STOCK", label: "Low Stock" },
  { key: "PAYMENT_RECEIVED", label: "Payments" },
];

function typeIcon(type: NotificationType) {
  switch (type) {
    case "JOB_ASSIGNED":
      return <Wrench size={18} className="text-indigo-500" />;
    case "JOB_COMPLETED":
      return <ClipboardList size={18} className="text-emerald-500" />;
    case "JOB_STATUS_CHANGED":
      return <ClipboardList size={18} className="text-violet-500" />;
    case "LOW_STOCK":
      return <PackageX size={18} className="text-amber-500" />;
    case "PAYMENT_RECEIVED":
      return <CreditCard size={18} className="text-emerald-500" />;
    default:
      return <Bell size={18} className="text-slate-400" />;
  }
}

function typeIconBg(type: NotificationType): string {
  switch (type) {
    case "JOB_ASSIGNED":
      return "bg-indigo-50 dark:bg-indigo-500/15";
    case "JOB_COMPLETED":
    case "JOB_STATUS_CHANGED":
      return "bg-emerald-50 dark:bg-emerald-500/15";
    case "LOW_STOCK":
      return "bg-amber-50 dark:bg-amber-500/15";
    case "PAYMENT_RECEIVED":
      return "bg-emerald-50 dark:bg-emerald-500/15";
    default:
      return "bg-slate-100 dark:bg-slate-800";
  }
}

function typeLabel(type: NotificationType): { label: string; cls: string } {
  switch (type) {
    case "JOB_ASSIGNED":
      return { label: "Job Assigned", cls: "bg-indigo-50 text-indigo-700 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:ring-indigo-500/30" };
    case "JOB_COMPLETED":
      return { label: "Job Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30" };
    case "JOB_STATUS_CHANGED":
      return { label: "Status Changed", cls: "bg-violet-50 text-violet-700 ring-violet-500/20 dark:bg-violet-500/15 dark:text-violet-400 dark:ring-violet-500/30" };
    case "LOW_STOCK":
      return { label: "Low Stock", cls: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/30" };
    case "PAYMENT_RECEIVED":
      return { label: "Payment", cls: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30" };
    default:
      return { label: type.replace(/_/g, " "), cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700" };
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main component ─────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    hasMore,
    markRead,
    markAllRead,
    setNotifications,
    appendNotifications,
    incrementPage,
    currentPage,
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(notifications.length === 0);

  // Re-fetch on page visit so direct navigation always shows notifications
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getNotifications(1, 30)
      .then((data) => {
        if (!cancelled) {
          setNotifications(
            data.notifications,
            data.unreadCount,
            data.pagination.page < data.pagination.totalPages,
          );
        }
      })
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: (id) => markRead(id),
    onError: () => toast.error("Failed to mark as read"),
  });

  // Mark all as read
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: () => markAllRead(),
    onError: () => toast.error("Failed to mark all as read"),
  });

  // Load more (pagination)
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await getNotifications(nextPage, 20);
      appendNotifications(
        data.notifications,
        nextPage < data.pagination.totalPages,
      );
      incrementPage();
    } catch {
      toast.error("Failed to load more notifications");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.read;
    return n.type === activeFilter;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Loading notifications…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Notifications
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "unread"
              ? unreadCount
              : tab.key !== "all"
              ? notifications.filter((n) => n.type === tab.key).length
              : notifications.length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                activeFilter === tab.key
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold ${
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/60">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Bell size={26} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {activeFilter === "unread"
                  ? "No unread notifications"
                  : "No notifications here"}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {activeFilter === "unread"
                  ? "You're all caught up!"
                  : "Try a different filter"}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((notification: Notification) => {
              const badge = typeLabel(notification.type);
              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!notification.read) markReadMutation.mutate(notification.id);
                    const path = notification.type === "LOW_STOCK" ? "/inventory"
                      : notification.type === "PAYMENT_RECEIVED" ? "/invoices"
                      : notification.type.startsWith("JOB_") ? (user?.role === "MECHANIC" ? "/my-jobs" : "/jobs") : null;
                    if (path) navigate(path);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!notification.read) markReadMutation.mutate(notification.id);
                      const path = notification.type === "LOW_STOCK" ? "/inventory"
                        : notification.type === "PAYMENT_RECEIVED" ? "/invoices"
                        : notification.type.startsWith("JOB_") ? (user?.role === "MECHANIC" ? "/my-jobs" : "/jobs") : null;
                      if (path) navigate(path);
                    }
                  }}
                  className={`flex items-start gap-4 px-5 py-4 transition cursor-pointer ${
                    !notification.read
                      ? "bg-indigo-50/30 hover:bg-indigo-50/60 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeIconBg(notification.type)}`}
                  >
                    {typeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          notification.read
                            ? "font-normal text-slate-700 dark:text-slate-300"
                            : "font-semibold text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {relativeTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatNotificationMessage(notification.message)}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && activeFilter === "all" && (
          <div className="border-t border-slate-100 px-5 py-3 text-center dark:border-slate-800">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="cursor-pointer text-xs font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
            >
              {isLoadingMore ? "Loading…" : "Load more notifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
