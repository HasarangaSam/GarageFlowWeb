import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

// Singleton socket reference — shared across renders
let socketInstance: Socket | null = null;

/**
 * Creates (or reuses) the Socket.IO connection authenticated with the current
 * access token. Should be called once inside DashboardLayout so the socket is
 * alive for the entire authenticated session.
 *
 * The hook automatically disconnects and cleans up when the component unmounts
 * (i.e. the user logs out and DashboardLayout unmounts).
 */
export function useSocket(): Socket | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      // No token — make sure any old socket is closed
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      socketRef.current = null;
      return;
    }

    // Re-use an existing connected socket when the token hasn't changed
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    // Create a new connection
    const socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { accessToken },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketInstance = socket;
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketInstance = null;
      socketRef.current = null;
    };
  }, [accessToken]);

  return socketRef.current;
}
