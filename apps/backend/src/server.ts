import http from "http";
import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { SocketServer } from "./realtime/socketServer";

const PORT = parseInt(process.env.PORT || "3001", 10);

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
SocketServer.init(server);

server.listen(PORT, () => {
  console.log(`[ContextFlow Backend] Server running on http://localhost:${PORT}`);
  console.log(`[ContextFlow Backend] Socket.IO ready on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await SocketServer.close();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

