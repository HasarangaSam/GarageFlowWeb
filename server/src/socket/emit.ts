import { getSocketIO } from "./io.js";

export const emitJobCreated = (userId: string, job: unknown) => {
  getSocketIO().to(`user:${userId}`).emit("job:created", job);
};

export const emitJobAssigned = (userId: string, job: unknown) => {
  getSocketIO().to(`user:${userId}`).emit("job:assigned", job);
};

export const emitJobStatusChanged = (userId: string, job: unknown) => {
  getSocketIO().to(`user:${userId}`).emit("job:status_changed", job);
};

export const emitJobCompleted = (userId: string, job: unknown) => {
  getSocketIO().to(`user:${userId}`).emit("job:completed", job);
};

export const emitPaymentReceived = (userId: string, payment: unknown) => {
  getSocketIO().to(`user:${userId}`).emit("payment:received", payment);
};
