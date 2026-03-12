import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { voiceSocket } from "../services/voiceSocketServices";

const CallContext = createContext();

// 🔑 LocalStorage keys for call persistence
const CALL_STORAGE_KEY = "shubhtalk_active_call";
const CALL_TIMESTAMP_KEY = "shubhtalk_call_timestamp";
const CALL_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// ⚙️ Feature flag - Set to true when backend implements call:reconnect & call:reconnected
const RECONNECTION_ENABLED = false;

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCallState] = useState(null);
  const [lastRequestedAstro, setLastRequestedAstro] = useState(null);
  const [lastCallType, setLastCallType] = useState(null);
  const [lastSelectedKundli, setLastSelectedKundli] = useState(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [callApproval, setCallApproval] = useState(false);
  const [missedApproval, setMissedApproval] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [waitingList, setWaitingList] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  /* ================= TIMER ================= */
  const startTimer = () => {
    if (timerRef.current) return;
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

  /* ================= PERSISTENCE (gated by RECONNECTION_ENABLED) ================= */
  const persistCallState = useCallback((callData) => {
    if (!RECONNECTION_ENABLED) return;
    try {
      localStorage.setItem(CALL_STORAGE_KEY, JSON.stringify(callData));
      localStorage.setItem(CALL_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.warn("[CallContext] Failed to persist call state:", e);
    }
  }, []);

  const clearPersistedCallState = useCallback(() => {
    localStorage.removeItem(CALL_STORAGE_KEY);
    localStorage.removeItem(CALL_TIMESTAMP_KEY);
  }, []);

  const restoreCallState = useCallback(() => {
    if (!RECONNECTION_ENABLED) return null;
    try {
      const saved = localStorage.getItem(CALL_STORAGE_KEY);
      const timestamp = localStorage.getItem(CALL_TIMESTAMP_KEY);
      if (!saved || !timestamp) return null;

      const elapsed = Date.now() - Number(timestamp);
      if (elapsed > CALL_EXPIRY_TIME) {
        clearPersistedCallState();
        return null;
      }
      return JSON.parse(saved);
    } catch (e) {
      console.warn("[CallContext] Failed to restore call state:", e);
      clearPersistedCallState();
      return null;
    }
  }, [clearPersistedCallState]);

  /* ================= SET ACTIVE CALL (wrapper with persistence) ================= */
  const setActiveCall = useCallback((callData) => {
    setActiveCallState(callData);
    if (callData) {
      persistCallState(callData);
    } else {
      clearPersistedCallState();
    }
  }, [persistCallState, clearPersistedCallState]);

  /* ================= RECONNECTION (gated by RECONNECTION_ENABLED) ================= */
  const reconnectToCall = useCallback(() => {
    if (!RECONNECTION_ENABLED) return;

    const savedCall = restoreCallState();
    if (!savedCall || !savedCall.roomId) {
      clearPersistedCallState();
      return;
    }

    console.log("[CallContext] Attempting reconnection for room:", savedCall.roomId);
    setIsReconnecting(true);

    // Emit reconnect request to backend
    voiceSocket.emit("call:reconnect", {
      roomId: savedCall.roomId,
      userId: savedCall.userId,
      astrologerId: savedCall.astrologerId,
      callType: savedCall.callType,
    });

    // Listen for backend response
    const onReconnected = (data) => {
      console.log("[CallContext] call:reconnected received:", data);
      setIsReconnecting(false);
      voiceSocket.off("call:reconnected", onReconnected);

      if (data && data.active) {
        // Call is still active — restore it
        setActiveCallState({
          ...savedCall,
          agoraToken: data.agoraToken || savedCall.agoraToken,
          remainingTime: data.remainingTime || savedCall.remainingTime,
        });
        if (data.remainingTime) {
          setCallSeconds(Number(data.remainingTime) * 60);
        }
      } else {
        // Call is no longer active
        clearPersistedCallState();
      }
    };

    voiceSocket.on("call:reconnected", onReconnected);

    // Timeout — if backend doesn't respond in 10s, give up
    setTimeout(() => {
      voiceSocket.off("call:reconnected", onReconnected);
      setIsReconnecting(false);
      clearPersistedCallState();
    }, 30000);
  }, [restoreCallState, clearPersistedCallState]);

  /* ================= SOCKET CONNECTION ================= */
  useEffect(() => {
    if (!userIdLocal) return;

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
    voiceSocket.on("call:accepted", handleCallUpgrade);

    return () => {
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("call:accepted", handleCallUpgrade);
    };
  }, [userIdLocal]);

  /* ================= ATTEMPT RECONNECTION ON MOUNT ================= */
  useEffect(() => {
    if (RECONNECTION_ENABLED) {
      reconnectToCall();
    }
    // eslint-disable-next-line
  }, []);

  /* ================= BEFOREUNLOAD (gated by RECONNECTION_ENABLED) ================= */
  useEffect(() => {
    if (!RECONNECTION_ENABLED || !activeCall) return;

    const handleBeforeUnload = (e) => {
      // Persist latest call seconds for resume
      sessionStorage.setItem("shubhtalk_call_seconds", String(callSeconds));
      persistCallState(activeCall);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeCall, callSeconds, persistCallState]);

  /* ================= PAGE VISIBILITY (gated by RECONNECTION_ENABLED) ================= */
  useEffect(() => {
    if (!RECONNECTION_ENABLED || !activeCall) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        persistCallState(activeCall);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeCall, persistCallState]);

  /* ================= CONTEXT VALUE ================= */
  const value = {
    activeCall,
    setActiveCall,
    lastRequestedAstro,
    setLastRequestedAstro,
    lastCallType,
    setLastCallType,
    lastSelectedKundli,
    setLastSelectedKundli,
    activeCallRoomId,
    setActiveCallRoomId,
    callApproval,
    setCallApproval,
    missedApproval,
    setMissedApproval,
    openReview,
    setOpenReview,
    reviewData,
    setReviewData,
    isReconnecting,
    waitingList,
    setWaitingList,
    callSeconds,
    setCallSeconds,
    startTimer,
    stopTimer,
    resetTimer,
    resetCallFlow,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
