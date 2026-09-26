import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type {
  CreateRepairJobInput,
  UpdateRepairJobInput,
  MechanicUpdateRepairJobInput,
} from "../schemas/repair-job.schema.js";
import { UserRole } from "../generated/prisma/enums.js";

import {
  createNotification,
  notifyMechanic,
  notifyManagers,
} from "./notification.service.js";

interface GetRepairJobsParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  priority?: CreateRepairJobInput["priority"];
  mechanicId?: string;
  hasInvoice?: boolean;
}

const generateJobNumber = async () => {
  const latestJob = await prisma.repairJob.findFirst({
    orderBy: { jobNumber: "desc" },
    select: { jobNumber: true },
  });

  if (!latestJob) {
    return "JOB-000001";
  }

  const match = latestJob.jobNumber.match(/(\d+)$/);
  const number = match ? Number.parseInt(match[1], 10) : 0;

  return `JOB-${String(number + 1).padStart(6, "0")}`;
};

const validateCustomerAndVehicle = async (
  customerId: string,
  vehicleId: string,
) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
    select: {
      id: true,
      customerId: true,
      mileage: true,
    },
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  if (vehicle.customerId !== customerId) {
    throw new AppError("Vehicle does not belong to this customer", 400);
  }

  return vehicle;
};

