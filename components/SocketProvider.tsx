"use client";

import { useSocket } from "@/hooks/useSocket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}
