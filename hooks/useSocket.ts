import { authClient } from "@/utils/auth-client";
import { useEffect, useRef } from "react";
import { useSocketStore } from "./useSocketStore";
import { Socket } from "socket.io-client";

export const useSocket = () => {
  const { initializeSocket, disconnectSocket } = useSocketStore(
    (state) => state
  );
  const { data: session } = authClient.useSession();
  const sessionRef = useRef<typeof session>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const onConnect = (socket: Socket) => {
    socket.emit("addUser", {
      userId: sessionRef.current?.user.id,
      socketId: socket.id,
    });
  };

  useEffect(() => {
    if (!session) {
      disconnectSocket();
      return;
    }

    initializeSocket({ onConnect });

    return () => {
      disconnectSocket();
    };
  }, [session]);
};
