// voiceSocketService.js
import { io } from "socket.io-client";

class VoiceSocketService {
  socket = null;

  connect({ onConnected, onDisconnected, onError } = {}) {
    this.socket = io("http://192.168.12.114:3000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      // reconnectionAttempts: 5,
      // reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      console.log("🎧 VOICE SOCKET CONNECTED:", this.socket.id);
      onConnected?.();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🎧 VOICE SOCKET DISCONNECTED:", reason);
      onDisconnected?.(reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("🚨 VOICE CONNECT ERROR:", err.message);
      onError?.("Unable to connect to Voice server");
    });

    this.socket.on("error", (err) => {
      console.error("⚠️ VOICE SOCKET ERROR:", err);
      onError?.(err.message || "Unknown voice error");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("🎧 VOICE SOCKET FORCE DISCONNECTED");
    }
  }

  /***********************
   * JOIN ROOM FOR CALL SIGNALING
   ************************/
  joinRoom({ roomId, userId, astrologerId }, callback) {
    if (!this.socket) {
      console.error("❌ VOICE SOCKET NOT CONNECTED");
      return;
    }

    console.log("🎧 JOIN VOICE ROOM:", roomId, userId, astrologerId);

    this.socket.emit(
      "joinRoom",
      { roomId, userId, astrologerId },
      (response) => {
        if (response?.error) {
          console.error("JOIN VOICE ROOM FAILED:", response.error);
        } else {
          console.log("✅ VOICE ROOM JOINED SUCCESSFULLY");
        }
        callback?.(response);
      }
    );
  }

  /***********************
   * USER → START CALL
   ************************/

  startCall({ roomId, userId, astrologerId, channelName, uid, startTime }) {
    console.log("📞 Start Call Payload:", {
      roomId,
      userId,
      astrologerId,
      channelName,
      uid,
    });

    try {
      console.log("helloooooooo");
      if (!this.socket?.connected) throw new Error("Socket not connected");

      this.socket.emit("call_start", {
        roomId,
        userId,
        astrologerId,
        channelName,
        uid,
        startTime:"2025-11-26T12:00:00.000+00:00",
      });

      return { success: true };
    } catch (error) {
      console.error("❌ CALL START ERROR:", error);
      return { error: error.message };
    }
  }

  /***********************
   * ASTRO → ACCEPT CALL
   ************************/
  markCallReceived({ roomId }) {
    this.socket.emit("call_received", { roomId });
  }

  /***********************
   * REJECT CALL
   ************************/
  rejectCall({ roomId }) {
    this.socket.emit("call_rejected", { roomId });
  }

  /***********************
   * END CALL
   ************************/
  endCall({ roomId }) {
    this.socket.emit("call_ended", { roomId });
  }

  /***********************
   * EVENT LISTENERS
   ************************/
  listenEvents(callbacks = {}) {
    const {
      onIncomingCall,
      onCallAccepted,
      onCallRejected,
      onCallBusy,
      onCallEnded,
      onMissedCall,
    } = callbacks;

    this.socket.on("incoming_call", (data) => {
      console.log("📳 INCOMING CALL DATA:", data);
      onIncomingCall?.(data);
    });

    this.socket.on("call_accepted", (data) => {
      console.log("🟢 CALL ACCEPTED:", data);
      onCallAccepted?.(data);
    });

    this.socket.on("call_rejected", (data) => {
      console.log("❌ CALL REJECTED:", data);
      onCallRejected?.(data);
    });

    this.socket.on("call_busy", (data) => {
      console.log("☎️ CALL BUSY:", data);
      onCallBusy?.(data);
    });

    this.socket.on("call_ended", (data) => {
      console.log("🔴 CALL ENDED:", data);
      onCallEnded?.(data);
    });

    this.socket.on("call_missed", (data) => {
      console.log("⌛ MISSED CALL:", data);
      onMissedCall?.(data);
    });
  }

  /***********************
   * REMOVE ALL LISTENERS
   ************************/
  removeListeners() {
    [
      "incoming_call",
      "call_accepted",
      "call_rejected",
      "call_busy",
      "call_ended",
      "call_missed",
    ].forEach((event) => this.socket.off(event));
  }
}

export default new VoiceSocketService();
