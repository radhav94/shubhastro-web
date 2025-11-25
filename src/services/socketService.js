// socketService.js
import { io } from "socket.io-client";

class SocketService {
  socket = null;

  connect({ onConnected, onDisconnected, onError }) {
    this.socket = io("http://192.168.12.114:3000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      console.log("🔌 SOCKET CONNECTED:", this.socket.id);
      onConnected?.();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ SOCKET DISCONNECTED:", reason);
      onDisconnected?.(reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("🚨 CONNECTION ERROR:", err.message);
      onError?.("Unable to connect to server");
    });

    this.socket.on("error", (err) => {
      console.error("⚠️ SOCKET ERROR:", err);
      onError?.(err.message || "Unknown error occurred");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("🔌 SOCKET FORCE DISCONNECTED");
    }
  }

  joinRoom({ roomId, userId, astrologerId }) {
    this.socket.emit(
      "joinRoom",
      { roomId, userId, astrologerId },
      (response) => {
        if (response?.error) {
          console.error("JOIN FAILED:", response.error);
        } else {
          console.log("ROOM JOINED SUCCESSFULLY");
        }
      }
    );
  }

  // USER SEND
  sendMessage({ roomId, userId, astrologerId, message, kundliId }) {
    try {
      if (!this.socket?.connected)
        throw new Error("Socket not connected, try again.");

      this.socket.emit("user_sent_message", {
        sender: userId,
        kundliId,
        roomId,
        userId,
        astrologerId,
        message,
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ASTRO SEND
  astrologerReplied({ roomId, userId, astrologerId, message }) {
    try {
      if (!this.socket?.connected)
        throw new Error("Socket not connected, try again.");

      this.socket.emit("astrologer_sent_message", {
        sender: astrologerId,
        roomId,
        userId,
        astrologerId,
        message,
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ⭐ TYPING EVENT
  sendTyping({ roomId, sender }) {
    if (this.socket?.connected) {
      this.socket.emit("typing", { roomId, sender });
    }
  }

  // ⭐ LISTEN EVENTS (MESSAGE + TYPING)
  listenEvents(callbacks) {
    const { onMessage, onTyping } = callbacks;

    this.socket.on("user_received_message", (data) => {
      onMessage?.({
        sender: data.sender,
        message: data.message || data.response,
      });
    });

    this.socket.on("astrologer_received_message", (data) => {
      onMessage?.({
        sender: data.sender,
        message: data.message || data.response,
      });
    });

    this.socket.on("typing", (data) => {
      onTyping?.(data);
    });
  }
}

export default new SocketService();
