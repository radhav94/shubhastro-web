import { io } from "socket.io-client";

class SocketService {
  socket = null;

  connect({ onConnected, onDisconnected, onError }) {
    this.socket = io("http://192.168.12.114:3000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("🔌 SOCKET CONNECTED", this.socket.id);
      onConnected?.();
    });

    this.socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED");
      onDisconnected?.();
    });

    this.socket.on("connect_error", onError);
  }

  joinRoom({ roomId, userId, astrologerId }) {
    console.log("🚪 JOIN ROOM →", { roomId, userId, astrologerId });
    this.socket.emit("joinRoom", { roomId, userId, astrologerId });
  }

  sendMessage({ roomId, userId, astrologerId, message }) {
    this.socket.emit("send_message", {
      message,
      roomId,
      userId,
      astrologerId,
    });
  }

  astrologerReplied({ roomId, userId, astrologerId, message }) {
    this.socket.emit("astrologer_replied", {
      message,
      roomId,
      userId,
      astrologerId,
    });
  }

  listenMessages(callback) {
    this.socket.on("receiveMessage", (data) => {
      console.log("📩 RECEIVED:", data);
      callback?.(data);
    });
  }
}

export default new SocketService();
