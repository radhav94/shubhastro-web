import React, { createContext, useContext, useRef, useState } from "react";

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

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setChatSeconds((s) => s + 1);
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
