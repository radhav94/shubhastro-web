import React, { createContext, useContext, useState, useRef } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);
  const [lastRequestedAstro, setLastRequestedAstro] = useState(null);
  const [lastCallType, setLastCallType] = useState(null); // Store the last call type
  const [lastSelectedKundli, setLastSelectedKundli] = useState(null); // Store the last selected Kundli
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [callApproval, setCallApproval] = useState(false);
  const [missedApproval, setMissedApproval] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  // 🔥 GLOBAL waiting list (persists across navigation)
  const [waitingList, setWaitingList] = useState(false);

  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const resetTimer = () => {
    stopTimer();
    setCallSeconds(0);
  };

  const resetCallFlow = () => {
    setWaitingList(null);
    setCallApproval(null);
    setMissedApproval(false);
    resetTimer();
  };

  return (
    <CallContext.Provider
      value={{
        callApproval,
        activeCall,
        missedApproval,
        resetCallFlow,
        setCallApproval,
        setMissedApproval,
        activeCallRoomId,
        callSeconds,
        setActiveCall,
        waitingList,
        setWaitingList,
        setActiveCallRoomId,
        lastRequestedAstro,
        setLastRequestedAstro,
        lastCallType,
        setLastCallType,
        lastSelectedKundli,
        setLastSelectedKundli,
        startTimer,
        stopTimer,
        resetTimer,
        openReview,
        setOpenReview,
        reviewData,
        setReviewData
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
