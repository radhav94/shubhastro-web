import { io } from "socket.io-client";

export const voiceSocket = io("http://192.168.12.90:3000", {
  transports: ["websocket"],
  autoConnect: false,
});

