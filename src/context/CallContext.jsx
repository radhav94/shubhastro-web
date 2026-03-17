import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { voiceSocket, registerCallSession, clearCallSession } from "../services/voiceSocketServices";

const CallContext = createContext();

// 🔑 LocalStorage keys for call persistence
const CALL_STORAGE_KEY = "shubhtalk_active_call";
const CALL_TIMESTAMP_KEY = "shubhtalk_call_timestamp";
const CALL_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// ⚙️ Feature flag - Backend now supports call:reconnect & call:reconnected
const RECONNECTION_ENABLED = true;

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCallState] = useState(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false); // Track if call UI is minimized
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
  // Ref to always hold the latest callSeconds for use in closures (e.g. handleCallUpgrade)
  const callSecondsRef = useRef(0);
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  /* ================= TIMER ================= */
  // Keep ref in sync so closures always have the latest value
  useEffect(() => {
    callSecondsRef.current = callSeconds;
  }, [callSeconds]);

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
  const setActiveCall = useCallback((callDataOrUpdater) => {
    if (typeof callDataOrUpdater === "function") {
      // Handle function updater: resolve the value, then persist
      setActiveCallState((prev) => {
        const resolved = callDataOrUpdater(prev);
        if (resolved) {
          persistCallState(resolved);
          // Register session for auto-reconnect on socket disconnect
          registerCallSession({
            roomId: resolved.roomId,
            userId: resolved.userId,
            astrologerId: resolved.astrologerId,
            callType: resolved.callType,
          });
        } else {
          clearPersistedCallState();
          clearCallSession();
        }
        return resolved;
      });
    } else {
      setActiveCallState(callDataOrUpdater);
      if (callDataOrUpdater) {
        persistCallState(callDataOrUpdater);
        // Register session for auto-reconnect on socket disconnect
        registerCallSession({
          roomId: callDataOrUpdater.roomId,
          userId: callDataOrUpdater.userId,
          astrologerId: callDataOrUpdater.astrologerId,
          callType: callDataOrUpdater.callType,
        });
      } else {
        clearPersistedCallState();
        clearCallSession();
      }
    }
  }, [persistCallState, clearPersistedCallState]);

  /* ================= RECONNECTION (gated by RECONNECTION_ENABLED) ================= */
  const reconnectToCall = useCallback(() => {
    if (!RECONNECTION_ENABLED) {
      console.log("[CallReconnect] ⏭️ RECONNECTION_ENABLED is false, skipping");
      return;
    }

    const savedCall = restoreCallState();
    console.log("[CallReconnect] 📦 Restored saved call from localStorage:", savedCall ? {
      roomId: savedCall.roomId,
      userId: savedCall.userId,
      astrologerId: savedCall.astrologerId,
      callType: savedCall.callType,
      hasAgoraToken: !!savedCall.agoraToken,
      remainingTime: savedCall.remainingTime,
    } : "null");

    if (!savedCall || !savedCall.roomId) {
      console.log("[CallReconnect] ❌ No saved call or missing roomId — clearing & aborting");
      clearPersistedCallState();
      return;
    }

    console.log("[CallReconnect] 🔄 Starting reconnection for room:", savedCall.roomId);
    console.log("[CallReconnect] 🔌 Socket state: connected=", voiceSocket.connected, "id=", voiceSocket.id);
    setIsReconnecting(true);

    // Intercept generic "error" events during reconnect so other components
    // don't show misleading toasts like "Astrologer is not available"
    const originalListeners = voiceSocket.listeners("error").slice();
    console.log("[CallReconnect] 📋 Saved", originalListeners.length, "existing error listeners");

    const suppressErrors = () => {
      voiceSocket.removeAllListeners("error");
      voiceSocket.on("error", onReconnectError);
      console.log("[CallReconnect] 🔇 Error listeners suppressed, reconnect error handler installed");
    };
    const restoreErrors = () => {
      voiceSocket.off("error", onReconnectError);
      originalListeners.forEach((fn) => {
        if (!voiceSocket.listeners("error").includes(fn)) {
          voiceSocket.on("error", fn);
        }
      });
      console.log("[CallReconnect] 🔊 Original error listeners restored");
    };

    const cleanupAll = () => {
      console.log("[CallReconnect] 🧹 cleanupAll — removing all reconnect listeners");
      voiceSocket.off("call:reconnected", onReconnected);
      voiceSocket.off("call:rejected", onReconnectError);
      voiceSocket.off("connect", doEmit);
      restoreErrors();
      setIsReconnecting(false);
    };

    // Treat any error/rejection during reconnect as "call no longer active"
    const onReconnectError = (data) => {
      console.log("[CallReconnect] ❌ Got error/rejection during reconnect:");
      console.log("[CallReconnect]   → event data:", JSON.stringify(data));
      console.log("[CallReconnect]   → message:", data?.message);
      console.log("[CallReconnect]   → reason:", data?.reason);
      console.log("[CallReconnect]   → Treating as call ended, clearing state");
      cleanupAll();
      clearPersistedCallState();
    };

    const doEmit = () => {
      const payload = {
        roomId: savedCall.roomId,
        userId: savedCall.userId,
        astrologerId: savedCall.astrologerId,
        callType: savedCall.callType,
      };
      console.log("[CallReconnect] 📤 Emitting call:reconnect");
      console.log("[CallReconnect]   → socket.connected:", voiceSocket.connected);
      console.log("[CallReconnect]   → socket.id:", voiceSocket.id);
      console.log("[CallReconnect]   → payload:", JSON.stringify(payload));
      suppressErrors();
      voiceSocket.emit("call:reconnect", payload);
      console.log("[CallReconnect] ✅ call:reconnect emitted, waiting for response...");
    };

    // Also install a catch-all listener to log ANY event during reconnect
    const debugAnyEvent = (eventName, ...args) => {
      if (eventName === "call:reconnected" || eventName === "call:rejected" || eventName === "error") {
        console.log("[CallReconnect] 🔔 Received event:", eventName, "data:", JSON.stringify(args));
      }
    };
    voiceSocket.onAny(debugAnyEvent);

    // Wait for socket to be connected before emitting
    if (voiceSocket.connected) {
      console.log("[CallReconnect] 🟢 Socket already connected, emitting immediately");
      doEmit();
    } else {
      console.log("[CallReconnect] 🟡 Socket not connected, waiting for connect event...");
      voiceSocket.once("connect", () => {
        console.log("[CallReconnect] 🟢 Socket connect event fired, id:", voiceSocket.id);
        doEmit();
      });
    }

    // Listen for backend response
    const onReconnected = (data) => {
      console.log("[CallReconnect] ✅ call:reconnected received:");
      console.log("[CallReconnect]   → active:", data?.active);
      console.log("[CallReconnect]   → type:", data?.type);
      console.log("[CallReconnect]   → agoraToken:", data?.agoraToken ? "present" : "missing");
      console.log("[CallReconnect]   → remainingTime:", data?.remainingTime);
      console.log("[CallReconnect]   → full data:", JSON.stringify(data));
      voiceSocket.offAny(debugAnyEvent);
      cleanupAll();

      if (data && data.active) {
        // Use the type from backend response — it reflects the ACTUAL current session type
        // This is critical for audio→video upgrades where savedCall may still say "audio"
        const actualCallType = data.type || savedCall.callType;
        console.log("[CallReconnect] 🎉 Call is still active — restoring state");
        console.log("[CallReconnect]   → savedCall.callType:", savedCall.callType, "→ actualCallType:", actualCallType);
        
        const restoredCall = {
          ...savedCall,
          callType: actualCallType,
          agoraToken: data.agoraToken || savedCall.agoraToken,
          remainingTime: data.remainingTime || savedCall.remainingTime,
        };
        setActiveCallState(restoredCall);
        // Also persist the corrected state so next refresh is accurate
        persistCallState(restoredCall);
        
        if (data.remainingTime) {
          const secs = Number(data.remainingTime) * 60;
          console.log("[CallReconnect] ⏱️ Setting callSeconds:", secs);
          setCallSeconds(secs);
        }
      } else {
        console.log("[CallReconnect] 💀 Call is no longer active — clearing state");
        console.log("[CallReconnect]   → reason:", data?.reason);
        clearPersistedCallState();
      }
    };

    voiceSocket.on("call:reconnected", onReconnected);
    voiceSocket.on("call:rejected", onReconnectError);
    console.log("[CallReconnect] 👂 Listening for: call:reconnected, call:rejected, error");

    // Timeout — if backend doesn't respond in 30s, give up
    setTimeout(() => {
      console.log("[CallReconnect] ⏰ 30s timeout reached — giving up");
      voiceSocket.offAny(debugAnyEvent);
      cleanupAll();
      clearPersistedCallState();
    }, 30000);
  }, [restoreCallState, clearPersistedCallState]);

  /* ================= SOCKET CONNECTION ================= */
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
      console.log("[CallContext] 🔄 call:accepted for upgrade:", JSON.stringify(data));

      // Clear waiting list immediately for any call:accepted
      setWaitingList(null);
      
      // Dispatch event to notify current call component before state update
      if (data.type === "video") {
        window.dispatchEvent(new CustomEvent('call:upgrading-to-video', { 
          detail: { roomId: data.roomId } 
        }));
      } else if (data.type === "audio") {
        window.dispatchEvent(new CustomEvent('call:downgrading-to-audio', { 
          detail: { roomId: data.roomId } 
        }));
      }
      
      // Save current callSeconds from ref (always fresh) before component unmounts and stopTimer resets it
      const currentSeconds = callSecondsRef.current;
      console.log("[CallContext] 🔄 Preserving callSeconds for call switch:", currentSeconds);
      
      // Update activeCall synchronously — no setTimeout to avoid race conditions
      // with screen-level call:accepted handlers
      setActiveCall((prevCall) => {
        // Upgrade: audio → video
        if (prevCall && prevCall.callType === "audio" && data.type === "video") {
          console.log("✅ Upgrading call from audio to video");
          const upgraded = {
            ...prevCall,
            callType: "video",
            agoraToken: data.agoraToken || data.token || prevCall.agoraToken,
            roomId: data.roomId || prevCall.roomId,
            remainingTime: data.remainingTime || prevCall.remainingTime,
          };
          console.log("[CallContext] 🔄 Upgraded activeCall:", JSON.stringify({ ...upgraded, agoraToken: "[redacted]" }));
          return upgraded;
        }
        // Downgrade: video → audio
        if (prevCall && prevCall.callType === "video" && data.type === "audio") {
          console.log("✅ Downgrading call from video to audio");
          const downgraded = {
            ...prevCall,
            callType: "audio",
            agoraToken: data.agoraToken || data.token || prevCall.agoraToken,
            roomId: data.roomId || prevCall.roomId,
            remainingTime: data.remainingTime || prevCall.remainingTime,
          };
          console.log("[CallContext] 🔄 Downgraded activeCall:", JSON.stringify({ ...downgraded, agoraToken: "[redacted]" }));
          return downgraded;
        }
        return prevCall;
      });
      
      // Restore callSeconds after upgrade — use backend value if available, else preserve current
      const newSecs = data.remainingTime ? Math.floor(Number(data.remainingTime) * 60) : currentSeconds;
      if (newSecs > 0) {
        console.log("[CallContext] ⏱️ Setting callSeconds after upgrade:", newSecs);
        setCallSeconds(newSecs);
      }
    };

    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("call:accepted", handleCallUpgrade);

    // Handle auto-reconnect response from voiceSocketServices
    // This fires when socket reconnects and auto-emits call:reconnect
    const handleAutoReconnected = (data) => {
      console.log("[CallContext] 🔄 call:reconnected (auto-reconnect):", JSON.stringify(data));
      
      if (data && data.active) {
        console.log("[CallContext] ✅ Auto-reconnect successful, call still active");
        // Update remaining time if provided
        if (data.remainingTime) {
          const secs = Math.floor(Number(data.remainingTime) * 60);
          console.log("[CallContext] ⏱️ Updating callSeconds from reconnect:", secs);
          setCallSeconds(secs);
          if (!timerRef.current) {
            startTimer();
          }
        }
        // Update call type if changed (e.g., audio→video upgrade happened during disconnect)
        if (data.type && activeCall && data.type !== activeCall.callType) {
          console.log("[CallContext] 🔄 Call type changed during disconnect:", activeCall.callType, "→", data.type);
          setActiveCall((prev) => prev ? { ...prev, callType: data.type, agoraToken: data.agoraToken || prev.agoraToken } : prev);
        }
      } else {
        console.log("[CallContext] ❌ Auto-reconnect failed, call ended:", data?.reason);
        // Call ended during disconnect - clear state
        setActiveCall(null);
        stopTimer();
      }
    };

    voiceSocket.on("call:reconnected", handleAutoReconnected);

    return () => {
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("call:accepted", handleCallUpgrade);
      voiceSocket.off("call:reconnected", handleAutoReconnected);
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
      // Persist latest call seconds for resume (use ref for fresh value)
      sessionStorage.setItem("shubhtalk_call_seconds", String(callSecondsRef.current));
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
    isCallMinimized,
    setIsCallMinimized,
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
