import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
export const voiceSocket = io(BASE_URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

/* ================= 🔍 CALL EVENT LOGGER ================= */
const CALL_EVENTS = [
  "call:room",
  "call:accepted",
  "call:rejected",
  "call:ended",
  "call:canceled",
  "call:reconnected",
  "call:astrologer_accepted",
  "call:ring_timeout",
  "call:on_hold",
  "call:unavailable",
  "chat:room",
  "chat:accepted",
  "chat:rejected",
  "chat:ended",
  "chat:reconnected",
  "chat:astrologer_accepted",
  "chat:ring_timeout",
  "chat:on_hold",
  "chat:unavailable",
  "activity",
  "warning",
  "error",
  "message:recieved",
  "return_call_room",
  "live:astrologer_status",
  "live:blocked",
  "live:user_blocked",
  "live:report_submitted",
  "session:active_list",
  "session:canceled",
];

/* ================= 🔄 RECONNECTION STATE ================= */
// Track active sessions for automatic reconnection on socket reconnect
let activeCallSession = null;
let activeChatSession = null;
let isReconnecting = false;
let hasConnectedOnce = false;
let lastRecoverySocketId = null;

const hasActiveSessions = () => !!(activeCallSession || activeChatSession);

const resetRecoveryMarker = () => {
  lastRecoverySocketId = null;
};

const emitSessionRecovery = (trigger) => {
  if (!voiceSocket.connected) {
    console.log("[VoiceSocket] ⏭️ Skipping session recovery, socket is not connected");
    return;
  }

  if (!hasActiveSessions()) {
    console.log("[VoiceSocket] ⏭️ Skipping session recovery, no active sessions");
    isReconnecting = false;
    return;
  }

  if (lastRecoverySocketId === voiceSocket.id) {
    console.log("[VoiceSocket] ⏭️ Session recovery already emitted for socket:", voiceSocket.id);
    return;
  }

  console.log("[VoiceSocket] 🔄 Recovering active sessions after:", trigger);
  lastRecoverySocketId = voiceSocket.id;

  if (activeCallSession?.roomId) {
    console.log("[VoiceSocket] 📤 Emitting call:reconnect for room:", activeCallSession.roomId);
    voiceSocket.emit("call:reconnect", {
      roomId: activeCallSession.roomId,
      userId: activeCallSession.userId,
      astrologerId: activeCallSession.astrologerId,
      callType: activeCallSession.callType,
    });
  }

  if (activeChatSession?.roomId) {
    console.log("[VoiceSocket] 📤 Emitting chat:reconnect for room:", activeChatSession.roomId);
    voiceSocket.emit("chat:reconnect", {
      roomId: activeChatSession.roomId,
      userId: activeChatSession.userId,
      astrologerId: activeChatSession.astrologerId,
      callType: activeChatSession.callType || "chat",
    });
  }

  isReconnecting = false;
};

/**
 * Register an active call session for automatic reconnection
 * @param {Object} session - { roomId, userId, astrologerId, callType }
 */
export const registerCallSession = (session) => {
  activeCallSession = session;
  console.log("[VoiceSocket] 📝 Registered call session:", session?.roomId);
};

/**
 * Clear the active call session (call ended)
 */
export const clearCallSession = () => {
  activeCallSession = null;
  console.log("[VoiceSocket] 🗑️ Cleared call session");
};

/**
 * Register an active chat session for automatic reconnection
 * @param {Object} session - { roomId, userId, astrologerId, callType }
 */
export const registerChatSession = (session) => {
  activeChatSession = {
    ...session,
    callType: session?.callType || "chat",
  };
  console.log("[VoiceSocket] 📝 Registered chat session:", session?.roomId);
};

/**
 * Clear the active chat session (chat ended)
 */
export const clearChatSession = () => {
  activeChatSession = null;
  console.log("[VoiceSocket] 🗑️ Cleared chat session");
};

/**
 * Get current reconnection state
 */
export const getReconnectionState = () => ({
  isReconnecting,
  hasActiveCall: !!activeCallSession,
  hasActiveChat: !!activeChatSession,
});

// Log connection lifecycle
voiceSocket.on("connect", () => {
  console.log("[VoiceSocket] 🟢 Connected — id:", voiceSocket.id);

  if (!hasConnectedOnce) {
    hasConnectedOnce = true;
    lastRecoverySocketId = voiceSocket.id;
    return;
  }

  emitSessionRecovery(isReconnecting ? "socket reconnect" : "subsequent connect");
});

voiceSocket.on("disconnect", (reason) => {
  console.log("[VoiceSocket] 🔴 Disconnected — reason:", reason);

  resetRecoveryMarker();

  if (hasActiveSessions()) {
    isReconnecting = true;
    console.log("[VoiceSocket] ⏳ Will attempt session recovery on reconnect");
  }
});

let _lastVoiceConnectErrorAt = 0;

voiceSocket.io.on("reconnect_attempt", (attemptNumber) => {
  if (hasActiveSessions()) {
    isReconnecting = true;
  }
  console.log("[VoiceSocket] 🔄 Reconnect attempt:", attemptNumber);
});

voiceSocket.io.on("reconnect", (attemptNumber) => {
  _lastVoiceConnectErrorAt = 0;
  console.log("[VoiceSocket] ✅ Reconnected after", attemptNumber, "attempts");
});

voiceSocket.io.on("reconnect_error", (err) => {
  if (hasActiveSessions()) {
    isReconnecting = true;
  }
  const now = Date.now();
  if (now - _lastVoiceConnectErrorAt > 15000) {
    _lastVoiceConnectErrorAt = now;
    console.log("[VoiceSocket] ❌ Reconnect error:", err.message);
  }
});

voiceSocket.io.on("reconnect_failed", () => {
  console.log("[VoiceSocket] ❌ Reconnect failed after all attempts");
  isReconnecting = false;
  resetRecoveryMarker();
});

voiceSocket.on("connect_error", (err) => {
  if (hasActiveSessions()) {
    isReconnecting = true;
  }
  const now = Date.now();
  if (now - _lastVoiceConnectErrorAt > 15000) {
    _lastVoiceConnectErrorAt = now;
    console.log("[VoiceSocket] ❌ Connect error:", err.message);
  }
});

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (!hasActiveSessions()) return;

    console.log("[VoiceSocket] 🌐 Browser is back online");
    resetRecoveryMarker();
    isReconnecting = true;

    if (!voiceSocket.connected) {
      voiceSocket.connect();
      return;
    }

    emitSessionRecovery("browser online");
  });
}

// Log all call-related incoming events
CALL_EVENTS.forEach((event) => {
  voiceSocket.on(event, (data) => {
    console.log(`[VoiceSocket] 📥 ${event}`, JSON.stringify(data, null, 2));
  });
});

// Monkey-patch emit to log outgoing events
const _originalEmit = voiceSocket.emit.bind(voiceSocket);
voiceSocket.emit = (event, ...args) => {
  if (typeof event === "string" && !["ping", "pong"].includes(event)) {
    console.log(`[VoiceSocket] 📤 ${event}`, JSON.stringify(args[0], null, 2));
  }
  return _originalEmit(event, ...args);
};
