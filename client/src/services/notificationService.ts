import { api } from "./api";
import type { Notification, NotificationListResponse } from "../types/notification";

export const getNotifications = async (
  page = 1,
  limit = 20,
): Promise<NotificationListResponse> => {
  const response = await api.get("/notifications", { params: { page, limit } });
  return response.data.data ?? response.data;
};

export const markNotificationAsRead = async (
  id: string,
): Promise<Notification> => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data?.notification ?? response.data.notification;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};
