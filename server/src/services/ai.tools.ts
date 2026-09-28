import { prisma } from "../config/database.js";

export const getActiveJobs = async () => {
  const jobs = await prisma.repairJob.findMany({
    where: {
      status: {
        in: [
          "RECEIVED",
          "IN_PROGRESS",
          "WAITING_FOR_PARTS",
          "COMPLETED",
          "READY_FOR_PICKUP",
        ],
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      jobNumber: true,
      complaint: true,
      diagnosis: true,
      status: true,
      priority: true,

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
          name: true,
        },
      },
    },
  });

  return {
    count: jobs.length,
    jobs,
  };
};

export const getMonthlyRevenue = async () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const result = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },

    where: {
      paidAt: {
        gte: start,
        lt: end,
      },
    },
  });

  return {
    month: now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    }),

    revenue: Number(result._sum.amount ?? 0),
  };
};

export const getLowStockParts = async () => {
  const parts = await prisma.part.findMany({
    select: {
      sku: true,
      name: true,
      quantity: true,
      minimumStock: true,
      sellingPrice: true,
    },
  });

  const lowStockParts = parts
    .filter((part) => part.quantity <= part.minimumStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 20);

  return {
    count: lowStockParts.length,

    parts: lowStockParts.map((part) => ({
      ...part,

      sellingPrice: Number(part.sellingPrice),
    })),
  };
};

