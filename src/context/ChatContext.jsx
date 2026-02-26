import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { voiceSocket } from "../services/voiceSocketServices";

const ChatContext = createContext();

// 🔑 LocalStorage keys for chat persistence
const CHAT_STORAGE_KEY = "shubhtalk_active_chat";
const CHAT_TIMESTAMP_KEY = "shubhtalk_chat_timestamp";
const CHAT_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// ⚙️ Feature flag - Set to true when backend implements chat:reconnect & chat:reconnected
const RECONNECTION_ENABLED = false;

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChatState] = useState(null);
  const [lastRequestedAstro, setLastRequestedAstro] = useState(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);

  const [waitingList, setWaitingList] = useState(false);
  const [chatApproval, setChatApproval] = useState(false);
  const [missedApproval, setMissedApproval] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [chatSeconds, setChatSeconds] = useState(0);
  const timerRef = useRef(null);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  /* ================= TIMER ================= */
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setChatSeconds((s) => {
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

  /* ================= PERSISTENCE (gated by RECONNECTION_ENABLED) ================= */
  const persistChatState = useCallback((chatData) => {
    if (!RECONNECTION_ENABLED) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
      localStorage.setItem(CHAT_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.warn("[ChatContext] Failed to persist chat state:", e);
    }
  }, []);

  const clearPersistedChatState = useCallback(() => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(CHAT_TIMESTAMP_KEY);
  }, []);

  const restoreChatState = useCallback(() => {
    if (!RECONNECTION_ENABLED) return null;
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      const timestamp = localStorage.getItem(CHAT_TIMESTAMP_KEY);
      if (!saved || !timestamp) return null;

      const elapsed = Date.now() - Number(timestamp);
      if (elapsed > CHAT_EXPIRY_TIME) {
        clearPersistedChatState();
        return null;
      }
      return JSON.parse(saved);
    } catch (e) {
      console.warn("[ChatContext] Failed to restore chat state:", e);
      clearPersistedChatState();
      return null;
    }
  }, [clearPersistedChatState]);

  /* ================= SET ACTIVE CHAT (wrapper with persistence) ================= */
  const setActiveChat = useCallback((chatData) => {
    setActiveChatState(chatData);
    if (chatData) {
      persistChatState(chatData);
    } else {
      clearPersistedChatState();
    }
  }, [persistChatState, clearPersistedChatState]);

  /* ================= RECONNECTION (gated by RECONNECTION_ENABLED) ================= */
  const reconnectToChat = useCallback(() => {
    if (!RECONNECTION_ENABLED) return;

    const savedChat = restoreChatState();
    if (!savedChat || !savedChat.roomId) {
      clearPersistedChatState();
      return;
    }

    console.log("[ChatContext] Attempting reconnection for room:", savedChat.roomId);
    setIsReconnecting(true);

    // Emit reconnect request to backend
    voiceSocket.emit("chat:reconnect", {
      roomId: savedChat.roomId,
      userId: savedChat.userId,
      astrologerId: savedChat.astrologerId,
    });

    // Listen for backend response
    const onReconnected = (data) => {
      console.log("[ChatContext] chat:reconnected received:", data);
      setIsReconnecting(false);
      voiceSocket.off("chat:reconnected", onReconnected);

      if (data && data.active) {
        // Chat is still active — restore it
        setActiveChatState({
          ...savedChat,
          remainingTime: data.remainingTime || savedChat.remainingTime,
        });
        if (data.remainingTime) {
          setChatSeconds(Number(data.remainingTime) * 60);
          startTimer();
        }
      } else {
        // Chat is no longer active
        clearPersistedChatState();
      }
    };

    voiceSocket.on("chat:reconnected", onReconnected);

    // Timeout — if backend doesn't respond in 30s, give up
    setTimeout(() => {
      voiceSocket.off("chat:reconnected", onReconnected);
      setIsReconnecting(false);
      clearPersistedChatState();
    }, 30000);
  }, [restoreChatState, clearPersistedChatState]);

  /* ================= SOCKET CONNECTION & ACTIVITY ================= */
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
      if (data?.remainingTime) {
        resetTimer();
        setChatSeconds(data.remainingTime * 60);
        startTimer();
      }
    };

    voiceSocket.on("activity", handleActivity);

    return () => {
      voiceSocket.off("activity", handleActivity);
    };
  }, [userIdLocal]);

  /* ================= ATTEMPT RECONNECTION ON MOUNT ================= */
  useEffect(() => {
    if (RECONNECTION_ENABLED) {
      reconnectToChat();
    }
    // eslint-disable-next-line
  }, []);

  /* ================= BEFOREUNLOAD (gated by RECONNECTION_ENABLED) ================= */
  useEffect(() => {
    if (!RECONNECTION_ENABLED || !activeChat) return;

    const handleBeforeUnload = () => {
      sessionStorage.setItem("shubhtalk_chat_seconds", String(chatSeconds));
      persistChatState(activeChat);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeChat, chatSeconds, persistChatState]);

  /* ================= PAGE VISIBILITY (gated by RECONNECTION_ENABLED) ================= */
  useEffect(() => {
    if (!RECONNECTION_ENABLED || !activeChat) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        persistChatState(activeChat);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeChat, persistChatState]);

  /* ================= CONTEXT VALUE ================= */
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
        setChatSeconds,
        isReconnecting,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
