import { prisma } from "../config/database.js";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";
import type { CreateStaffInput, UpdateStaffInput } from "../schemas/auth.schema.js";

interface GetUsersParams {
  role?: "OWNER" | "MANAGER" | "MECHANIC";
  search?: string;
}

export const getUsers = async ({ role, search }: GetUsersParams = {}) => {
  const where: {
    role?: "OWNER" | "MANAGER" | "MECHANIC";
    OR?: { name: { contains: string; mode: "insensitive" } }[];
  } = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getMechanics = async (search?: string) => {
  return getUsers({ role: "MECHANIC", search });
};

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const createStaffUser = async (input: CreateStaffInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const staffUser = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
    },
    select: staffSelect,
  });

  await invalidateDashboardCache();
  return staffUser;
};

export const updateStaffUser = async (
  userId: string,
  input: UpdateStaffInput,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { assignedJobs: true } } },
  });

  if (!user || user.role === "OWNER") {
    throw new AppError("Staff account not found", 404);
  }

  if (input.email && input.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }
  }

  if (
    user.role === "MECHANIC" &&
    input.role === "MANAGER" &&
    user._count.assignedJobs > 0
  ) {
    throw new AppError(
      "Reassign this mechanic's jobs before changing their role",
      409,
    );
  }

  const staffUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.password !== undefined
        ? { passwordHash: await bcrypt.hash(input.password, 12) }
        : {}),
    },
    select: staffSelect,
  });

  await invalidateDashboardCache();
  return staffUser;
};

export const deleteStaffUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, _count: { select: { assignedJobs: true } } },
  });

  if (!user || user.role === "OWNER") {
    throw new AppError("Staff account not found", 404);
  }

  if (user._count.assignedJobs > 0) {
    throw new AppError(
      "Reassign this mechanic's jobs before deleting their account",
      409,
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  await invalidateDashboardCache();
};
