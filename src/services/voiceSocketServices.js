import { io } from "socket.io-client";
import { SOCKET_URL, SOCKET_PATH } from "../utils/apiConfig";
import { markInitiated, claimRoom } from "../utils/tabSession";
import { getGuestId } from "../utils/guestId";
import Toast from "../component/toast";

export const voiceSocket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  path: SOCKET_PATH,
  auth: (cb) => {
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
    if (token) {
      cb({ token });
    } else {
      // Guest user — no token, self-declare with persistent UUID
      cb({ userId: getGuestId(), role: "GUEST" });
    }
  },
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
  // WhatsApp-style chat protocol (server → client)
  "message:ack",
  "message:received",
  "message:status",
  "message:read_ack",
  "message:undelivered_batch",
  "message:starred",
  "message:unstarred",
  "return_call_room",
  "live:astrologer_status",
  "live:blocked",
  "live:user_blocked",
  "live:report_submitted",
  "session:active_list",
];

/* ================= 🔄 RECONNECTION STATE ================= */
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

    if (hasActiveSessions()) {
      emitSessionRecovery("browser online");
    }
  });
}

// Log all call-related incoming events
CALL_EVENTS.forEach((event) => {
  voiceSocket.on(event, (data) => {
    console.log(`[VoiceSocket] 📥 ${event}`, JSON.stringify(data, null, 2));
  });
});

// Suppress CONTENT_BLOCKED errors globally — they are not session/connection errors
// and should never cause any component to reset call/chat state
// We still show a toast so the user knows their message was blocked
const _originalOn = voiceSocket.on.bind(voiceSocket);
voiceSocket.on = (event, fn) => {
  if (event === "error") {
    return _originalOn(event, (data) => {
      if (data?.code === "CONTENT_BLOCKED" || data?.message?.includes?.("inappropriate language")) {
        console.log("[VoiceSocket] 🚫 Suppressed CONTENT_BLOCKED error from propagating to components");
        Toast.error(data.message || "Message blocked due to inappropriate content.");
        return;
      }
      fn(data);
    });
  }
  return _originalOn(event, fn);
};

// Monkey-patch emit to log outgoing events
const _originalEmit = voiceSocket.emit.bind(voiceSocket);
voiceSocket.emit = (event, ...args) => {
  if (typeof event === "string" && !["ping", "pong"].includes(event)) {
    console.log(`[VoiceSocket] � ${event}`, JSON.stringify(args[0], null, 2));
  }

  // Multi-tab ring scoping: remember that THIS tab initiated the request so
  // only this tab reacts to the (broadcast) astrologer_accepted / ring events.
  if (event === "call:initiate") {
    markInitiated(args[0]?.type || "audio");
  } else if (event === "chat:initiate") {
    markInitiated("chat");
  }

  return _originalEmit(event, ...args);
};

// Bind the server-assigned roomId to this tab as soon as the room is created.
// `call:room` / `chat:room` is the direct response to this tab's initiate, so
// only the initiating tab (which has a pending intent) will claim it.
voiceSocket.on("call:room", (data) => {
  if (data?.roomId) claimRoom(data.roomId, data?.type || "audio");
});
voiceSocket.on("chat:room", (data) => {
  if (data?.roomId) claimRoom(data.roomId, "chat");
});

/* ================= WHATSAPP-STYLE CHAT: OFFLINE DELIVERY ================= */
// When this client reconnects after being offline, the server pushes all
// messages that were sent while we were away via `message:undelivered_batch`.
// We MUST confirm delivery for them immediately (guide §8) so the sender's
// ticks advance to ✓✓. This is a global concern — it must fire regardless of
// which page is mounted — so it lives here at the socket-service level.
//
// The per-room chat UI (useChatWindow) separately listens to the same event to
// render the messages; this handler only handles the delivery ACK side-effect.
voiceSocket.on("message:undelivered_batch", (data) => {
  const messages = data?.messages || [];
  if (!messages.length) return;

  // Group message ids by room, then confirm delivery per room.
  const byRoom = messages.reduce((acc, msg) => {
    const roomId = msg?.roomId;
    const id = msg?._id || msg?.messageId;
    if (!roomId || !id) return acc;
    (acc[roomId] = acc[roomId] || []).push(id);
    return acc;
  }, {});

  Object.entries(byRoom).forEach(([roomId, messageIds]) => {
    if (!messageIds.length) return;
    console.log(
      "[VoiceSocket] 📦 undelivered_batch → confirming delivery for",
      messageIds.length,
      "message(s) in room",
      roomId,
    );
    voiceSocket.emit("message:delivered", { roomId, messageIds });
  });
});

