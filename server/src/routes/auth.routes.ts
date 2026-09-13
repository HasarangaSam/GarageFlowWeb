import { Router } from "express";

import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { asyncHandler } from "../utils/async-handler.js";

import { redisRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

const loginRateLimit = redisRateLimit({
  keyPrefix: "login",
  limit: 5,
  windowSeconds: 60,
});

const refreshRateLimit = redisRateLimit({
  keyPrefix: "refresh",
  limit: 10,
  windowSeconds: 60,
});

router.post("/register", asyncHandler(register));

router.post("/login", loginRateLimit, asyncHandler(login));

router.post("/refresh", refreshRateLimit, asyncHandler(refresh));

router.post("/logout", asyncHandler(logout));

router.get("/me", requireAuth, asyncHandler(me));

export default router;
