export type NotificationType =
  | "JOB_ASSIGNED"
  | "JOB_COMPLETED"
  | "JOB_STATUS_CHANGED"
  | "LOW_STOCK"
  | "PAYMENT_RECEIVED"
  | "GENERAL";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
