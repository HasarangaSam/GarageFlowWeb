import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service.js";

import { AppError } from "../utils/errors.js";
import { blacklistToken } from "../utils/token-blacklist.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

export const register = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid registration data", 400);
  }

  const user = await registerUser(result.data);

  res.status(201).json({
    success: true,
    data: {
      user,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid login data", 400);
  }

  const resultData = await loginUser(result.data);

  res.cookie("refreshToken", resultData.refreshToken, refreshCookieOptions);

  res.json({
    success: true,
    data: {
      accessToken: resultData.accessToken,
      refreshToken: resultData.refreshToken,
      user: resultData.user,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken =
    req.cookies.refreshToken || (req.body && req.body.refreshToken);

  if (!refreshToken) {
    throw new AppError("Refresh token is missing", 401);
  }

  const result = await refreshAccessToken(refreshToken);

  res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken =
    req.cookies.refreshToken || (req.body && req.body.refreshToken);

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  // Blacklist access token in Upstash Redis if provided
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    const accessToken = authorization.substring(7);
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        if (remainingSeconds > 0) {
          await blacklistToken(accessToken, remainingSeconds);
        }
      }
    } catch (err) {
      console.warn("Could not decode access token during logout:", err);
    }
  }

  res.clearCookie("refreshToken", {
    ...refreshCookieOptions,
    maxAge: undefined,
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me = async (req: Request, res: Response) => {
  const authenticatedRequest = req as AuthenticatedRequest;

  const user = await getCurrentUser(authenticatedRequest.user.id);

  res.json({
    success: true,
    data: {
      user,
    },
  });
};