export const getOutstandingInvoices = async () => {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["ISSUED", "PARTIALLY_PAID"],
      },
    },

    select: {
      invoiceNumber: true,
      total: true,
      status: true,

      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },

      payments: {
        select: {
          amount: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const result = invoices.map((invoice) => {
    const paid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const total = Number(invoice.total);

    const remaining = Math.max(total - paid, 0);

    return {
      invoiceNumber: invoice.invoiceNumber,

      customer: `${invoice.customer.firstName} ${invoice.customer.lastName}`,

      status: invoice.status,

      total,

      paid,

      remaining,
    };
  });

  return {
    count: result.length,
    invoices: result,
  };
};

export const getVehicleServiceHistory = async (registrationNumber: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      registrationNumber: registrationNumber.trim().toUpperCase(),
    },

    select: {
      registrationNumber: true,
      make: true,
      model: true,
      year: true,

      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },

      jobs: {
        orderBy: {
          createdAt: "desc",
        },

        select: {
          jobNumber: true,
          complaint: true,
          diagnosis: true,
          status: true,
          createdAt: true,

          invoice: {
            select: {
              total: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!vehicle) {
    return {
      found: false,
      message: "Vehicle not found",
    };
  }

  return {
    found: true,

    vehicle: {
      registrationNumber: vehicle.registrationNumber,

      make: vehicle.make,

      model: vehicle.model,

      year: vehicle.year,

      customer: `${vehicle.customer.firstName} ${vehicle.customer.lastName}`,
    },

    serviceHistory: vehicle.jobs.map((job) => ({
      jobNumber: job.jobNumber,

      complaint: job.complaint,

      diagnosis: job.diagnosis,

      status: job.status,

      date: job.createdAt,

      invoice: job.invoice
        ? {
            total: Number(job.invoice.total),

            status: job.invoice.status,
          }
        : null,
    })),
  };
};

export const getMechanicPerformance = async () => {
  const mechanics = await prisma.user.findMany({
    where: {
      role: "MECHANIC",
    },

    select: {
      id: true,
      name: true,

      assignedJobs: {
        select: {
          status: true,
        },
      },
    },
  });

  return {
    mechanics: mechanics.map((mechanic) => {
      const jobs = mechanic.assignedJobs;

      return {
        mechanicId: mechanic.id,

        mechanicName: mechanic.name,

        totalJobs: jobs.length,

        completedJobs: jobs.filter((job) => job.status === "COMPLETED").length,

        deliveredJobs: jobs.filter((job) => job.status === "DELIVERED").length,

        activeJobs: jobs.filter((job) => job.status !== "DELIVERED").length,
      };
    }),
  };
};

type AnalyticsBreakdown = "month" | "status" | "mechanic" | "vehicle_make";

/** Summarizes a bounded time window so the model can answer trend and comparison questions. */
export const getBusinessAnalytics = async (
  requestedDays: number,
  breakdown: AnalyticsBreakdown = "month",
  includeFinancials = true,
) => {
  const days = Math.min(Math.max(Math.trunc(requestedDays) || 30, 7), 365);
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);

  const [jobs, previousJobs, payments, previousPayments, invoices, lowStock] =
    await Promise.all([
      prisma.repairJob.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: {
          status: true,
          priority: true,
          createdAt: true,
          completedAt: true,
          mechanic: { select: { name: true } },
          vehicle: { select: { make: true } },
        },
      }),
      prisma.repairJob.count({
        where: { createdAt: { gte: previousStart, lt: start } },
      }),
      includeFinancials
        ? prisma.payment.findMany({
            where: { paidAt: { gte: start, lt: end } },
            select: { amount: true, paidAt: true },
          })
        : Promise.resolve([]),
      includeFinancials
        ? prisma.payment.aggregate({
            _sum: { amount: true },
            where: { paidAt: { gte: previousStart, lt: start } },
          })
        : Promise.resolve({ _sum: { amount: null } }),
      includeFinancials
        ? prisma.invoice.findMany({
            where: { issuedAt: { gte: start, lt: end }, status: { not: "VOID" } },
            select: { total: true },
          })
        : Promise.resolve([]),
      prisma.part.count({ where: { quantity: { lte: 0 } } }),
    ]);

  const completed = jobs.filter((job) => job.completedAt !== null).length;
  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const previousRevenue = Number(previousPayments._sum.amount ?? 0);
  const completionRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;
  const grouped = new Map<string, { jobs: number; completed: number; revenue: number }>();
  const keyFor = (job: (typeof jobs)[number]) => {
    if (breakdown === "status") return job.status;
    if (breakdown === "mechanic") return job.mechanic?.name ?? "Unassigned";
    if (breakdown === "vehicle_make") return job.vehicle.make;
    return `${job.createdAt.getFullYear()}-${String(job.createdAt.getMonth() + 1).padStart(2, "0")}`;
  };
  for (const job of jobs) {
    const key = keyFor(job);
    const row = grouped.get(key) ?? { jobs: 0, completed: 0, revenue: 0 };
    row.jobs += 1;
    if (job.completedAt) row.completed += 1;
    grouped.set(key, row);
  }
  if (breakdown === "month") {
    for (const payment of payments) {
      const key = `${payment.paidAt.getFullYear()}-${String(payment.paidAt.getMonth() + 1).padStart(2, "0")}`;
      const row = grouped.get(key) ?? { jobs: 0, completed: 0, revenue: 0 };
      row.revenue += Number(payment.amount);
      grouped.set(key, row);
    }
  }

  return {
    period: { start, end, days },
    comparison: {
      previousPeriodJobs: previousJobs,
      jobsChange: jobs.length - previousJobs,
      ...(includeFinancials
        ? { previousPeriodRevenue: previousRevenue, revenueChange: revenue - previousRevenue }
        : {}),
    },
    summary: {
      jobsCreated: jobs.length,
      jobsCompleted: completed,
      completionRatePercent: completionRate,
      urgentOrHighPriorityJobs: jobs.filter((job) => ["URGENT", "HIGH"].includes(job.priority)).length,
      zeroStockPartCount: lowStock,
      ...(includeFinancials
        ? {
            paymentsCollected: revenue,
            averageIssuedInvoice: invoices.length
              ? invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0) / invoices.length
              : 0,
            issuedInvoiceCount: invoices.length,
          }
        : {}),
    },
    breakdownBy: breakdown,
    breakdown: [...grouped.entries()]
      .map(([label, values]) => ({ label, ...values }))
      .sort((a, b) => breakdown === "month" ? a.label.localeCompare(b.label) : b.jobs - a.jobs)
      .slice(0, 20),
    note: "Job completion count includes jobs created in this period that have a completion timestamp. Payments are cash collected during the period; issued invoice totals are a separate measure.",
  };
};
