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
      console.log("[CallContext] activity event:", data);
      if (data?.remainingTime && data.remainingTime > 0) {
        // Server sync every minute - update remaining time and ensure timer is running
        setCallSeconds(Math.floor(data.remainingTime * 60));
        
        // Make sure timer is running for local countdown
        if (!timerRef.current) {
          startTimer();
        }
      }
    };

    const handleCallUpgrade = (data) => {
      
      // Dispatch event to notify VoiceCall component before state update
      window.dispatchEvent(new CustomEvent('call:upgrading-to-video', { 
        detail: { roomId: data.roomId } 
      }));
      
      // Small delay to ensure the event is processed
      setTimeout(() => {
        setActiveCall((prevCall) => {
          // Only upgrade if there's an active audio call
          if (prevCall && prevCall.callType === "audio" && data.type === "video") {
            console.log("✅ Upgrading call from audio to video");
            return {
              ...prevCall,
              callType: "video",
              agoraToken: data.agoraToken || data.token || prevCall.agoraToken,
              roomId: data.roomId || prevCall.roomId,
              remainingTime: data.remainingTime || prevCall.remainingTime,
            };
          }
          return prevCall;
        });
      }, 50);
    };

    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("call:accepted", handleCallUpgrade); // Also listen to call:accepted for video upgrade

    return () => {
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("call:accepted", handleCallUpgrade);
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
