import { useEffect, useState } from "react";
import socketService from "../../../../../services/socketService";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import toast from "../../../../../component/toast";
import { useChat as useChatContext } from "../../../../../context/ChatContext"
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { useCall } from "../../../../../context/CallContext";

export default function useChat({
  userId,
  astrologerId,
  roomId,
  isUserSide,
  kundliId,
  setOpenFeedback,
  astrologerName,
  refreshKey = 0
}) {
  const { startTimer, stopTimer, chatSeconds, setActiveChat, activeChat } = useChatContext();
  const { activeCall, openReview } = useCall();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMessageDisabled, setIsMessageDisabled] = useState(false);

  // Fetch kundli profiles to get the "Self" profile
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleChatEndedFromServer = () => {
    setIsMessageDisabled(true);
    stopTimer();
    setActiveChat(null);

    // Don't show chat feedback if call review is already open (chat→call switch scenario)
    // or if there's an active call (chat ended because user switched to call)
    if (openReview || activeCall) {
      return;
    }
    setOpenFeedback(true);
  };

  useEffect(() => {
    if (activeChat?.astrologerId !== astrologerId && activeCall?.astrologerId !== astrologerId) setIsMessageDisabled(true)
    if (!roomId || !userId || !astrologerId) return;
    socketService.connect({
      onConnected: () => {
        if (Object.keys(activeChat || {}).length > 0) { //Check if chat is active
          startTimer(); //Start timer only when there is active chat
          setIsMessageDisabled(false);

          // Check if initial messages were already sent for this room (persists across remounts/reconnects)
          const sentKey = `shubhtalk_chat_init_${roomId}`;
          const alreadySent = sessionStorage.getItem(sentKey);

          //Send msg first time only 
          if (!refreshKey && !alreadySent) {
            sessionStorage.setItem(sentKey, "true");

            // Check if there's an AI initial query stored
            const aiInitialQuery = localStorage.getItem("aiInitialQuery");

            if (aiInitialQuery) {
              // Send the AI query directly
              sendMessage(aiInitialQuery);
              localStorage.removeItem("aiInitialQuery");
            } else {
              // Regular greeting message
              sendMessage(`Hi ${astrologerName || ""}`);
            }

            // Find the kundli profile with relation "Self"
            const selfProfile = profiles.find(profile => profile.relation === "Self");
            const profileIdToUse = selfProfile?._id || kundliId;

            const baseUrl = window.location.origin;
            const kundliLink = `${baseUrl}/kundli/${profileIdToUse}`;
            setTimeout(() => sendMessage(kundliLink, 'kundli'), 300);
          } else if (alreadySent) {
            console.log("[ChatWindow] ⏭️ Initial messages already sent for room:", roomId, "— skipping");
          }
        }
      },
      onError: (errMsg) => {
        toast.error(errMsg || "Something went wrong");
        setError(errMsg);
        if (errMsg === 'Chat no longer available' || errMsg === 'Chat has already ended' || errMsg === 'Session not found') {
          setIsMessageDisabled(true);
          stopTimer();
          setActiveChat(null);
        }
      },
      onWarn: (msg) => {
        toast.warning(msg || "Something went wrong");
      },
    });

    const handleAddMessage = (data) => {
      const isSenderUser = data.sender === "user";
      
      // Parse gift messages (detect by type === "gift")
      let messageText = data.message;
      let giftData = null;
      
      if (data.type === "gift") {
        try {
          const parsed = JSON.parse(data.message);
          messageText = parsed.text;
          giftData = parsed.giftData;
        } catch (e) {
          console.error("Failed to parse gift message:", e);
        }
      }
      
      addMessage({
        text: messageText,
        sender: isSenderUser,
        time: formatTime(),
        dateTime: data?.dateTime,
        type: data.type,
        giftData: giftData,
      });
    }

    const handleWarning = (msg) => {
      toast.warning(msg.message);
    }

    const handleTyping = (isTyping) => {
      console.log('Typing event received:', isTyping);
      setIsTyping(isTyping === true);
    }

    voiceSocket.on("message:recieved", handleAddMessage);
    voiceSocket.on("warning", handleWarning);
    voiceSocket.on("typing", handleTyping);
    voiceSocket.on("chat:ended", handleChatEndedFromServer);

    return () => {
      voiceSocket.off("message:recieved", handleAddMessage);
      voiceSocket.off("warning", handleWarning);
      voiceSocket.off("typing", handleTyping);
      voiceSocket.off("chat:ended", handleChatEndedFromServer);
    };
  }, [roomId, activeChat, activeCall]);

  // USER SEND — prefer socketService, fallback to voiceSocket (which is already in the room after reconnect)
  const sendMessage = (text, type = "message") => {
    const payload = {
      sender: "user",
      kundliId,
      roomId,
      userId,
      astrologerId,
      message: text,
      type,
    };

    // If socketService socket is connected, use it (normal flow)
    if (socketService.socket?.connected) {
      const res = socketService.sendMessage({
        message: text,
        roomId,
        userId,
        astrologerId,
        kundliId,
        type
      });
      if (res?.error) {
        setError(res.error);
      }
      return;
    }

    // Fallback: use voiceSocket which is already connected & in the room after reconnect
    if (voiceSocket.connected) {
      console.log("[ChatWindow] 📤 socketService not connected, sending via voiceSocket");
      voiceSocket.emit("chat:message", payload);
      return;
    }

    setError("Socket not connected, try again.");
    toast.error("Socket not connected, try again.");
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
    chatSeconds,
    isMessageDisabled,
    setIsMessageDisabled,
    remainingTime: activeChat?.remainingTime || 0,
    handleChatEndedFromServer
  };
}
