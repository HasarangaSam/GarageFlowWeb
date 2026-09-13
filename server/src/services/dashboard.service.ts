import { prisma } from "../config/database.js";

import { getDashboardCache, setDashboardCache } from "../utils/cache.js";

const getTodayRange = () => {
  const start = new Date();

  start.setHours(0, 0, 0, 0);

  const end = new Date();

  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
  };
};

export const getDashboardSummary = async () => {
  const cachedDashboard = await getDashboardCache();

  if (cachedDashboard) {
    return cachedDashboard;
  }

  const { start, end } = getTodayRange();

  const [
    activeJobs,
    completedToday,
    activeJobStatuses,
    todayRevenue,
    outstandingInvoices,
    allParts,
    recentJobs,
    recentPayments,
    mechanicWorkload,
  ] = await Promise.all([
    prisma.repairJob.count({
      where: {
        status: {
          in: [
            "RECEIVED",
            "IN_PROGRESS",
            "WAITING_FOR_PARTS",
          ],
        },
      },
    }),

    prisma.repairJob.count({
      where: {
        completedAt: {
          gte: start,
          lte: end,
        },
      },
    }),

    prisma.repairJob.groupBy({
      by: ["status"],
      where: {
        status: {
          in: ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS"],
        },
      },
      _count: { _all: true },
    }),

    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        paidAt: {
          gte: start,
          lte: end,
        },
      },
    }),

    prisma.invoice.findMany({
      where: {
        status: {
          in: ["ISSUED", "PARTIALLY_PAID"],
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        payments: {
          select: {
            amount: true,
          },
        },
      },
    }),

    prisma.part.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        quantity: true,
        minimumStock: true,
        sellingPrice: true,
      },
    }),

    prisma.repairJob.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        jobNumber: true,
        complaint: true,
        status: true,
        priority: true,
        updatedAt: true,

        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },

        vehicle: {
          select: {
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.payment.findMany({
      orderBy: {
        paidAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        method: true,
        reference: true,
        paidAt: true,

        invoice: {
          select: {
            invoiceNumber: true,

            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),

    prisma.user.findMany({
      where: {
        role: "MECHANIC",
      },
      select: {
        id: true,
        name: true,

        assignedJobs: {
          where: {
            status: {
              in: ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS"],
            },
          },
          select: {
            status: true,
          },
        },
      },
    }),
  ]);

  const lowStockParts = allParts
    .filter((part) => part.quantity <= part.minimumStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  const outstandingAmount = outstandingInvoices.reduce((sum, invoice) => {
    const paid = invoice.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );

    const remaining = Number(invoice.total) - paid;

    return sum + Math.max(remaining, 0);
  }, 0);

  const formattedMechanicWorkload = mechanicWorkload.map((mechanic) => {
    const jobs = mechanic.assignedJobs;

    return {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      total: jobs.length,

      received: jobs.filter((job) => job.status === "RECEIVED").length,

      inProgress: jobs.filter((job) => job.status === "IN_PROGRESS").length,

      waitingForParts: jobs.filter((job) => job.status === "WAITING_FOR_PARTS")
        .length,

    };
  });

  const jobStatusCounts = {
    received: 0,
    inProgress: 0,
    waitingForParts: 0,
  };

  for (const group of activeJobStatuses) {
    if (group.status === "RECEIVED") jobStatusCounts.received = group._count._all;
    if (group.status === "IN_PROGRESS") jobStatusCounts.inProgress = group._count._all;
    if (group.status === "WAITING_FOR_PARTS") {
      jobStatusCounts.waitingForParts = group._count._all;
    }
  }

  const dashboard = {
    summary: {
      activeJobs,

      completedToday,

      todayRevenue: Number(todayRevenue._sum.amount ?? 0),

      outstandingPayments: Number(outstandingAmount.toFixed(2)),

      lowStockParts: lowStockParts.length,
    },

    lowStockParts: lowStockParts.map((part) => ({
      ...part,

      sellingPrice: Number(part.sellingPrice),
    })),

    recentJobs,

    jobStatusCounts,

    recentPayments: recentPayments.map((payment) => ({
      ...payment,

      amount: Number(payment.amount),
    })),

    mechanicWorkload: formattedMechanicWorkload,
  };

  await setDashboardCache(dashboard);

  return dashboard;
};
