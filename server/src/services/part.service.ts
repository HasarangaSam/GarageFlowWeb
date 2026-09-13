import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { notifyLowStock } from "./notification.service.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type {
  CreatePartInput,
  UpdatePartInput,
  AdjustStockInput,
} from "../schemas/part.schema.js";

interface GetPartsParams {
  page: number;
  limit: number;
  search?: string;
  status?: "all" | "inStock" | "lowStock" | "outOfStock";
}

export const getParts = async ({ page, limit, search, status = "all" }: GetPartsParams) => {
  const skip = (page - 1) * limit;

  // Build where conditions
  const conditions: any[] = [];

  if (search) {
    conditions.push({
      OR: [
        {
          sku: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    });
  }

  if (status === "outOfStock") {
    conditions.push({ quantity: 0 });
  } else if (status === "inStock") {
    conditions.push({ quantity: { gt: 0 } });
  } else if (status === "lowStock") {
    // In PostgreSQL, find part IDs where quantity <= minimumStock AND quantity > 0
    const lowStockRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Part" WHERE quantity <= "minimumStock" AND quantity > 0
    `;
    const lowStockIds = lowStockRows.map((r) => r.id);
    conditions.push({ id: { in: lowStockIds } });
  }

  const where = conditions.length > 0 ? { AND: conditions } : undefined;

  const [parts, total] = await prisma.$transaction([
    prisma.part.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.part.count({
      where,
    }),
  ]);

  return {
    parts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getInventorySummary = async () => {
  const parts = await prisma.part.findMany({
    select: {
      id: true,
      quantity: true,
      minimumStock: true,
      costPrice: true,
      sellingPrice: true,
    },
  });

  let totalItems = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalValuation = 0;
  let totalRetailValue = 0;

  for (const part of parts) {
    totalItems += part.quantity;
    if (part.quantity === 0) {
      outOfStockCount++;
    } else if (part.quantity <= part.minimumStock) {
      lowStockCount++;
    }
    const cost = Number(part.costPrice) || 0;
    const sell = Number(part.sellingPrice) || 0;
    totalValuation += part.quantity * cost;
    totalRetailValue += part.quantity * sell;
  }

  return {
    totalSkus: parts.length,
    totalItems,
    lowStockCount,
    outOfStockCount,
    totalValuation: Math.round(totalValuation * 100) / 100,
    totalRetailValue: Math.round(totalRetailValue * 100) / 100,
    projectedProfit: Math.round((totalRetailValue - totalValuation) * 100) / 100,
  };
};

export const getPartById = async (partId: string) => {
  const part = await prisma.part.findUnique({
    where: {
      id: partId,
    },

    include: {
      _count: {
        select: {
          jobParts: true,
          inventoryTransactions: true,
        },
      },
    },
  });

  if (!part) {
    throw new AppError("Part not found", 404);
  }

  return part;
};

export const createPart = async (input: CreatePartInput) => {
  const existingPart = await prisma.part.findUnique({
    where: {
      sku: input.sku,
    },
  });

  if (existingPart) {
    throw new AppError("A part with this SKU already exists", 409);
  }

  const part = await prisma.$transaction(async (tx) => {
    const createdPart = await tx.part.create({
      data: {
        sku: input.sku,
        name: input.name,
        description: input.description || null,
        quantity: input.quantity,
        minimumStock: input.minimumStock,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
      },
    });

    if (input.quantity > 0) {
      await tx.inventoryTransaction.create({
        data: {
          partId: createdPart.id,
          type: "PURCHASE",
          quantity: input.quantity,
          referenceType: "PART_CREATION",
          referenceId: createdPart.id,
        },
      });

      // Notify if initial quantity is already at or below the minimum
      await notifyLowStock(tx, createdPart);
    }

    return createdPart;
  });

  await invalidateDashboardCache();

  return part;
};

export const updatePart = async (partId: string, input: UpdatePartInput) => {
  const existingPart = await prisma.part.findUnique({
    where: {
      id: partId,
    },
  });

  if (!existingPart) {
    throw new AppError("Part not found", 404);
  }

  if (input.sku) {
    const duplicate = await prisma.part.findFirst({
      where: {
        sku: input.sku,
        NOT: {
          id: partId,
        },
      },
    });

    if (duplicate) {
      throw new AppError("A part with this SKU already exists", 409);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const part = await tx.part.update({
      where: {
        id: partId,
      },

      data: {
        sku: input.sku,
        name: input.name,
        description: input.description,
        quantity: input.quantity,
        minimumStock: input.minimumStock,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
      },
    });

    // If quantity was explicitly edited, log an inventory transaction
    if (input.quantity !== undefined && input.quantity !== existingPart.quantity) {
      const diff = input.quantity - existingPart.quantity;
      await tx.inventoryTransaction.create({
        data: {
          partId: part.id,
          type: diff > 0 ? "PURCHASE" : "ADJUSTMENT",
          quantity: Math.abs(diff),
          referenceType: "DIRECT_EDIT",
          referenceId: null,
        },
      });
    }

    // Only check low-stock when quantity or minimumStock was touched
    if (input.quantity !== undefined || input.minimumStock !== undefined) {
      await notifyLowStock(tx, part);
    }

    return part;
  });

  await invalidateDashboardCache();

  return updated;
};

export const adjustPartStock = async (
  partId: string,
  input: AdjustStockInput,
  userId?: string,
) => {
  const existingPart = await prisma.part.findUnique({
    where: { id: partId },
  });

  if (!existingPart) {
    throw new AppError("Part not found", 404);
  }

  let delta = 0;
  if (input.type === "PURCHASE" || input.type === "RETURN") {
    delta = Math.abs(input.quantity);
  } else if (input.type === "DAMAGE") {
    delta = -Math.abs(input.quantity);
  } else if (input.type === "ADJUSTMENT") {
    delta = input.quantity;
  }

  const newQuantity = existingPart.quantity + delta;
  if (newQuantity < 0) {
    throw new AppError(
      `Insufficient stock. Current stock is ${existingPart.quantity}, but adjustment would result in ${newQuantity}.`,
      400,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const part = await tx.part.update({
      where: { id: partId },
      data: { quantity: newQuantity },
    });

    await tx.inventoryTransaction.create({
      data: {
        partId: part.id,
        type: input.type,
        quantity: Math.abs(delta),
        referenceType:
          input.reason ||
          (input.type === "PURCHASE" ? "RESTOCK" : "MANUAL_ADJUSTMENT"),
        referenceId: userId || null,
      },
    });

    if (newQuantity <= part.minimumStock) {
      await notifyLowStock(tx, part);
    }

    return part;
  });

  await invalidateDashboardCache();
  return updated;
};

export const getPartTransactions = async (partId: string) => {
  const part = await prisma.part.findUnique({
    where: { id: partId },
    select: { id: true, name: true, sku: true },
  });

  if (!part) {
    throw new AppError("Part not found", 404);
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { partId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    part,
    transactions,
  };
};

export const deletePart = async (partId: string) => {
  const existingPart = await prisma.part.findUnique({
    where: {
      id: partId,
    },

    include: {
      jobParts: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!existingPart) {
    throw new AppError("Part not found", 404);
  }

  if (existingPart.jobParts.length > 0) {
    throw new AppError("Parts used in repair jobs cannot be deleted", 409);
  }

  await prisma.part.delete({
    where: {
      id: partId,
    },
  });

  await invalidateDashboardCache();
};
