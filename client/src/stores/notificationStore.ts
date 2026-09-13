import { create } from "zustand";
import type { Notification } from "../types/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;

  // Hydrate from the initial REST fetch
  setNotifications: (
    notifications: Notification[],
    unreadCount: number,
    hasMore: boolean,
  ) => void;

  // Append next page (infinite scroll / "load more")
  appendNotifications: (
    notifications: Notification[],
    hasMore: boolean,
  ) => void;

  // Called when a real-time notification arrives via Socket.IO
  addNotification: (notification: Notification) => void;

  // Mark one as read locally (optimistic)
  markRead: (id: string) => void;

  // Mark all as read locally (optimistic)
  markAllRead: () => void;

  incrementPage: () => void;
  resetPagination: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  currentPage: 1,

  setNotifications: (notifications, unreadCount, hasMore) =>
    set({ notifications, unreadCount, hasMore, currentPage: 1 }),

  appendNotifications: (newNotifications, hasMore) =>
    set((state) => ({
      notifications: [...state.notifications, ...newNotifications],
      hasMore,
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  incrementPage: () =>
    set((state) => ({ currentPage: state.currentPage + 1 })),

  resetPagination: () => set({ currentPage: 1 }),
}));
