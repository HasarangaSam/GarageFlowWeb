import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  CreditCard,
  PackageX,
  Wrench,
  X,
} from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";
import type { Notification, NotificationType } from "../../types/notification";
import { formatNotificationMessage } from "../../utils/notificationMessage";

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function typeIcon(type: NotificationType) {
  switch (type) {
    case "JOB_ASSIGNED":
      return <Wrench size={15} className="text-blue-500 dark:text-blue-400" />;
    case "JOB_COMPLETED":
      return <ClipboardList size={15} className="text-emerald-500 dark:text-emerald-400" />;
    case "JOB_STATUS_CHANGED":
      return <ClipboardList size={15} className="text-purple-500 dark:text-purple-400" />;
    case "LOW_STOCK":
      return <PackageX size={15} className="text-amber-500 dark:text-amber-400" />;
    case "PAYMENT_RECEIVED":
      return <CreditCard size={15} className="text-emerald-500 dark:text-emerald-400" />;
    default:
      return <Bell size={15} className="text-slate-400 dark:text-slate-500" />;
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
  return `${days}d ago`;
}

// ── Sub-component: single notification row ─────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
        !notification.read
          ? "bg-indigo-50/40 dark:bg-indigo-500/10"
          : ""
      }`}
    >
      {/* Unread dot + icon */}
      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            notification.read ? "bg-transparent" : "bg-indigo-600 dark:bg-indigo-400"
          }`}
        />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          {typeIcon(notification.type)}
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.read
              ? "font-normal text-slate-700 dark:text-slate-300"
              : "font-semibold text-slate-900 dark:text-slate-100"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {formatNotificationMessage(notification.message)}
        </p>
        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function NotificationDropdown({
  onClose,
  onMarkRead,
  onMarkAllRead,
  isMarkingAll,
}: NotificationDropdownProps) {
  const { notifications, unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const recent = notifications.slice(0, 10);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/70 ring-1 ring-black/5 dark:ring-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={isMarkingAll}
              title="Mark all as read"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/15 disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCheck size={13} />
              All read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Bell size={22} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No notifications yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                You're all caught up!
              </p>
            </div>
          </div>
        ) : (
          recent.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
        <button
          type="button"
          onClick={() => {
            navigate("/notifications");
            onClose();
          }}
          className="w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition cursor-pointer"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
}
