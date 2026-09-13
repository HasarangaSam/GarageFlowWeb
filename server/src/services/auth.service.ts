import bcrypt from "bcryptjs";

import { prisma } from "../config/database.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "../utils/auth.js";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

const REFRESH_TOKEN_DAYS = 7;

const getRefreshTokenExpiry = () => {
  const expiry = new Date();

  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_DAYS);

  return expiry;
};

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "MECHANIC",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  await invalidateDashboardCache();
  return user;
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);

  const refreshToken = generateRefreshToken(user.id);
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.revokedAt) {
    throw new AppError("Refresh token has been revoked", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError("Refresh token has expired", 401);
  }

  const newRefreshToken = generateRefreshToken(storedToken.user.id);
  const newTokenHash = hashRefreshToken(newRefreshToken);

  const newExpiry = getRefreshTokenExpiry();

  const accessToken = generateAccessToken(
    storedToken.user.id,
    storedToken.user.role,
  );

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

    prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newTokenHash,
        expiresAt: newExpiry,
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
  };
};

export const logoutUser = async (refreshToken: string) => {
  try {
    const tokenHash = hashRefreshToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch {
    // If token is invalid or parsing fails, simply ignore
  }
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
