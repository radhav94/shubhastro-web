import { useEffect, useState } from "react";
import socketService from "../../../../../services/socketService";

export default function useChat({
  userId,
  astrologerId,
  roomId,
  isUserSide,
  kundliId,
}) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    socketService.connect({
      onConnected: () => {
        socketService.joinRoom({ roomId, userId, astrologerId });
      },
      onError: (errMsg) => setError(errMsg),
    });

    socketService.listenEvents({
      onMessage: (data) => {
        const isSenderUser = data.sender === userId;

        addMessage({
          text: data.message,
          sender: isSenderUser ? "user" : "astro",
          isSender: isSenderUser === isUserSide,
          time: formatTime(),
        });
      },

      onTyping: (data) => {
        if (data.sender !== userId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1200);
        }
      },
    });
  }, [roomId]);

  // USER SEND
  const sendMessage = (text) => {
    const res = socketService.sendMessage({
      message: text,
      roomId,
      userId,
      astrologerId,
      kundliId,
    });

    if (res?.error) {
      setError(res.error);
      return;
    }

    addMessage({
      text,
      sender: "user",
      isSender: isUserSide,
      time: formatTime(),
    });
  };

  // ASTRO SEND
  const astroReply = (text) => {
    const res = socketService.astrologerReplied({
      message: text,
      roomId,
      userId,
      astrologerId,
    });

    if (res?.error) {
      setError(res.error);
      return;
    }

    addMessage({
      text,
      sender: "astro",
      isSender: !isUserSide,
      time: formatTime(),
    });
  };

  //  typing emit
  const sendTyping = () => {
    socketService.sendTyping({ roomId, sender: userId });
  };

  return {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    sendTyping,
  };
}
