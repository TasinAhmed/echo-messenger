import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { InferSelectModel } from "drizzle-orm";
import { message as msg } from "./db/schemas";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const UserToSocket = new Map<string, string[]>();
const SocketToUser = new Map<string, string>();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on(
      "addUser",
      ({ userId, socketId }: { userId: string; socketId: string }) => {
        SocketToUser.set(socketId, userId);
        if (UserToSocket.has(userId)) {
          UserToSocket.get(userId)?.push(socketId);
        } else {
          UserToSocket.set(userId, [socketId]);
        }
        console.log(UserToSocket, SocketToUser);
      }
    );

    socket.on("disconnect", () => {
      const socketId = socket.id;
      const userId = SocketToUser.get(socketId);
      if (!userId) return;

      SocketToUser.delete(socketId);

      const sockets = UserToSocket.get(userId)?.filter(
        (str) => str !== socketId
      );
      if (sockets && sockets.length > 0) {
        UserToSocket.set(userId, sockets);
      } else {
        UserToSocket.delete(userId);
      }

      console.log("Socket disconnected:", socketId, UserToSocket, SocketToUser);
    });

    socket.on(
      "message",
      ({
        message,
        userIds,
      }: {
        message: InferSelectModel<typeof msg>;
        userIds: string[];
      }) => {
        const socketIds = [];
        for (const u of userIds) {
          const connections = UserToSocket.get(u);
          if (!connections) continue;

          for (const connection of connections) {
            if (connection !== socket.id) {
              socketIds.push(connection);
            }
          }
        }
        io.to(socketIds).emit("message", message);
      }
    );
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