/* ============ WHATSAPP-STYLE CHAT: LIVE DELIVERY CONFIRMATION ============ */
// A live message the other party sends arrives via `message:received` (guide
// §3/§4). The recipient MUST immediately emit `message:delivered` so the
// sender's tick advances to ✓✓ (delivered).
//
// The per-room chat UI (useChatWindow) already confirms delivery when the chat
// screen is mounted, but a message can arrive while the customer is on ANY
// other page — that's the case where only the notification banner shows. In
// that situation nothing was confirming delivery, so the sender's tick stalled
// at ✓ (sent). This global handler closes that gap: it fires regardless of
// which page is mounted. Delivery ACKs are idempotent server-side, so the
// occasional double-confirm (global + mounted chat window) is harmless.
//
// We only confirm delivery for the OTHER party's messages — never for the echo
// of our own sent message.
//
// IMPORTANT: the server currently pushes the LEGACY `message:recieved` (typo)
// event to off-screen clients (it's what drives the global notification
// banner), and only sometimes the structured `message:received`. We therefore
// confirm delivery on BOTH so the sender's tick advances even when only the
// legacy event fires. A short-lived dedupe set prevents a double emit when both
// events fire for the same message (harmless anyway — the server ACK is
// idempotent — but avoids redundant traffic).
const confirmedDeliveryGlobal = new Set();

// Resolve the room id for an incoming message. The structured event carries
// `roomId`, but the legacy `message:recieved` payload sometimes omits it — fall
// back to the active chat session and finally the persisted chat state so a
// message received while off the chat screen can still be confirmed.
const resolveRoomId = (data) => {
  if (data?.roomId) return data.roomId;
  if (activeChatSession?.roomId) return activeChatSession.roomId;
  try {
    const persisted = JSON.parse(localStorage.getItem("shubhtalk_active_chat") || "null");
    if (persisted?.roomId) return persisted.roomId;
  } catch {
    /* ignore malformed persisted state */
  }
  return null;
};

const confirmDeliveryFromIncoming = (data) => {
  if (!data) return;
  const role = localStorage.getItem("shubhtalk_role");
  const myRole = role === "ASTROLOGER" ? "astrologer" : "user";
  // Skip the echo of our own message; only ACK messages from the other party.
  if (data.sender === myRole) return;

  const roomId = resolveRoomId(data);
  const messageId = data.messageId || data._id;

  // Diagnostic: surfaces the actual payload shape so we can see WHY a delivery
  // ACK is/ isn't emitted for a given incoming message.
  console.log("[VoiceSocket] 📨 incoming message payload:", {
    sender: data.sender,
    roomId,
    messageId,
    hasRoomId: !!data.roomId,
    keys: Object.keys(data || {}),
  });

  if (!roomId || !messageId) {
    console.warn(
      "[VoiceSocket] ⚠️ cannot confirm delivery — missing",
      !roomId ? "roomId" : "",
      !messageId ? "messageId" : "",
    );
    return;
  }

  // Dedupe repeat emits for the same message id.
  if (confirmedDeliveryGlobal.has(messageId)) return;
  confirmedDeliveryGlobal.add(messageId);

  console.log(
    "[VoiceSocket] 📨 incoming message → confirming delivery for message",
    messageId,
    "in room",
    roomId,
  );
  voiceSocket.emit("message:delivered", { roomId, messageIds: [messageId] });
};

voiceSocket.on("message:received", confirmDeliveryFromIncoming);
voiceSocket.on("message:recieved", confirmDeliveryFromIncoming);
