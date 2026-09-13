import type { Socket } from "socket.io";

import type { ClientToServerEvents, ServerToClientEvents } from "./events.js";

export interface SocketData {
  user: {
    id: string;
    role: string;
  };

  tokenExpiresAt?: number;
}

export type GarageSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
