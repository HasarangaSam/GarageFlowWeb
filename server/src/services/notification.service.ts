import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import type { NotificationType } from "../generated/prisma/enums.js";
import { AppError } from "../utils/errors.js";
import { getSocketIO } from "../socket/io.js";

// ---------------------------------------------------------------------------
// Internal helpers used by other services (fire-and-forget, never throws)
// ---------------------------------------------------------------------------

/**
 * Notify a single mechanic that a job has been assigned to them.
 * Silently skips if mechanicId is undefined/null.
 */
export const notifyMechanic = (
  mechanicId: string | null | undefined,
  jobNumber: string,
): void => {
  if (!mechanicId) return;

  createNotification({
    userId: mechanicId,
    type: "JOB_ASSIGNED",
    title: "New Job Assigned",
    message: `Job ${jobNumber} has been assigned to you.`,
  }).catch(() => {
    // Notification failure should never crash the main request
  });
};

/**
 * Notify all OWNER and MANAGER users about a business event.
 * Silently ignores any errors.
 */
export const notifyManagers = async (
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { id: true },
    });

    await Promise.allSettled(
      managers.map((u) =>
        createNotification({ userId: u.id, type, title, message }),
      ),
    );
  } catch {
    // Notification failure should never crash the main request
  }
};

/**
 * Check whether a part has hit or dropped below its minimum stock level and,
 * if so, fan out LOW_STOCK notifications to all OWNER / MANAGER users.
 *
 * Must be called **inside** an existing Prisma transaction (`tx`) so the
 * notification rows are committed atomically with the stock update.
 * Any error is swallowed — a notification failure must never roll back stock.
 */
export const notifyLowStock = async (
  tx: Prisma.TransactionClient,
  part: { id: string; name: string; quantity: number; minimumStock: number },
): Promise<void> => {
  if (part.quantity > part.minimumStock) return;

  try {
    const staff = await tx.user.findMany({
      where: { role: { in: ["OWNER", "MANAGER"] } },
      select: { id: true },
    });

    if (staff.length === 0) return;

    const notifications = await Promise.all(
      staff.map((user) =>
        tx.notification.create({
          data: {
            userId: user.id,
            type: "LOW_STOCK" as const,
            title: "Low stock",
            message: `${part.name} is low in stock. Only ${part.quantity} remaining.`,
          },
        }),
      ),
    );

    try {
      const io = getSocketIO();
      for (const notification of notifications) {
        io.to(`user:${notification.userId}`).emit(
          "inventory:low",
          notification,
        );
      }
    } catch {
      // Socket emission failure should not break the database transaction
    }
  } catch {
    // Never let a notification failure roll back the stock transaction
  }
};

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface GetNotificationsOptions {
  page: number;
  limit: number;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
}: CreateNotificationInput) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });

  const io = getSocketIO();

  io.to(`user:${userId}`).emit("notification:new", notification);

  return notification;
};

export const getNotifications = async ({
  userId,
  page,
  limit,
}: GetNotificationsOptions & {
  userId: string;
}) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.notification.count({
      where: {
        userId,
      },
    }),

    prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      read: true,
    },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
};
