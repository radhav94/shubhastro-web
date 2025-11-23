import { io } from "socket.io-client";

class SocketService {
  socket = null;
  isConnected = false;

  connect({ onConnected, onDisconnected, onError }) {
    this.socket = io("https://njsapi-shubhtalk.epicon.in/", {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("🔌 SOCKET CONNECTED:", this.socket.id);
      onConnected?.(this.socket.id);
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      onDisconnected?.();
    });

    this.socket.on("connect_error", onError);
    this.socket.on("error", onError);
  }

  joinRoom({ roomId, userId, astrologerId }) {
    const payload = { roomId, userId, astrologerId };
    console.log("🚪 JOIN ROOM →", payload);
    this.socket.emit("joinRoom", payload);
  }

  sendMessage({ message, roomId, userId, astrologerId }) {
    const payload = { message, roomId, userId, astrologerId };
    console.log("📤 MESSAGE SENT:", payload);
    this.socket.emit("send_message", payload);
  }

  listenMessages(callback) {
    this.socket.on("receiveMessage", (data) => {
      console.log("📩 NEW MESSAGE:", data);
      callback?.(data);
    });
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}

export default new SocketService();
