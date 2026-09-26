import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { notifyLowStock } from "./notification.service.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type { AddJobPartInput } from "../schemas/job-part.schema.js";

export const getJobParts = async (
  jobId: string,
  user: { id: string; role: string },
) => {
  const job = await prisma.repairJob.findUnique({
    where: {
      id: jobId,
    },
    select: {
      id: true,
      mechanicId: true,
    },
  });

  if (!job) {
    throw new AppError("Repair job not found", 404);
  }

  if (user.role === "MECHANIC" && job.mechanicId !== user.id) {
    throw new AppError("You can only view parts for jobs assigned to you", 403);
  }

  return prisma.jobPart.findMany({
    where: {
      jobId,
    },

    orderBy: {
      createdAt: "asc",
    },

    include: {
      part:
        user.role === "MECHANIC"
          ? {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                quantity: true,
                sellingPrice: true,
              },
            }
          : true,
    },
  });
};

const addJobPartInTransaction = async (
  tx: Prisma.TransactionClient,
  jobId: string,
  input: AddJobPartInput,
  user?: { id: string; role: string },
) => {
    const job = await tx.repairJob.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        status: true,
        mechanicId: true,
      },
    });

    if (!job) {
      throw new AppError("Repair job not found", 404);
    }

    if (
      job.status === "COMPLETED" ||
      job.status === "READY_FOR_PICKUP" ||
      job.status === "DELIVERED"
    ) {
      throw new AppError(
        "Parts cannot be changed after a repair job is completed",
        400,
      );
    }

    if (user?.role === "MECHANIC") {
      if (job.mechanicId !== user.id) {
        throw new AppError(
          "You can only add parts to repair jobs assigned to you",
          403,
        );
      }
    }

    // Block modifications once an invoice has been generated
    const existingInvoice = await tx.invoice.findUnique({
      where: { repairJobId: jobId },
      select: { id: true },
    });

    if (existingInvoice) {
      throw new AppError(
        "Cannot modify parts for a repair job that already has an invoice",
        400,
      );
    }

    const part = await tx.part.findUnique({
      where: {
        id: input.partId,
      },
    });

    if (!part) {
      throw new AppError("Part not found", 404);
    }

    const existingJobPart = await tx.jobPart.findUnique({
      where: {
        jobId_partId: {
          jobId,
          partId: input.partId,
        },
      },
    });

    if (existingJobPart) {
      throw new AppError("This part has already been added to the job", 409);
    }

    const total = new Prisma.Decimal(part.sellingPrice).mul(input.quantity);

    const jobPart = await tx.jobPart.create({
      data: {
        jobId,
        partId: input.partId,
        quantity: input.quantity,
        unitPrice: part.sellingPrice,
        total,
      },

      include: {
        part: true,
      },
    });

    // Decrement stock and capture the updated part for the low-stock check
    const stockUpdate = await tx.part.updateMany({
      where: { id: input.partId, quantity: { gte: input.quantity } },
      data: {
        quantity: {
          decrement: input.quantity,
        },
      },
    });

    if (stockUpdate.count === 0) {
      throw new AppError("Insufficient stock for this allocation", 409);
    }

    const updatedPart = await tx.part.findUniqueOrThrow({
      where: { id: input.partId },
    });

    await tx.inventoryTransaction.create({
      data: {
        partId: input.partId,
        type: "JOB_USAGE",
        quantity: -input.quantity,
        referenceType: "REPAIR_JOB",
        referenceId: jobId,
      },
    });

    // Notify OWNER/MANAGER if stock has dropped to or below the minimum
    await notifyLowStock(tx, updatedPart);

  return jobPart;
};

export const addJobPart = async (
  jobId: string,
  input: AddJobPartInput,
  user?: { id: string; role: string },
) => {
  const result = await prisma.$transaction((tx) =>
    addJobPartInTransaction(tx, jobId, input, user),
  );

  await invalidateDashboardCache();

  return result;
};

export const addJobParts = async (
  jobId: string,
  inputs: AddJobPartInput[],
  user?: { id: string; role: string },
) => {
  const result = await prisma.$transaction(async (tx) => {
    const jobParts = [];
    for (const input of inputs) {
      jobParts.push(await addJobPartInTransaction(tx, jobId, input, user));
    }
    return jobParts;
  });

  await invalidateDashboardCache();

  return result;
};

export const removeJobPart = async (
  jobId: string,
  jobPartId: string,
  user?: { id: string; role: string },
) => {
  await prisma.$transaction(async (tx) => {
    const jobPart = await tx.jobPart.findFirst({
      where: {
        id: jobPartId,
        jobId,
      },
    });

    if (!jobPart) {
      throw new AppError("Job part not found", 404);
    }

    const job = await tx.repairJob.findUnique({
      where: {
        id: jobId,
      },
      select: {
        status: true,
        mechanicId: true,
      },
    });

    if (!job) {
      throw new AppError("Repair job not found", 404);
    }

    if (
      job.status === "COMPLETED" ||
      job.status === "READY_FOR_PICKUP" ||
      job.status === "DELIVERED"
    ) {
      throw new AppError(
        "Parts cannot be changed after a repair job is completed",
        400,
      );
    }

    if (user?.role === "MECHANIC") {
      if (job.mechanicId !== user.id) {
        throw new AppError(
          "You can only remove parts from repair jobs assigned to you",
          403,
        );
      }
    }

    // Block modifications once an invoice has been generated
    const existingInvoice = await tx.invoice.findUnique({
      where: { repairJobId: jobId },
      select: { id: true },
    });

    if (existingInvoice) {
      throw new AppError(
        "Cannot modify parts for a repair job that already has an invoice",
        400,
      );
    }

    await tx.jobPart.delete({
      where: {
        id: jobPartId,
      },
    });

    await tx.part.update({
      where: {
        id: jobPart.partId,
      },

      data: {
        quantity: {
          increment: jobPart.quantity,
        },
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        partId: jobPart.partId,
        type: "RETURN",
        quantity: jobPart.quantity,
        referenceType: "REPAIR_JOB",
        referenceId: jobId,
      },
    });
  });

  await invalidateDashboardCache();
};

