import "socket.io-client";

declare module "socket.io-client" {
  interface Socket {
    _cleanup: () => void;
  }
}
