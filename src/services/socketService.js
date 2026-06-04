// socketService.js
import { io } from "socket.io-client";

class SocketService {
  socket = null;
  _lastConnectErrorAt = 0;

  connect({ onConnected, onDisconnected, onError, onWarn }) {
    this.socket = io("/", {
      transports: ["websocket"],
      autoConnect: true,
      path: "/main/socket.io",
    });

    this.socket.on("connect", () => {
      this._lastConnectErrorAt = 0;
      onConnected?.();
    });

    this.socket.on("disconnect", (reason) => {
      onDisconnected?.(reason);
    });

    this.socket.on("connect_error", () => {
      const now = Date.now();
      if (now - this._lastConnectErrorAt > 15000) {
        this._lastConnectErrorAt = now;
        onError?.("Unable to connect to server");
      }
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
  sendMessage({ roomId, userId, astrologerId, message, kundliId, type = "message" }) {
    try {
      if (!this.socket?.connected)
        throw new Error("Socket not connected, try again.");

      const payload = {
        sender: "user",
        kundliId,
        roomId,
        userId,
        astrologerId,
        message,
        type
      };

      this.socket.emit("chat:message", payload);

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

  // ⭐ TYPING ACTIVITY EVENT
  sendActivity({ roomId, activity, sender }) {
    if (this.socket?.connected) {
      this.socket.emit("activity:update", { roomId, activity, sender });
    }
  }

  // ⭐ LISTEN EVENTS (MESSAGE)
  listenEvents(callbacks) {
    const { onMessage } = callbacks;

    this.socket.on("message:recieved", (data) => {
      onMessage?.({
        sender: data.sender,
        message: data.message || data.response,
        dateTime: data.createdAt || new Date().toISOString(),
      });
    });
  }
}

export default new SocketService();
