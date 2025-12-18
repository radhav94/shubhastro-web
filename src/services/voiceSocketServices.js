import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL
export const voiceSocket = io("http://192.168.12.90:3000", {
  transports: ["websocket"],
  autoConnect: false,
});

