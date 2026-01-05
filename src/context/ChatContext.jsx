import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { voiceSocket } from "../services/voiceSocketServices";

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

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setChatSeconds((s) => s - 1);
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
      setChatSeconds(data?.remainingTime); // Use data.remainingTime if provided
      startTimer(); // Start the timer again
    }
  }

  voiceSocket.on("activity", handleActivity)
  
  return () => {
  voiceSocket.off("activity", handleActivity)
  }
}, [resetChatFlow, resetTimer, userIdLocal])

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
