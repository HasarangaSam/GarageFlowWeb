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
      return <Wrench size={15} className="text-blue-500" />;
    case "JOB_COMPLETED":
      return <ClipboardList size={15} className="text-emerald-500" />;
    case "JOB_STATUS_CHANGED":
      return <ClipboardList size={15} className="text-purple-500" />;
    case "LOW_STOCK":
      return <PackageX size={15} className="text-amber-500" />;
    case "PAYMENT_RECEIVED":
      return <CreditCard size={15} className="text-green-500" />;
    default:
      return <Bell size={15} className="text-gray-400" />;
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
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 ${
        !notification.read ? "bg-blue-50/50" : ""
      }`}
    >
      {/* Unread dot + icon */}
      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            notification.read ? "bg-transparent" : "bg-blue-500"
          }`}
        />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
          {typeIcon(notification.type)}
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.read
              ? "font-normal text-gray-700"
              : "font-semibold text-gray-900"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {formatNotificationMessage(notification.message)}
        </p>
        <p className="mt-1 text-[10px] text-gray-400">
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
      className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
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
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
            >
              <CheckCheck size={13} />
              All read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Bell size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                No notifications yet
              </p>
              <p className="text-xs text-gray-400">
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
      <div className="border-t px-4 py-2.5">
        <button
          type="button"
          onClick={() => {
            navigate("/notifications");
            onClose();
          }}
          className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
}
