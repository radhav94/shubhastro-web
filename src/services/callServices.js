// services/socketService.js
import { io } from "socket.io-client";

class CallSocketService {
  socket = null;

  connect({ onConnected, onDisconnected, onError }) {
    this.socket = io("https://njsapi-shubhtalk.epicon.in/", {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("📡 SOCKET CONNECTED:", this.socket.id);
      onConnected?.(this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED");
      onDisconnected?.();
    });

    this.socket.on("connect_error", onError);
    this.socket.on("error", onError);
  }

  /* ------------------------------------------------------ */
  /*                 EMIT EVENTS (SEND TO SERVER)           */
  /* ------------------------------------------------------ */

  // startCall(payload) {
  //   this.socket.emit("call_start", payload);
  //   this.socket.on('incoming_call', payload);
  //   console.log("payloadddd",payload)
  // }

  startCall(payload) {
  this.socket.emit("call_start", payload);

  this.socket.on("incoming_call", (data) => {
    console.log("📥 incoming_call →", data);
  });

  console.log("📤 start_call sent:", payload);
}


  receiveCall(payload) {
    console.log("📤 call_received →", payload);
    this.socket.emit("call_received", payload);
  }

  rejectCall(payload) {
    console.log("📤 reject_call →", payload);
    this.socket.emit("reject_call", payload);
  }

  endCall(payload) {
    console.log("📤 call_end →", payload);
    this.socket.emit("call_end", payload);
  }

  /* ------------------------------------------------------ */
  /*                LISTEN EVENTS (SERVER → CLIENT)         */
  /* ------------------------------------------------------ */

  onCallStart(callback) {
    this.socket.on("call_start", (data) => {
      console.log("📥 call_start (incoming) →", data);
      callback?.(data);
    });
  }

  onCallReceived(callback) {
    this.socket.on("call_received", (data) => {
      console.log("📥 call_received →", data);
      callback?.(data);
    });
  }

  onCallRejected(callback) {
    this.socket.on("reject_call", (data) => {
      console.log("📥 reject_call →", data);
      callback?.(data);
    });
  }

  onCallEnd(callback) {
    this.socket.on("call_end", (data) => {
      console.log("📥 call_end →", data);
      callback?.(data);
    });
  }

  /* ------------------------------------------------------ */
  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}

export default new CallSocketService();
