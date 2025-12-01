

import { io } from "socket.io-client";

export const voiceSocket = io("https://njsapi-shubhtalk.epicon.in/", {
  transports: ["websocket"],
  reconnection: true,
});

voiceSocket.on("connect", () => {
  console.log("🎧 Connected to Voice Server:", voiceSocket.id);
});



