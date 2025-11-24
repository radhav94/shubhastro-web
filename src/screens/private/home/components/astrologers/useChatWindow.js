import { useEffect, useState } from "react";
import socketService from "../../../../../services/socketService";

export default function useChat({ astrologerId, roomId, userId }) {
  const [messages, setMessages] = useState([]);

  // 🕒 Helper → Format time like “10:21 PM”
  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Append any message into local UI
  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    socketService.connect({
      onConnected: () => {
        console.log("🔥 Connected!");
        socketService.joinRoom({ roomId, userId, astrologerId });
      }
    });

    // LISTEN FOR MESSAGES
    socketService.listenMessages((data) => {
      const isUserSender = data.sender === userId;

      addMessage({
        text: data.message,
        sender: isUserSender ? "user" : "astro",
        isSender: isUserSender,
        time: formatTime(),
      });
    });
  }, [roomId]);

  // USER sends message
  const sendMessage = (text) => {
    socketService.sendMessage({
      message: text,
      roomId,
      userId,
      astrologerId,
    });

    addMessage({
      text,
      sender: "user",
      isSender: true,
      time: formatTime(),
    });
  };

  // ASTRO replies
  const astroReply = (text) => {
    socketService.astrologerReplied({
      message: text,
      roomId,
      userId,
      astrologerId,
    });

    addMessage({
      text,
      sender: "astro",
      isSender: true,
      time: formatTime(),
    });
  };

  return {
    messages,
    sendMessage,
    astroReply,
  };
}
