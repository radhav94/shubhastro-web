import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { voiceSocket } from "../services/voiceSocketServices";

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
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const startTimer = () => {
    if (timerRef.current) return; // 🔒 prevent multiple timers

    timerRef.current = setInterval(() => {
      setCallSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      console.log("[CallContext] activity event:", data);
      if (data?.remainingTime && data.remainingTime > 0) {
        // Server sync every minute - update remaining time and ensure timer is running
        setCallSeconds(Math.floor(data.remainingTime * 60));
        
        // Make sure timer is running for local countdown
        if (!timerRef.current) {
          startTimer();
        }
      }
    }

    voiceSocket.on("activity", handleActivity)

    return () => {
      voiceSocket.off("activity", handleActivity)
    }
  }, [resetCallFlow, resetTimer, userIdLocal])

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
        setCallSeconds,
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
