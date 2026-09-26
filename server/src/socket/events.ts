import type { Notification } from "../generated/prisma/client.js";

export interface ServerToClientEvents {
  "token:expired": () => void;

  "dashboard:updated": () => void;

  "job:created": (job: unknown) => void;

  "job:assigned": (job: unknown) => void;

  "job:status_changed": (job: unknown) => void;

  "job:completed": (job: unknown) => void;

  "inventory:low": (notification: Notification) => void;

  "payment:received": (payment: unknown) => void;

  "notification:new": (notification: Notification) => void;
}

export interface ClientToServerEvents {
  ping: () => void;
}
