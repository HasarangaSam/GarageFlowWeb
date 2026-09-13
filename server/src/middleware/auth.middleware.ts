import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../utils/auth.js";
import { isTokenBlacklisted } from "../utils/token-blacklist.js";
import { AppError } from "../utils/errors.js";

import type { UserRole } from "../generated/prisma/client.js";

export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user: {
    id: string;
    role: UserRole;
  };
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));

    return;
  }

  const token = authorization.substring(7);

  try {
    const isRevoked = await isTokenBlacklisted(token);

    if (isRevoked) {
      next(
        new AppError(
          "Session expired or token revoked. Please sign in again.",
          401,
        ),
      );
      return;
    }

    const payload = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
};

export const requireRole =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.user) {
      next(new AppError("Authentication required", 401));

      return;
    }

    if (!allowedRoles.includes(authenticatedRequest.user.role)) {
      next(new AppError("You do not have permission", 403));

      return;
    }

    next();
  };