const validateMechanic = async (mechanicId: string) => {
  if (!mechanicId) {
    return;
  }

  const mechanic = await prisma.user.findUnique({
    where: {
      id: mechanicId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!mechanic) {
    throw new AppError("Mechanic not found", 404);
  }

  if (mechanic.role !== "MECHANIC") {
    throw new AppError("Selected user is not a mechanic", 400);
  }
};

const validateStatusTransition = (
  currentStatus: string,
  nextStatus: string,
) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedStatuses = validStatusTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new AppError(
      `Cannot change job status from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
};

export const getRepairJobs = async ({
  page,
  limit,
  search,
  status,
  priority,
  mechanicId,
  hasInvoice,
}: GetRepairJobsParams) => {
  const skip = (page - 1) * limit;

  const where: any = {
    ...(search
      ? {
          OR: [
            {
              jobNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              complaint: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                firstName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              customer: {
                lastName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              vehicle: {
                registrationNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              mechanic: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
    ...(status
      ? status.includes(",")
        ? { status: { in: status.split(",").map((s) => s.trim()) } }
        : { status }
      : {}),
    ...(priority ? { priority } : {}),
    ...(mechanicId ? { mechanicId } : {}),
    ...(hasInvoice === false
      ? { invoice: null }
      : hasInvoice === true
        ? { invoice: { isNot: null } }
        : {}),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.repairJob.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            parts: true,
          },
        },
      },
    }),

    prisma.repairJob.count({
      where,
    }),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRepairJobById = async (
  jobId: string,
  user: { id: string; role: UserRole },
) => {
  const job = await prisma.repairJob.findUnique({
    where: {
      id: jobId,
    },

    include: {
      customer: true,
      vehicle: true,

      mechanic: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      parts: {
        include: {
          part: true,
        },
      },

      invoice:
        user.role === "OWNER" || user.role === "MANAGER"
          ? {
              include: {
                items: true,
                payments: true,
              },
            }
          : false,
    },
  });

  if (!job) {
    throw new AppError("Repair job not found", 404);
  }

  if (user.role === "MECHANIC" && job.mechanicId !== user.id) {
    throw new AppError("You can only view jobs assigned to you", 403);
  }

  return job;
};

export const createRepairJob = async (input: CreateRepairJobInput) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: input.customerId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const vehicle = await validateCustomerAndVehicle(
    input.customerId,
    input.vehicleId,
  );

  if (input.mechanicId) {
    await validateMechanic(input.mechanicId);
  }

  const jobNumber = await generateJobNumber();

  const mileageIn = input.mileageIn ?? vehicle.mileage ?? undefined;

  if (
    mileageIn !== undefined &&
    vehicle.mileage !== null &&
    mileageIn < vehicle.mileage
  ) {
    throw new AppError(
      "Mileage in cannot be lower than the vehicle's current mileage",
      400,
    );
  }

  const job = await prisma.$transaction(async (tx) => {
    const createdJob = await tx.repairJob.create({
      data: {
        jobNumber,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        mechanicId: input.mechanicId,
        complaint: input.complaint,
        diagnosis: input.diagnosis || null,
        status: input.status || "RECEIVED",
        priority: input.priority || "NORMAL",
        mileageIn,
        notes: input.notes || null,
      },

      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (mileageIn !== undefined && mileageIn > (vehicle.mileage ?? -1)) {
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { mileage: mileageIn },
      });
    }

    return createdJob;
  });

  await invalidateDashboardCache();

  // Notify the assigned mechanic (fire-and-forget)
  notifyMechanic(job.mechanicId, job.jobNumber);

  return job;
};

export const updateRepairJob = async (
  jobId: string,
  input: UpdateRepairJobInput,
) => {
  const existingJob = await prisma.repairJob.findUnique({
    where: {
      id: jobId,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          mileage: true,
        },
      },
    },
  });

  if (!existingJob) {
    throw new AppError("Repair job not found", 404);
  }

  if (input.mechanicId) {
    await validateMechanic(input.mechanicId);
  }

  if (
    input.mileageIn !== undefined &&
    existingJob.mileageOut !== null &&
    input.mileageIn > existingJob.mileageOut
  ) {
    throw new AppError("Mileage in cannot be greater than mileage out", 400);
  }

  if (
    input.mileageOut !== undefined &&
    existingJob.mileageIn !== null &&
    input.mileageOut < existingJob.mileageIn
  ) {
    throw new AppError("Mileage out cannot be lower than mileage in", 400);
  }

  if (input.status && input.status !== existingJob.status) {
    validateStatusTransition(existingJob.status, input.status);

    // Guard: delivering a vehicle requires a fully-paid invoice
    if (input.status === "DELIVERED") {
      const invoice = await prisma.invoice.findUnique({
        where: { repairJobId: jobId },
        select: { status: true },
      });

      if (!invoice) {
        throw new AppError(
          "An invoice must be created and paid before the vehicle can be delivered",
          400,
        );
      }

      if (invoice.status !== "PAID") {
        throw new AppError(
          "The invoice must be fully paid before the vehicle can be delivered",
          400,
        );
      }
    }
  }

  const mileageOutAllowed =
    input.status === "COMPLETED" ||
    input.status === "READY_FOR_PICKUP" ||
    input.status === "DELIVERED";

  const mileageOut = mileageOutAllowed ? input.mileageOut : undefined;

  if (
    mileageOut !== undefined &&
    existingJob.vehicle.mileage !== null &&
    mileageOut < existingJob.vehicle.mileage
  ) {
    throw new AppError(
      "Mileage out cannot be lower than the vehicle's current mileage",
      400,
    );
  }

  const job = await prisma.$transaction(async (tx) => {
    const updatedJob = await tx.repairJob.update({
      where: {
        id: jobId,
      },

      data: {
        mechanicId: input.mechanicId,
        complaint: input.complaint,
        diagnosis: input.diagnosis,
        status: input.status,
        priority: input.priority,
        mileageIn: input.mileageIn,
        mileageOut,
        completedAt:
          input.status === "COMPLETED" && !existingJob.completedAt
            ? new Date()
            : undefined,
        notes: input.notes,
      },

      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (
      mileageOut !== undefined &&
      mileageOut > (existingJob.vehicle.mileage ?? -1)
    ) {
      await tx.vehicle.update({
        where: { id: existingJob.vehicle.id },
        data: { mileage: mileageOut },
      });
    }

    return updatedJob;
  });

  await invalidateDashboardCache();

  // Notify assigned mechanic if they changed or were first set
  const mechanicChanged =
    input.mechanicId && input.mechanicId !== existingJob.mechanicId;
  if (mechanicChanged) {
    notifyMechanic(job.mechanicId, job.jobNumber);
  }

  // Notify managers when a job is marked completed
  if (input.status === "COMPLETED") {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`;
    void notifyManagers(
      "JOB_COMPLETED",
      "Job Completed",
      `Job ${job.jobNumber} for ${customerName} (${job.vehicle.registrationNumber}) has been completed.`,
    );
  }

  return job;
};

export const updateRepairJobAsMechanic = async (
  jobId: string,
  mechanicId: string,
  input: MechanicUpdateRepairJobInput,
) => {
  const existingJob = await prisma.repairJob.findUnique({
    where: {
      id: jobId,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          mileage: true,
        },
      },
    },
  });

  if (!existingJob) {
    throw new AppError("Repair job not found", 404);
  }

  if (!existingJob.mechanicId) {
    throw new AppError("This job has not been assigned to a mechanic", 403);
  }

  if (existingJob.mechanicId !== mechanicId) {
    throw new AppError("You can only update jobs assigned to you", 403);
  }

  if (
    input.mileageOut !== undefined &&
    existingJob.mileageIn !== null &&
    input.mileageOut < existingJob.mileageIn
  ) {
    throw new AppError("Mileage out cannot be lower than mileage in", 400);
  }

  if (
    input.mileageOut !== undefined &&
    existingJob.vehicle.mileage !== null &&
    input.mileageOut < existingJob.vehicle.mileage
  ) {
    throw new AppError(
      "Mileage out cannot be lower than the vehicle's current mileage",
      400,
    );
  }

  if (input.status && input.status !== existingJob.status) {
    // Mechanics may only set operational statuses; front-office handles READY_FOR_PICKUP and DELIVERED
    const mechanicAllowedStatuses: string[] = [
      "IN_PROGRESS",
      "WAITING_FOR_PARTS",
      "COMPLETED",
    ];

    if (!mechanicAllowedStatuses.includes(input.status)) {
      throw new AppError(
        "Mechanics can only set status to IN_PROGRESS, WAITING_FOR_PARTS, or COMPLETED",
        403,
      );
    }

    validateStatusTransition(existingJob.status, input.status);
  }

  const job = await prisma.$transaction(async (tx) => {
    const updatedJob = await tx.repairJob.update({
      where: {
        id: jobId,
      },

      data: {
        diagnosis: input.diagnosis,
        status: input.status,
        mileageOut: input.mileageOut,
        completedAt:
          input.status === "COMPLETED" && !existingJob.completedAt
            ? new Date()
            : undefined,
        notes: input.notes,
      },

      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (
      input.mileageOut !== undefined &&
      input.mileageOut > (existingJob.vehicle.mileage ?? -1)
    ) {
      await tx.vehicle.update({
        where: { id: existingJob.vehicle.id },
        data: { mileage: input.mileageOut },
      });
    }

    return updatedJob;
  });

  await invalidateDashboardCache();

  // Notify managers when a mechanic marks a job as completed
  if (input.status === "COMPLETED") {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`;
    void notifyManagers(
      "JOB_COMPLETED",
      "Job Completed",
      `Job ${job.jobNumber} for ${customerName} (${job.vehicle.registrationNumber}) has been completed.`,
    );
  }

  return job;
};

export const deleteRepairJob = async (jobId: string) => {
  const existingJob = await prisma.repairJob.findUnique({
    where: {
      id: jobId,
    },
    include: {
      invoice: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!existingJob) {
    throw new AppError("Repair job not found", 404);
  }

  if (existingJob.invoice) {
    throw new AppError("Repair jobs with invoices cannot be deleted", 409);
  }

  if (
    existingJob.status === "COMPLETED" ||
    existingJob.status === "READY_FOR_PICKUP" ||
    existingJob.status === "DELIVERED"
  ) {
    throw new AppError(
      "Completed or later-stage repair jobs cannot be deleted",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    const jobParts = await tx.jobPart.findMany({
      where: { jobId },
      select: { partId: true, quantity: true },
    });

    for (const jobPart of jobParts) {
      await tx.part.update({
        where: { id: jobPart.partId },
        data: { quantity: { increment: jobPart.quantity } },
      });
      await tx.inventoryTransaction.create({
        data: {
          partId: jobPart.partId,
          type: "RETURN",
          quantity: jobPart.quantity,
          referenceType: "REPAIR_JOB_DELETION",
          referenceId: jobId,
        },
      });
    }

    await tx.repairJob.delete({ where: { id: jobId } });
  });

  await invalidateDashboardCache();
};

export const getMyRepairJobs = async (
  mechanicId: string,
  page: number,
  limit: number,
  search?: string,
  status?: string,
  priority?: CreateRepairJobInput["priority"],
) => {
  const skip = (page - 1) * limit;
  const where: any = {
    mechanicId,
    ...(search
      ? {
          OR: [
            { jobNumber: { contains: search, mode: "insensitive" as const } },
            { complaint: { contains: search, mode: "insensitive" as const } },
            { diagnosis: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
            {
              customer: {
                firstName: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              customer: {
                lastName: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              vehicle: {
                registrationNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.repairJob.findMany({
      where,

      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },

        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            parts: true,
          },
        },
      },
    }),

    prisma.repairJob.count({
      where,
    }),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const validStatusTransitions: Record<string, string[]> = {
  RECEIVED: ["IN_PROGRESS", "COMPLETED"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "COMPLETED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "COMPLETED"],
  COMPLETED: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["DELIVERED"],
  DELIVERED: [],
};
