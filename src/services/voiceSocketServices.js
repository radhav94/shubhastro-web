import { io } from "socket.io-client";

export const voiceSocket = io("https://njsapi-shubhtalk.epicon.in/", {
  transports: ["websocket"],
  autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
});

voiceSocket.on("connect", () => {
  console.log("🎧 Voice Socket Connected:", voiceSocket.id);
});
