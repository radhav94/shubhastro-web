import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { voiceSocket } from "../services/voiceSocketServices";
import { toast as rht } from "react-hot-toast";
import ChatNotificationBanner from "../component/UI/ChatNotificationBanner/ChatNotificationBanner";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [lastRequestedAstro, setLastRequestedAstro] = useState(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);

  const [waitingList, setWaitingList] = useState(false);
  const [chatApproval, setChatApproval] = useState(false);
  const [missedApproval, setMissedApproval] = useState(false);

  const [chatSeconds, setChatSeconds] = useState(0);
  const timerRef = useRef(null);
  const activeChatRef = useRef(null);
  const lastAstrologerInfoRef = useRef(null);

  // Keep ref in sync with state, and remember last astrologer info
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      lastAstrologerInfoRef.current = {
        name: activeChat.astrologerName || activeChat.callerName || "Astrologer",
        image: activeChat.astrologerImage || null,
        gender: activeChat.astrologerGender || null,
      };
    }
  }, [activeChat]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setChatSeconds((s) => {
        // Stop timer if already 0 or less
        if (s <= 0) {
          stopTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const resetTimer = () => {
    stopTimer();
    setChatSeconds(0);
  };

  const resetChatFlow = () => {
    setWaitingList(null);
    setChatApproval(null);
    setMissedApproval(false);
    resetTimer();
  };

useEffect(() => {
  if (!userIdLocal) return;

  // Don't connect socket when running inside an iframe (e.g. kundali view from chat).
  // The parent page already owns the socket connection. A second connection from the
  // iframe would cause the server to see a duplicate, and when the iframe closes its
  // socket disconnects — making the server think the user went offline.
  if (window.self !== window.top) return;

  if (!voiceSocket.connected) {
    voiceSocket.io.opts.query = {
      userId: userIdLocal,
      role: "CUSTOMER",
    };
    voiceSocket.connect();
  }
  const handleActivity = (data) => {
    if(data?.remainingTime){
      resetTimer(); // Reset the timer
      setChatSeconds(data?.remainingTime*60); // Use data.remainingTime if provided
      startTimer(); // Start the timer again
    }
  }

  voiceSocket.on("activity", handleActivity)
  
  return () => {
  voiceSocket.off("activity", handleActivity)
  }
}, [resetChatFlow, resetTimer, userIdLocal])

// Separate stable useEffect for chat message notifications
// This MUST NOT depend on any unstable references
useEffect(() => {
  if (!userIdLocal) return;

  const handleGlobalMessage = (data) => {
    // Only show notification for astrologer messages (not user's own)
    if (data.sender === "user") return;
    // Don't show if user is already on the chat page
    if (window.location.pathname.includes("/chat-with-astrologers")) return;

    const astroInfo = lastAstrologerInfoRef.current;
    const senderName = astroInfo?.name || "Astrologer";
    const messageText = data.type === "gift" ? "🎁 Sent a gift" : (data.message || data.response || "New message");

    rht.custom((t) => (
      <ChatNotificationBanner
        senderName={senderName}
        message={messageText}
        imageUrl={astroInfo?.image}
        gender={astroInfo?.gender}
        onClose={() => rht.dismiss(t.id)}
        onClick={() => {
          rht.dismiss(t.id);
          const astroId = data.astrologerId || activeChatRef.current?.astrologerId;
          if (astroId) {
            window.location.href = `/chat-with-astrologers/${astroId}`;
          }
        }}
      />
    ), { duration: 4000, position: "top-right" });
  };

  voiceSocket.on("message:recieved", handleGlobalMessage);

  return () => {
    voiceSocket.off("message:recieved", handleGlobalMessage);
  };
}, [userIdLocal])

  return (
    <ChatContext.Provider
      value={{
        activeChat,
        setActiveChat,
        lastRequestedAstro,
        setLastRequestedAstro,
        waitingList,
        setWaitingList,
        chatApproval,
        setChatApproval,
        missedApproval,
        setMissedApproval,
        resetChatFlow,
        activeChatRoomId,
        setActiveChatRoomId,
        chatSeconds,
        startTimer,
        stopTimer,
        resetTimer,
        setChatSeconds
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
