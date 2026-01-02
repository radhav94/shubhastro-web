// socketService.js
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL
class SocketService {
  socket = null;

  connect({ onConnected, onDisconnected, onError, onWarn }) {
    this.socket = io(BASE_URL, {
      transports: ["websocket"],
      autoConnect: true,
      // reconnection: true,
      // reconnectionAttempts: 5,
      // reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      onConnected?.();
    });

    this.socket.on("disconnect", (reason) => {
      onDisconnected?.(reason);
    });

    this.socket.on("connect_error", (err) => {
      onError?.("Unable to connect to server");
    });

    this.socket.on("error", (err) => {
      onError?.(err.message || "Unknown error occurred");
    });
    this.socket.on("warning", (msg) => {
      onWarn?.(msg.message || "Warning");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
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

      this.socket.emit("chat:message", {
        sender: "user",
        kundliId,
        roomId,
        userId,
        astrologerId,
        message,
        type: "message"
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

    this.socket.on("message:recieved", (data) => {
      onMessage?.({
        sender: data.sender,
        message: data.message || data.response,
        dateTime: data.createdAt || new Date().toISOString(),
      });
    });

    this.socket.on("typing", (data) => {
      onTyping?.(data);
    });
  }
}

export default new SocketService();
