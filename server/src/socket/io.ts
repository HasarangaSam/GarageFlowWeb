import type { Server } from "socket.io";

import type { ClientToServerEvents, ServerToClientEvents } from "./events.js";

import type { SocketData } from "./socket.js";

type GarageIO = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: GarageIO | undefined;

export const setSocketIO = (socketServer: GarageIO) => {
  io = socketServer;
};

export const getSocketIO = (): GarageIO => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
