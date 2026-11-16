const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { createConnection } = require("./queue/config");
const { CHANNEL } = require("./events/publisher");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  // Authenticate every connection with the same JWT used by the REST API
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error("Missing token"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: Number(payload.sub), role: payload.role };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // One private room per user: you only receive your own events
    socket.join(`user:${socket.user.id}`);
  });

  // Receive events from the worker (via Redis) and forward them to the right room.
  // A subscribing connection can't run other commands, so it needs its own.
  const subscriber = createConnection();
  subscriber.on("error", (err) => console.error("Socket subscriber:", err.message));
  subscriber.subscribe(CHANNEL).catch((err) => {
    console.error("Could not subscribe to events:", err.message);
  });

  subscriber.on("message", (channel, message) => {
    try {
      const { userId, data } = JSON.parse(message);
      io.to(`user:${userId}`).emit("submission:update", data);
    } catch (err) {
      console.error("Bad event message:", err.message);
    }
  });

  return io;
}

module.exports = { initSocket };