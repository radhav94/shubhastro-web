import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL
export const voiceSocket = io(BASE_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

