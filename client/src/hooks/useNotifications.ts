import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Socket } from "socket.io-client";

import { useNotificationStore } from "../stores/notificationStore";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import type { Notification } from "../types/notification";

/**
 * Hydrates the notification store from the REST API on mount and wires up
 * Socket.IO real-time events. Must be called once inside DashboardLayout
 * alongside useSocket().
 */
export function useNotifications(socket: Socket | null) {
  const { setNotifications, addNotification, markRead, markAllRead } =
    useNotificationStore();

  // ── Initial REST fetch ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

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
      .catch(() => {
        // Silently ignore; notifications are non-critical
      });

    return () => {
      cancelled = true;
    };
  }, [setNotifications]);

  // ── Real-time Socket.IO listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification: Notification) => {
      addNotification(notification);

      // Show a toast based on type
      const icons: Record<string, string> = {
        JOB_ASSIGNED: "🔧",
        JOB_COMPLETED: "✅",
        LOW_STOCK: "📦",
        PAYMENT_RECEIVED: "💳",
        JOB_STATUS_CHANGED: "🔄",
        GENERAL: "🔔",
      };

      const icon = icons[notification.type] ?? "🔔";

      toast(
        (t) =>
          React.createElement(
            "div",
            {
              onClick: () => toast.dismiss(t.id),
              className: "cursor-pointer",
            },
            React.createElement(
              "p",
              { className: "font-semibold text-gray-900 text-sm" },
              `${icon} ${notification.title}`,
            ),
            React.createElement(
              "p",
              { className: "text-xs text-gray-500 mt-0.5" },
              notification.message,
            ),
          ),
        {
          duration: 5000,
          style: { maxWidth: "340px" },
        },
      );
    };

    const handleLowStock = (notification: Notification) => {
      // inventory:low is already a Notification object from the server
      addNotification(notification);
      toast.error(`Low stock: ${notification.message}`, { duration: 6000 });
    };

    socket.on("notification:new", handleNew);
    socket.on("inventory:low", handleLowStock);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("inventory:low", handleLowStock);
    };
  }, [socket, addNotification]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: (id) => markRead(id), // optimistic
    onError: () => toast.error("Failed to mark notification as read"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: () => markAllRead(), // optimistic
    onError: () => toast.error("Failed to mark all as read"),
  });

  return {
    markAsRead: (id: string) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
    isMarkingAll: markAllReadMutation.isPending,
  };
}
