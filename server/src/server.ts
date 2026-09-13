import http from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

import { prisma } from "./config/database.js";
import { redis, isRedisConfigured } from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

import customerRoutes from "./routes/customer.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import repairJobRoutes from "./routes/repair-job.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import partRoutes from "./routes/part.routes.js";
import jobPartRoutes from "./routes/job-part.routes.js";

import { initializeSocket } from "./socket/index.js";
import { setSocketIO } from "./socket/io.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

// Trust reverse proxy headers (Render, Heroku, Cloudflare)
app.set("trust proxy", 1);

app.use(helmet());

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const clientBase = clientUrl.replace(/\/$/, "");
const allowedOrigins = [
  clientBase,
  `${clientBase}/`,
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    let redisStatus = "disabled";
    if (isRedisConfigured) {
      try {
        const ping = await redis.ping();
        redisStatus = ping === "PONG" ? "connected" : "unhealthy";
      } catch {
        redisStatus = "disconnected";
      }
    }

    res.json({
      success: true,
      message: "GarageFlow API is healthy",
      services: {
        database: "connected",
        redis: redisStatus,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/jobs", repairJobRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/invoices", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/jobs", jobPartRoutes);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/users", userRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = initializeSocket(httpServer);

setSocketIO(io);

httpServer.listen(PORT, () => {
  console.log(`GarageFlow server running on port ${PORT}`);
});
