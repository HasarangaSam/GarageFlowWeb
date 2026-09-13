import type { Request, Response } from "express";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getNotificationsController = async (
  req: Request,
  res: Response,
) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const result = await getNotifications({
    userId,
    page,
    limit,
  });

  res.status(200).json(result);
};

export const markNotificationAsReadController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  const notification = await markNotificationAsRead(userId, req.params.id);

  res.status(200).json({
    message: "Notification marked as read",
    notification,
  });
};

export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response,
) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  await markAllNotificationsAsRead(userId);

  res.status(200).json({
    message: "All notifications marked as read",
  });
};
