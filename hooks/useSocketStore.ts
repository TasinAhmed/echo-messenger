import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface InitializeSocketType {
  onConnect: (socket: Socket) => void;
}

interface SocketStoreType {
  socket: Socket | null;
  initializeSocket: ({ onConnect }: InitializeSocketType) => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketStoreType>((set, get) => ({
  socket: null,
  initializeSocket: ({ onConnect }) => {
    const connected = get().socket;

    if (connected) return;

    const socket = io();

    socket.on("connect", () => onConnect(socket));

    socket._cleanup = () => {
      socket.off("connect", () => onConnect(socket));
    };

    set({ socket });
  },
  disconnectSocket: () => {
    const socket = get().socket;

    if (!socket) return;

    socket._cleanup();
    socket.disconnect();
    set({ socket: null });
  },
}));
