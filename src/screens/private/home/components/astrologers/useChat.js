// /hooks/useChat.js

import { useEffect, useState } from "react";
// import socketService from "../services/socketService";
import axios from "axios";
import socketService from "../../../../../services/socketService";

export default function useChat({ astrologerId, userId }) {
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);

  // helper to add local msgs
  const appendLocalMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  // FETCH ROOM
  const fetchRoom = async () => {
    const res = await axios.post("https://njsapi-shubhtalk.epicon.in/api/chat/room/create", {
      userId,
      astrologerId,
    });

    const id = res.data?.data;
    setRoomId(id);

    socketService.joinRoom({
      roomId: id,
      userId,
      astrologerId,
    });
  };

  // SOCKET CONNECT
  useEffect(() => {
    socketService.connect({
      onConnected: () => console.log("React connected"),
      onDisconnected: () => console.log("React disconnected"),
      onError: console.log,
    });

    // LISTEN MESSAGES
    socketService.listenMessages((data) => {
      appendLocalMessage({ sender: "astro", text: data.message });
    });
  }, []);

  // SEND MESSAGE
  const sendMessage = (text) => {
    if (!roomId) return;
    socketService.sendMessage({
      message: text,
      roomId,
      userId,
      astrologerId,
    });
  };

  return { messages, sendMessage, fetchRoom, appendLocalMessage };
}
