/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { voiceSocket, registerChatSession, clearChatSession } from "../services/voiceSocketServices";
import { toast as rht } from "react-hot-toast";
import ChatNotificationBanner from "../component/UI/ChatNotificationBanner/ChatNotificationBanner";
import { PANDIT_AI_ID, isPanditAIEvent } from "../component/panditAI/usePanditAI";
import { isShubhMallEnabled } from "../utils/featureConfig";

const ChatContext = createContext();

// 🔑 LocalStorage keys for chat persistence
const CHAT_STORAGE_KEY = "shubhtalk_active_chat";
const CHAT_TIMESTAMP_KEY = "shubhtalk_chat_timestamp";
const CHAT_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// ⚙️ Feature flag - Backend now supports chat:reconnect & chat:reconnected
const RECONNECTION_ENABLED = true;

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChatState] = useState(null);
  const [lastRequestedAstro, setLastRequestedAstro] = useState(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);

  const [waitingList, setWaitingList] = useState(false);
  const [chatApproval, setChatApproval] = useState(false);
  const [missedApproval, setMissedApproval] = useState(false);
  // Two-way accept: data from chat:astrologer_accepted for user ring UI
  const [chatApprovalData, setChatApprovalData] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

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
      const parsedChat = JSON.parse(saved);
      if (elapsed > CHAT_EXPIRY_TIME || parsedChat?.astrologerId === PANDIT_AI_ID) {
        clearPersistedChatState();
        return null;
      }
      return parsedChat;
    } catch (e) {
      console.warn("[ChatContext] Failed to restore chat state:", e);
      clearPersistedChatState();
      return null;
    }
  }, [clearPersistedChatState]);

  /* ================= SET ACTIVE CHAT (wrapper with persistence) ================= */
  const setActiveChat = useCallback((chatData) => {
    if (chatData?.astrologerId === PANDIT_AI_ID) {
      setActiveChatState(null);
      clearPersistedChatState();
      clearChatSession();
      return;
    }

    setActiveChatState(chatData);
    if (chatData) {
      persistChatState(chatData);
      // Register session for auto-reconnect on socket disconnect
      registerChatSession({
        roomId: chatData.roomId,
        userId: chatData.userId,
        astrologerId: chatData.astrologerId,
        callType: chatData.callType || "chat",
      });
    } else {
      clearPersistedChatState();
      clearChatSession();
    }
  }, [persistChatState, clearPersistedChatState]);

  /* ================= RECONNECTION (gated by RECONNECTION_ENABLED) ================= */
  const reconnectToChat = useCallback((fallbackChat = null) => {
    if (!RECONNECTION_ENABLED) {
      console.log("[ChatReconnect] ⏭️ RECONNECTION_ENABLED is false, skipping");
      return;
    }

    const restoredChat = restoreChatState();
    const reconnectChat = restoredChat || fallbackChat || activeChatRef.current;
    console.log("[ChatReconnect] 📦 Restored saved chat from localStorage:", reconnectChat ? {
      roomId: reconnectChat.roomId,
      userId: reconnectChat.userId,
      astrologerId: reconnectChat.astrologerId,
      remainingTime: reconnectChat.remainingTime,
    } : "null");

    if (!reconnectChat || !reconnectChat.roomId) {
      console.log("[ChatReconnect] ❌ No saved chat or missing roomId — clearing & aborting");
      clearPersistedChatState();
      return;
    }

    // Make sure the current in-memory chat is persisted and registered before reconnect.
    persistChatState(reconnectChat);
    registerChatSession({
      roomId: reconnectChat.roomId,
      userId: reconnectChat.userId,
      astrologerId: reconnectChat.astrologerId,
      callType: reconnectChat.callType || "chat",
    });

    console.log("[ChatReconnect] 🔄 Starting reconnection for room:", reconnectChat.roomId);
    console.log("[ChatReconnect] 🔌 Socket state: connected=", voiceSocket.connected, "id=", voiceSocket.id);
    setIsReconnecting(true);

    // Intercept generic "error" events during reconnect so other components
    // don't show misleading toasts
    const originalListeners = voiceSocket.listeners("error").slice();
    console.log("[ChatReconnect] 📋 Saved", originalListeners.length, "existing error listeners");

    const suppressErrors = () => {
      voiceSocket.removeAllListeners("error");
      voiceSocket.on("error", onReconnectError);
      console.log("[ChatReconnect] 🔇 Error listeners suppressed, reconnect error handler installed");
    };
    const restoreErrors = () => {
      voiceSocket.off("error", onReconnectError);
      originalListeners.forEach((fn) => {
        if (!voiceSocket.listeners("error").includes(fn)) {
          voiceSocket.on("error", fn);
        }
      });
      console.log("[ChatReconnect] 🔊 Original error listeners restored");
    };

    const cleanupAll = () => {
      console.log("[ChatReconnect] 🧹 cleanupAll — removing all reconnect listeners");
      voiceSocket.off("chat:reconnected", onReconnected);
      voiceSocket.off("chat:rejected", onReconnectError);
      voiceSocket.off("connect", doEmit);
      restoreErrors();
      setIsReconnecting(false);
    };

    const onReconnectError = (data) => {
      console.log("[ChatReconnect] ❌ Got error/rejection during reconnect:");
      console.log("[ChatReconnect]   → event data:", JSON.stringify(data));
      console.log("[ChatReconnect]   → message:", data?.message);
      console.log("[ChatReconnect]   → reason:", data?.reason);
      console.log("[ChatReconnect]   → Treating as chat ended, clearing state");
      cleanupAll();
      clearPersistedChatState();
    };

    const doEmit = () => {
      const payload = {
        roomId: reconnectChat.roomId,
        userId: reconnectChat.userId,
        astrologerId: reconnectChat.astrologerId,
        callType: reconnectChat.callType || "chat",
      };
      console.log("[ChatReconnect] 📤 Emitting chat:reconnect");
      console.log("[ChatReconnect]   → socket.connected:", voiceSocket.connected);
      console.log("[ChatReconnect]   → socket.id:", voiceSocket.id);
      console.log("[ChatReconnect]   → payload:", JSON.stringify(payload));
      suppressErrors();
      voiceSocket.emit("chat:reconnect", payload);
      console.log("[ChatReconnect] ✅ chat:reconnect emitted, waiting for response...");
    };

    // Also install a catch-all listener to log ANY event during reconnect
    const debugAnyEvent = (eventName, ...args) => {
      if (eventName === "chat:reconnected" || eventName === "chat:rejected" || eventName === "error") {
        console.log("[ChatReconnect] 🔔 Received event:", eventName, "data:", JSON.stringify(args));
      }
    };
    voiceSocket.onAny(debugAnyEvent);

    // Wait for socket to be connected before emitting
    if (voiceSocket.connected) {
      console.log("[ChatReconnect] 🟢 Socket already connected, emitting immediately");
      doEmit();
    } else {
      console.log("[ChatReconnect] 🟡 Socket not connected, waiting for connect event...");
      voiceSocket.once("connect", () => {
        console.log("[ChatReconnect] 🟢 Socket connect event fired, id:", voiceSocket.id);
        doEmit();
      });
    }

    // Listen for backend response
    const onReconnected = (data) => {
      console.log("[ChatReconnect] ✅ chat:reconnected received:");
      console.log("[ChatReconnect]   → active:", data?.active);
      console.log("[ChatReconnect]   → remainingTime:", data?.remainingTime);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
      voiceSocket.offAny(debugAnyEvent);
      cleanupAll();

      if (data && data.active) {
        console.log("[ChatReconnect] 🎉 Chat is still active — restoring state");
        setActiveChat({
          ...reconnectChat,
          remainingTime: data.remainingTime || reconnectChat.remainingTime,
        });
        if (data.remainingTime) {
          const secs = Number(data.remainingTime) * 60;
          // Check if we have a more accurate saved countdown from before refresh
          const savedSecs = sessionStorage.getItem("shubhtalk_chat_seconds");
          const restoredSecs = savedSecs && Number(savedSecs) > 0 ? Number(savedSecs) : secs;
          console.log("[ChatReconnect] ⏱️ Backend remainingTime:", data.remainingTime, "→", secs, "s | sessionStorage:", savedSecs, "→ using:", restoredSecs);
          setChatSeconds(restoredSecs);
          // Clear saved seconds so they aren't reused on next reconnect
          sessionStorage.removeItem("shubhtalk_chat_seconds");
          startTimer();
        }
      } else {
        console.log("[ChatReconnect] 💀 Chat is no longer active — clearing state");
        console.log("[ChatReconnect]   → reason:", data?.reason);
        clearPersistedChatState();
      }
    };

    voiceSocket.on("chat:reconnected", onReconnected);
    voiceSocket.on("chat:rejected", onReconnectError);
    console.log("[ChatReconnect] 👂 Listening for: chat:reconnected, chat:rejected, error");

    // Timeout — if backend doesn't respond in 30s, give up
    setTimeout(() => {
      console.log("[ChatReconnect] ⏰ 30s timeout reached — giving up");
      voiceSocket.offAny(debugAnyEvent);
      cleanupAll();
      clearPersistedChatState();
    }, 30000);
  }, [restoreChatState, clearPersistedChatState, persistChatState, setActiveChat]);

  /* ================= SOCKET CONNECTION & ACTIVITY ================= */
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
      if (data?.remainingTime) {
        resetTimer();
        setChatSeconds(data.remainingTime * 60);
        startTimer();
      }

      // Update wallet balance from activity event (comes every minute during call/chat)
      if (data?.walletBalance !== undefined || data?.remainingBalance !== undefined) {
        const newBalance = data.walletBalance ?? data.remainingBalance;
        if (newBalance !== undefined && !isNaN(newBalance)) {
          localStorage.setItem("astro_wallet_balance", String(newBalance));
          window.dispatchEvent(new CustomEvent("walletBalanceFromSocket", { detail: { balance: newBalance } }));
        }
      }
    };

    /* 🔍 [ChatReconnect] Chat lifecycle event loggers */
    const logChatRoom = (data) => {
      if (isPanditAIEvent(data)) return;
      console.log("[ChatReconnect] 📥 chat:room — server created chat room");
      console.log("[ChatReconnect]   → roomId:", data?.roomId);
      console.log("[ChatReconnect]   → waitingTime:", data?.waitingTime);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
    };

    const logChatAccepted = (data) => {
      if (isPanditAIEvent(data)) return;
      console.log("[ChatReconnect] ✅ chat:accepted — astrologer accepted chat");
      console.log("[ChatReconnect]   → roomId:", data?.roomId);
      console.log("[ChatReconnect]   → remainingTime:", data?.remainingTime);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
      console.log("[ChatReconnect]   → activeChat state:", JSON.stringify(activeChatRef.current));
    };

    const logChatRejected = (data) => {
      if (isPanditAIEvent(data)) return;
      console.log("[ChatReconnect] ❌ chat:rejected — astrologer rejected / unavailable");
      console.log("[ChatReconnect]   → message:", data?.message);
      console.log("[ChatReconnect]   → reason:", data?.sessionData?.sessionEndReason);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
    };

    const logChatEnded = (data) => {
      if (isPanditAIEvent(data)) return;
      console.log("[ChatReconnect] 🔚 chat:ended — chat session ended");
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
      console.log("[ChatReconnect]   → activeChat was:", JSON.stringify(activeChatRef.current));
    };

    const logChatReconnected = (data) => {
      if (isPanditAIEvent(data)) return;
      console.log("[ChatReconnect] 🔄 chat:reconnected — backend reconnect response");
      console.log("[ChatReconnect]   → active:", data?.active);
      console.log("[ChatReconnect]   → remainingTime:", data?.remainingTime);
      console.log("[ChatReconnect]   → reason:", data?.reason);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
      
      // Handle auto-reconnect response from voiceSocketServices
      // This fires when socket reconnects and auto-emits chat:reconnect
      if (data && data.active) {
        console.log("[ChatContext] ✅ Auto-reconnect successful, chat still active");
        if (activeChatRef.current) {
          setActiveChat({
            ...activeChatRef.current,
            remainingTime: data.remainingTime || activeChatRef.current.remainingTime,
          });
        }

        // Update remaining time if provided
        if (data.remainingTime) {
          const secs = Math.floor(Number(data.remainingTime) * 60);
          console.log("[ChatContext] ⏱️ Updating chatSeconds from reconnect:", secs);
          resetTimer();
          setChatSeconds(secs);
          startTimer();
        }
      } else if (data && data.active === false) {
        console.log("[ChatContext] ❌ Auto-reconnect failed, chat ended:", data?.reason);
        // Chat ended during disconnect - clear state
        // Dispatch global:chat:ended BEFORE clearing activeChat so ChatWindow
        // can set openFeedback and prevent redirect
        window.dispatchEvent(new CustomEvent("global:chat:ended", { detail: { ...data, astrologerId: activeChatRef.current?.astrologerId } }));
        setActiveChat(null);
        stopTimer();
      }
    };

    const logError = (data) => {
      console.log("[ChatReconnect] ⚠️ error event received");
      console.log("[ChatReconnect]   → message:", data?.message);
      console.log("[ChatReconnect]   → full data:", JSON.stringify(data));
      console.log("[ChatReconnect]   → isReconnecting:", isReconnecting);
      console.log("[ChatReconnect]   → activeChat:", JSON.stringify(activeChatRef.current));
    };

    const logWarning = (data) => {
      console.log("[ChatReconnect] ⚠️ warning event:", data?.message);
    };

    const logActivity = (data) => {
      console.log("[ChatReconnect] 📊 activity event — remainingTime:", data?.remainingTime);
    };

    voiceSocket.on("chat:room", logChatRoom);
    voiceSocket.on("chat:accepted", logChatAccepted);
    voiceSocket.on("chat:rejected", logChatRejected);
    voiceSocket.on("chat:ended", logChatEnded);
    voiceSocket.on("chat:reconnected", logChatReconnected);
    voiceSocket.on("error", logError);
    voiceSocket.on("warning", logWarning);
    voiceSocket.on("activity", logActivity);
    voiceSocket.on("activity", handleActivity);

    return () => {
      voiceSocket.off("chat:room", logChatRoom);
      voiceSocket.off("chat:accepted", logChatAccepted);
      voiceSocket.off("chat:rejected", logChatRejected);
      voiceSocket.off("chat:ended", logChatEnded);
      voiceSocket.off("chat:reconnected", logChatReconnected);
      voiceSocket.off("error", logError);
      voiceSocket.off("warning", logWarning);
      voiceSocket.off("activity", logActivity);
      voiceSocket.off("activity", handleActivity);
    };
  }, [userIdLocal]);

  /* ================= CHAT MESSAGE NOTIFICATIONS ================= */
  // Separate stable useEffect for chat message notifications
  // This MUST NOT depend on any unstable references
  useEffect(() => {
    if (!userIdLocal) return;

    const handleGlobalMessage = (data) => {
      // Only show notification for astrologer messages (not user's own)
      if (data.sender === "user") return;

      // Skip Pandit AI messages — handled inline by PanditAIBubble
      if (isPanditAIEvent(data)) return;

      // Hide product/remedy notifications when mall is disabled
      if (data.type === "products" && !isShubhMallEnabled()) return;

      const isOnChatPage = window.location.pathname.includes("/chat-to-astrologer");
      const isOnLivePage = window.location.pathname.startsWith("/live");

      // Don't show if user is already on the chat page
      if (isOnChatPage) return;

      const astroInfo = lastAstrologerInfoRef.current;
      const senderName = astroInfo?.name || "Astrologer";
      const messageText = data.type === "gift" ? "🎁 Sent a gift" : data.type === "products" ? "💊 Suggested a remedy" : (data.message || data.response || "New message");

      rht.custom((t) => (
        <ChatNotificationBanner
          senderName={senderName}
          message={messageText}
          imageUrl={astroInfo?.image}
          gender={astroInfo?.gender}
          onClose={() => rht.dismiss(t.id)}
          onClick={() => {
            rht.dismiss(t.id);
            if (data.type === "products" && isOnLivePage) {
              window.dispatchEvent(new CustomEvent("live:open-remedy-panel"));
              return;
            }
            const astroId = data.astrologerId || activeChatRef.current?.astrologerId;
            if (astroId) {
              window.location.href = `/chat-to-astrologer/${astroId}`;
            }
          }}
        />
      ), { duration: 4000, position: isOnLivePage ? "top-center" : "top-right" });
    };

    voiceSocket.on("message:recieved", handleGlobalMessage);

    return () => {
      voiceSocket.off("message:recieved", handleGlobalMessage);
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
        chatApprovalData,
        setChatApprovalData,
        resetChatFlow,
        activeChatRoomId,
        setActiveChatRoomId,
        chatSeconds,
        startTimer,
        stopTimer,
        resetTimer,
        setChatSeconds,
        isReconnecting,
        reconnectToChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
