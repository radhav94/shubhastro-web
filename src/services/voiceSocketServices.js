import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
export const voiceSocket = io(BASE_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

/* ================= 🔍 CALL EVENT LOGGER ================= */
const CALL_EVENTS = [
  "call:room",
  "call:accepted",
  "call:rejected",
  "call:ended",
  "call:canceled",
  "call:reconnected",
  "chat:room",
  "chat:accepted",
  "chat:rejected",
  "chat:ended",
  "chat:reconnected",
  "activity",
  "warning",
  "error",
  "message:recieved",
  "return_call_room",
];

// Log connection lifecycle
voiceSocket.on("connect", () => {
  console.log("[VoiceSocket] 🟢 Connected — id:", voiceSocket.id);
});
voiceSocket.on("disconnect", (reason) => {
  console.log("[VoiceSocket] 🔴 Disconnected — reason:", reason);
});
voiceSocket.on("connect_error", (err) => {
  console.log("[VoiceSocket] ❌ Connect error:", err.message);
});

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

