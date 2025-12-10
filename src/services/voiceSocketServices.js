import { io } from "socket.io-client";

export const voiceSocket = io("https://njsapi-shubhtalk.epicon.in/", {
  transports: ["websocket"],
  autoConnect: false,
});

