import { useEffect, useState, useRef } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import { Toast } from "../index";

export const useVideoCallChat = ({ userId, astrologerId, roomId, kundliId, astrologerName }) => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const hasInitializedRef = useRef(false);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  // Send message via voiceSocket
  // Updated: accept optional kundliIdOverride to send correct kundliId for selected kundli
  const sendViaSocket = (message, type = "message", kundliIdOverride = null) => {
    if (!voiceSocket.connected) {
      Toast.error("Socket not connected");
      return { error: "Socket not connected" };
    }

    try {
      voiceSocket.emit("chat:message", {
        sender: "user",
        kundliId: kundliIdOverride || kundliId,
        roomId,
        userId,
        astrologerId,
        message,
        type
      });
      return { success: true };
    } catch (err) {
      console.error("Error sending message:", err);
      return { error: err.message };
    }
  };

  // Initialize socket listeners and send initial messages
  useEffect(() => {
    if (!roomId || !userId || !astrologerId) return;

    // Function to send initial messages (only once per room, survives reconnect)
    const sendInitialMessages = () => {
      if (hasInitializedRef.current) return;
      if (!kundliId) return;
      if (!voiceSocket.connected) return;

      // Check if we already sent initial messages for this room (persists across remounts/reconnects)
      const sentKey = `shubhtalk_chat_init_${roomId}`;
      if (sessionStorage.getItem(sentKey)) {
        console.log("[VideoCallChat] ⏭️ Initial messages already sent for room:", roomId, "— skipping");
        hasInitializedRef.current = true;
        return;
      }

      hasInitializedRef.current = true;
      sessionStorage.setItem(sentKey, "true");
      
      // Send greeting message
      setTimeout(() => {
        sendViaSocket(`Hi ${astrologerName || ""}`, "message");
      }, 500);

      // Send Kundli. Send the bare kundliId as the message (origin-independent);
      // the kundliId also travels in the payload. Renderers rebuild the link
      // from the current origin.
      setTimeout(() => {
        sendViaSocket(kundliId, "kundli");
      }, 1000);
    };

    // Try to send immediately if already connected
    if (voiceSocket.connected) {
      sendInitialMessages();
    }

    // Also listen for connect event in case it connects later
    const handleConnect = () => {
      sendInitialMessages();
    };

    const handleAddMessage = (data) => {
      const isSenderUser = data.sender === "user";
      addMessage({
        text: data.message,
        sender: isSenderUser,
        time: formatTime(),
        dateTime: data?.dateTime,
        type: data?.type,
        kundliName: data?.kundliName,
        kundliId: data?.kundliId,
        suggestedProducts: data?.suggestedProducts,
      });
    };


    const handleError = (err) => {
      Toast.error(err.message || "Something went wrong");
      setError(err.message);
    };

    voiceSocket.on("connect", handleConnect);
    voiceSocket.on("message:recieved", handleAddMessage);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("connect", handleConnect);
      voiceSocket.off("message:recieved", handleAddMessage);
      voiceSocket.off("error", handleError);
    };
  }, [roomId, userId, astrologerId, kundliId, astrologerName]);

 
  // Updated: accept optional kundliIdOverride parameter
  const sendMessage = (text, type, kundliIdOverride = null) => {
    const res = sendViaSocket(text, type, kundliIdOverride);

    if (res?.error) {
      setError(res.error);
      Toast.error(res.error);
      return;
    }
  };

  return {
    messages,
    error,
    sendMessage,
  };
};
