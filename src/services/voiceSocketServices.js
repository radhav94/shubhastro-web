


// import { io } from "socket.io-client";

// export const voiceSocket = io("http://192.168.12.90:3000", {
//   transports: ["websocket"],
//   autoConnect: false,
//   query: {
//     userId: "691da49c281243bd6345349b",
//     astrologerId: "692012fe836eaeb7310db199",
//   },
// });

// // Manually connect like Flutter
// voiceSocket.connect();

// voiceSocket.on("connect", () => {
//   console.log("Voice Socket Connected to test ", voiceSocket.id);
// });

// voiceSocket.on("disconnect", () => {
//   console.log("Voice Socket Disconnected");
// });

// voiceSocket.on("connect_error", (error) => {
//   console.log("Voice Socket Connect Error:", error.message);
// });

// voiceSocket.on("error", (err) => {
//   console.log("Voice Socket Error:", err);
// });



// voiceSocketServices.js
import { io } from "socket.io-client";

export const voiceSocket = io("http://192.168.12.90:3000", {
  transports: ["websocket"],
  autoConnect: false,
});

