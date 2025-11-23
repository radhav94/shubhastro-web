// src/SocketConnector.jsx
import { useEffect } from "react";
import socketService from "./services/socketService";
import callServices from "./services/callServices";


export default function SocketConnector() {
  useEffect(() => {
    // CHAT SOCKET
    socketService.connect({
      onConnected: () => console.log("CHAT SOCKET CONNECTED"),
      onDisconnected: () => console.log("CHAT SOCKET DISCONNECTED"),
      onError: (err) => console.log("CHAT SOCKET ERROR", err),
    });

    // CALL SOCKET
    callServices.connect({
      onConnected: () => console.log("CALL SOCKET CONNECTED"),
      onDisconnected: () => console.log("CALL SOCKET DISCONNECTED"),
      onError: (err) => console.log("CALL SOCKET ERROR", err),
    });
  }, []);

  return null;
}
