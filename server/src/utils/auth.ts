import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import type { UserRole } from "../generated/prisma/client.js";

interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateRefreshToken = (userId: string) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId,
    },
    secret,
    {
      expiresIn: "7d",
    },
  );
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }

  return jwt.verify(token, secret) as RefreshTokenPayload;
};

export const generateAccessToken = (userId: string, role: UserRole) => {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId,
      role,
    },
    secret,
    {
      expiresIn: "15m",
    },
  );
};

export const verifyAccessToken = (token: string) => {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }

  return jwt.verify(token, secret) as AccessTokenPayload;
};
