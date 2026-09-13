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
