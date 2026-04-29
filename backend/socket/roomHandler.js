const { verifyToken } = require("../auth");
const { User, Message } = require("../db");

const onlineUsers = new Map();

function leaveRoom(io, socket, roomId) {
  const roomUsers = onlineUsers.get(roomId);
  if (!roomUsers) return;

  roomUsers.delete(socket.id);
  socket.leave(`room:${roomId}`);

  if (roomUsers.size === 0) {
    onlineUsers.delete(roomId);
  }

  io.to(`room:${roomId}`).emit("user:left", { socketId: socket.id });
}

function registerRoomHandler(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized: missing token"));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select("-password_hash -password");
      if (!user) {
        return next(new Error("Unauthorized: user not found"));
      }

      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", async (socket) => {

    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;

      const roomKey = String(roomId);
      socket.join(`room:${roomKey}`);

      if (!onlineUsers.has(roomKey)) {
        onlineUsers.set(roomKey, new Map());
      }

      const roomUsers = onlineUsers.get(roomKey);
      roomUsers.set(socket.id, {
        userId: String(socket.user._id),
        username: socket.user.username || socket.user.name || "User",
        avatar_color: socket.user.avatar_color || "#6C63FF",
        socketId: socket.id,
      });

      const otherUsers = Array.from(roomUsers.values()).filter((u) => u.socketId !== socket.id);
      socket.emit("room:state", otherUsers);

      socket.to(`room:${roomKey}`).emit("user:joined", roomUsers.get(socket.id));
    });

    socket.on("room:leave", ({ roomId }) => {
      if (!roomId) return;
      leaveRoom(io, socket, String(roomId));
    });

    socket.on("message:send", async ({ roomId, receiverId, body }) => {
      try {
        if (!roomId || !receiverId || !body || !String(body).trim()) return;

        const saved = await Message.create({
          room_id: roomId,
          sender_id: socket.user._id,
          receiver_id: receiverId,
          body: String(body).trim(),
        });

        const populatedMessage = await Message.findById(saved._id).populate(
          "sender_id",
          "_id username name avatar_color",
        );

        const roomUsers = onlineUsers.get(String(roomId));
        const receiverSocketEntry = roomUsers
          ? Array.from(roomUsers.entries()).find(
              ([, value]) => String(value.userId) === String(receiverId),
            )
          : null;

        socket.emit("message:receive", populatedMessage);

        if (receiverSocketEntry) {
          const [receiverSocketId] = receiverSocketEntry;
          io.to(receiverSocketId).emit("message:receive", populatedMessage);
        }
      } catch (_error) {
        // Ignore per-message failures to keep socket alive.
      }
    });

    socket.on("disconnect", () => {
      for (const [roomId, roomUsers] of onlineUsers.entries()) {
        if (roomUsers.has(socket.id)) {
          leaveRoom(io, socket, roomId);
        }
      }
    });
  });
}

module.exports = { registerRoomHandler };
