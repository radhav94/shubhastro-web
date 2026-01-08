import { useEffect, useState } from "react";
import socketService from "../../services/socketService";
import { voiceSocket } from "../../services/voiceSocketServices";
import { Toast } from "../index";

export const useVideoCallChat = ({ userId, astrologerId, roomId, kundliId, isActive, astrologerName }) => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  // const [isTyping, setIsTyping] = useState(false);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    if (!roomId || !userId || !astrologerId || !isActive) return;

    socketService.connect({
      onConnected: () => {
        console.log("Video call chat connected");
        
        // Send initial messages only once when chat connects
        if (!hasInitialized && kundliId) {
          setHasInitialized(true);
          
          // Send greeting message
          setTimeout(() => {
            socketService.sendMessage({
              message: `Hi ${astrologerName || ""}`,
              roomId,
              userId,
              astrologerId,
              kundliId
            });
          }, 500);

          // Send Kundli link
          setTimeout(() => {
            const baseUrl = window.location.origin;
            const kundliLink = `${baseUrl}/kundli/${kundliId}`;
            socketService.sendMessage({
              message: kundliLink,
              roomId,
              userId,
              astrologerId,
              kundliId,
              type: "kundli"
            });
          }, 1000);
        }
      },
      onError: (errMsg) => {
        Toast.error(errMsg || "Something went wrong");
        setError(errMsg);
      },
      onWarn: (msg) => {
        Toast.warning(msg || "Something went wrong");
      },
    });

    const handleAddMessage = (data) => {
      const isSenderUser = data.sender === "user";
      addMessage({
        text: data.message,
        sender: isSenderUser,
        time: formatTime(),
        dateTime: data?.dateTime,
      });
    };

    // const handleTyping = (data) => {
    //   if (data.sender !== userId) {
    //     setIsTyping(true);
    //     setTimeout(() => setIsTyping(false), 3000);
    //   }
    // };

    const handleWarning = (msg) => {
      Toast.warning(msg.message);
    };

    voiceSocket.on("message:recieved", handleAddMessage);
    // voiceSocket.on("typing", handleTyping);
    voiceSocket.on("warning", handleWarning);

    return () => {
      voiceSocket.off("message:recieved", handleAddMessage);
      // voiceSocket.off("typing", handleTyping);
      voiceSocket.off("warning", handleWarning);
    };
  }, [roomId, userId, astrologerId, isActive]);

 
  const sendMessage = (text, type) => {
    const res = socketService.sendMessage({
      roomId,
      userId,
      astrologerId,
      message: text,
      kundliId,
      type
    });

    if (res?.error) {
      setError(res.error);
      Toast.error(res.error);
      return;
    }
  };

  // const sendTyping = () => {
  //   socketService.sendTyping({ roomId, sender: userId });
  // };

  return {
    messages,
    error,
    // isTyping,
    sendMessage,
    // sendTyping,
  };
};