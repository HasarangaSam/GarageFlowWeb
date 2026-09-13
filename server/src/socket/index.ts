import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

import { verifyAccessToken } from "../utils/auth.js";

import type { ClientToServerEvents, ServerToClientEvents } from "./events.js";

import type { SocketData } from "./socket.js";

export const initializeSocket = (httpServer: HttpServer) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const clientBase = clientUrl.replace(/\/$/, "");

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.startsWith(clientBase) || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const accessToken = socket.handshake.auth?.accessToken;

      if (typeof accessToken !== "string" || !accessToken) {
        next(new Error("Authentication required"));

        return;
      }

      const payload = verifyAccessToken(accessToken);

      socket.data.user = {
        id: payload.userId,
        role: payload.role,
      };

      socket.data.tokenExpiresAt = payload.exp;

      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    const userRoom = `user:${user.id}`;

    socket.join(userRoom);

    console.log(`Socket connected: ${user.id}`);

    const tokenExpiresAt = socket.data.tokenExpiresAt;

    let tokenExpiryTimer: NodeJS.Timeout | undefined;

    if (tokenExpiresAt) {
      const expiresIn = tokenExpiresAt * 1000 - Date.now();

      if (expiresIn > 0) {
        tokenExpiryTimer = setTimeout(() => {
          socket.emit("token:expired");
        }, expiresIn);
      }
    }

    socket.on("disconnect", () => {
      if (tokenExpiryTimer) {
        clearTimeout(tokenExpiryTimer);
      }

      console.log(`Socket disconnected: ${user.id}`);
    });
  });

  return io;
};
