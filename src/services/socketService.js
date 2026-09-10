// socketService.js
// Thin wrapper around voiceSocket — no separate socket connection.
// All operations go through the shared voiceSocket instance.
import { voiceSocket } from "./voiceSocketServices";

class SocketService {
  _hasShownConnectError = false;

  /**
   * connect() is a no-op for socket creation. voiceSocket is already
   * connected by ChatContext/CallContext. Fires onConnected when ready.
   * Returns a cleanup function to remove listeners on unmount.
   */
  connect({ onConnected, onDisconnected, onError, onWarn }) {
    if (window.self !== window.top) return () => {};

    if (voiceSocket.connected) {
      this._hasShownConnectError = false;
      onConnected?.();
      if (onDisconnected) voiceSocket.on("disconnect", onDisconnected);
      return () => {
        if (onDisconnected) voiceSocket.off("disconnect", onDisconnected);
      };
    }

    const handleConnect = () => {
      this._hasShownConnectError = false;
      onConnected?.();
    };

    const handleConnectError = () => {
      // Silently handle — voiceSocket manages reconnection
      console.warn("[socketService] connect_error — server may be restarting");
    };

    const handleError = (err) => {
      onError?.(err?.message || "Unknown error occurred");
    };

    const handleWarning = (msg) => {
      onWarn?.(msg?.message || "Warning");
    };

    voiceSocket.on("connect", handleConnect);
    voiceSocket.on("connect_error", handleConnectError);
    voiceSocket.on("error", handleError);
    voiceSocket.on("warning", handleWarning);
    if (onDisconnected) voiceSocket.on("disconnect", onDisconnected);

    return () => {
      voiceSocket.off("connect", handleConnect);
      voiceSocket.off("connect_error", handleConnectError);
      voiceSocket.off("error", handleError);
      voiceSocket.off("warning", handleWarning);
      if (onDisconnected) voiceSocket.off("disconnect", onDisconnected);
    };
  }

  disconnect() {
    // No-op — voiceSocket lifecycle is managed by contexts
    this._hasShownConnectError = false;
  }

  get socket() {
    return voiceSocket;
  }

  isConnected() {
    return voiceSocket.connected;
  }

  // USER SEND
  sendMessage({ roomId, userId, astrologerId, message, kundliId, type = "message", replyToId = null }) {
    try {
      if (!voiceSocket.connected)
        throw new Error("Socket not connected, try again.");

      voiceSocket.emit("chat:message", {
        sender: "user",
        kundliId,
        roomId,
        userId,
        astrologerId,
        message,
        type,
        ...(replyToId ? { replyToId } : {}),
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ASTRO SEND
  astrologerReplied({ roomId, userId, astrologerId, message }) {
    try {
      if (!voiceSocket.connected)
        throw new Error("Socket not connected, try again.");

      voiceSocket.emit("astrologer_sent_message", {
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

  // TYPING ACTIVITY
  sendActivity({ roomId, activity, sender }) {
    if (voiceSocket.connected) {
      voiceSocket.emit("activity:update", { roomId, activity, sender });
    }
  }
}

export default new SocketService();
