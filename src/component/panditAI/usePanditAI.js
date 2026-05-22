import { useState, useRef, useCallback, useEffect } from "react";
import {
  voiceSocket,
  registerChatSession,
  clearChatSession,
} from "../../services/voiceSocketServices";
import {
  useCreateChatRoomMutation,
  useGetChatHistoryQuery,
} from "../../redux/api/chatApi";
import toast from "../toast";

export const PANDIT_AI_ID = "6928390dc00d56953b586c04";
const DEFAULT_LANGUAGE = {
  code: "en",
  locale: "en-IN",
  name: "English",
};

const LANGUAGE_META = {
  "en-IN": DEFAULT_LANGUAGE,
  "hi-IN": { code: "hi", locale: "hi-IN", name: "Hindi" },
  "bn-IN": { code: "bn", locale: "bn-IN", name: "Bengali" },
  "ta-IN": { code: "ta", locale: "ta-IN", name: "Tamil" },
  "te-IN": { code: "te", locale: "te-IN", name: "Telugu" },
  "mr-IN": { code: "mr", locale: "mr-IN", name: "Marathi" },
  "gu-IN": { code: "gu", locale: "gu-IN", name: "Gujarati" },
  "kn-IN": { code: "kn", locale: "kn-IN", name: "Kannada" },
  "ml-IN": { code: "ml", locale: "ml-IN", name: "Malayalam" },
  "pa-IN": { code: "pa", locale: "pa-IN", name: "Punjabi" },
};

const getLanguageMeta = (language) =>
  LANGUAGE_META[language] || {
    code: language?.split("-")?.[0] || DEFAULT_LANGUAGE.code,
    locale: language || DEFAULT_LANGUAGE.locale,
    name: DEFAULT_LANGUAGE.name,
  };

// Global flag so other socket handlers can skip Pandit AI events
let panditAIChatActive = false;
let panditAIRoomId = null;
export const isPanditAIChatActive = () => panditAIChatActive;
export const setPanditAIChatActive = (active, roomId = null) => {
  panditAIChatActive = active;
  if (roomId !== null) panditAIRoomId = roomId;
};
export const isPanditAIEvent = (data = {}) =>
  data?.astrologerId === PANDIT_AI_ID ||
  data?.sender === PANDIT_AI_ID ||
  (data?.roomId && data.roomId === panditAIRoomId);

export default function usePanditAI({ isOpen, lang = "en-IN" }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef(sessionStorage.getItem("panditai_roomId") || null);
  const initiatedRef = useRef(false);
  const historyLoadedRef = useRef(false);
  const pendingMessageRef = useRef(null);
  const sendTextRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const [createChatRoom] = useCreateChatRoomMutation();
  const chatEndedRef = useRef(false);

  // Persist roomId to sessionStorage for reconnect on refresh
  const setRoomId = useCallback((id) => {
    roomIdRef.current = id;
    if (id) {
      sessionStorage.setItem("panditai_roomId", id);
    } else {
      sessionStorage.removeItem("panditai_roomId");
    }
  }, []);

  // Fetch previous chat history
  const { data: historyData, isLoading: historyLoading } = useGetChatHistoryQuery(
    { userId: PANDIT_AI_ID },
    { skip: !isOpen, refetchOnMountOrArgChange: true }
  );

  // Load history into messages once
  useEffect(() => {
    if (historyData?.data?.length && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      const mapped = [...historyData.data].reverse().map((msg) => ({
        _id: msg._id,
        text: msg.message,
        sender: msg.sender === "user" ? "user" : "ai",
        createdAt: msg.createdAt,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(mapped);
    }
  }, [historyData]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, scrollToBottom]);

  // Initiate chat session when bubble opens
  useEffect(() => {
    if (!isOpen || !userIdLocal) return;

    const initChat = async () => {
      setConnecting(true);
      chatEndedRef.current = false;

      // Ensure socket is connected (handles page refresh scenario)
      if (!voiceSocket.connected) {
        voiceSocket.io.opts.query = {
          userId: userIdLocal,
          role: "CUSTOMER",
        };
        voiceSocket.connect();
        // The handleSocketReconnect listener below will handle the rest once connected
        setConnecting(false);
        return;
      }

      const savedRoomId = roomIdRef.current;

      // If we have a saved roomId (page refresh), reconnect instead of initiating
      if (savedRoomId) {
        panditAIChatActive = true;
        panditAIRoomId = savedRoomId;
        registerChatSession({
          roomId: savedRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
        voiceSocket.emit("chat:reconnect", {
          roomId: savedRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
        setConnecting(false);
        return;
      }

      try {
        await createChatRoom({
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        }).unwrap();
      } catch (err) {
        console.log("[PanditAI] Room creation:", err?.data?.message || "exists");
      }

      panditAIChatActive = true;
      voiceSocket.emit("chat:initiate", {
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
      });

      setConnecting(false);
    };

    initChat();

    // Handle socket reconnect while chat is open
    const handleSocketReconnect = () => {
      const currentRoomId = roomIdRef.current;
      if (currentRoomId && !chatEndedRef.current) {
        console.log("[PanditAI] Socket reconnected, emitting chat:reconnect");
        panditAIChatActive = true;
        panditAIRoomId = currentRoomId;
        registerChatSession({
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
        voiceSocket.emit("chat:reconnect", {
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
      } else if (!chatEndedRef.current) {
        // No roomId yet, re-initiate
        panditAIChatActive = true;
        voiceSocket.emit("chat:initiate", {
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
      }
    };

    voiceSocket.on("connect", handleSocketReconnect);

    return () => {
      voiceSocket.off("connect", handleSocketReconnect);
    };
  }, [isOpen, userIdLocal, createChatRoom]);

  // End session when popup closes
  useEffect(() => {
    if (isOpen) return;

    const currentRoomId = roomIdRef.current;
    if (currentRoomId && voiceSocket.connected && !chatEndedRef.current) {
      voiceSocket.emit("chat:end", {
        roomId: currentRoomId,
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
      });
    }
    setRoomId(null);
    panditAIRoomId = null;
    initiatedRef.current = false;
    pendingMessageRef.current = null;
    panditAIChatActive = false;
    clearChatSession();
  }, [isOpen, userIdLocal, setRoomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentRoomId = roomIdRef.current;
      if (currentRoomId && voiceSocket.connected && !chatEndedRef.current) {
        voiceSocket.emit("chat:end", {
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
      }
      setRoomId(null);
      panditAIRoomId = null;
      initiatedRef.current = false;
      historyLoadedRef.current = false;
      pendingMessageRef.current = null;
      panditAIChatActive = false;
      clearChatSession();
    };
  }, [userIdLocal, setRoomId]);

  // Listen for socket events
  useEffect(() => {
    if (!isOpen) return;

    const handleChatRoom = (data) => {
      if (data?.roomId) {
        setRoomId(data.roomId);
        panditAIRoomId = data.roomId;
        registerChatSession({
          roomId: data.roomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
      }
    };

    const handleChatAccepted = (data) => {
      if (data?.roomId) {
        setRoomId(data.roomId);
        panditAIRoomId = data.roomId;
        registerChatSession({
          roomId: data.roomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
        // Only flush pending message after chat is fully accepted
        const pending = pendingMessageRef.current;
        if (pending) {
          pendingMessageRef.current = null;
          sendTextRef.current?.(pending);
        } else {
          // Send default automated "Hi" message when chat is accepted with no pending input
          sendTextRef.current?.("Hi");
        }
      }
    };

    const handleReconnected = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      console.log("[PanditAI] Chat reconnected:", data?.roomId);
      if (data?.roomId) {
        setRoomId(data.roomId);
        panditAIRoomId = data.roomId;
        panditAIChatActive = true;
        chatEndedRef.current = false;
      }
    };

    const handleMessage = (data) => {
      // Only handle messages for this astrologer
      if (
        data?.astrologerId !== PANDIT_AI_ID &&
        data?.sender !== PANDIT_AI_ID
      ) {
        return;
      }

      // Skip user's own messages — already added optimistically
      if (data.sender === "user") return;

      const msg = {
        _id: `msg-${Date.now()}-${Math.random()}`,
        text: data.message || data.response,
        sender: "ai",
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, msg]);
      setSending(false);
    };

    const handleError = (err) => {
      console.error("[PanditAI] Socket error:", err);
      // CONTENT_BLOCKED — remove the user's message (unsend it)
      if (err?.code === "CONTENT_BLOCKED") {
        setMessages((prev) => prev.slice(0, -1));
        setSending(false);
        return;
      }
      panditAIRoomId = null;
      panditAIChatActive = false;
      setSending(false);
    };

    const handleRejected = () => {
      panditAIRoomId = null;
      panditAIChatActive = false;
    };

    const handleChatEnded = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      chatEndedRef.current = true;
      setRoomId(null);
      panditAIRoomId = null;
      panditAIChatActive = false;
      clearChatSession();
      setMessages([]);
      setSending(false);
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:reconnected", handleReconnected);
    voiceSocket.on("message:recieved", handleMessage);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:reconnected", handleReconnected);
      voiceSocket.off("message:recieved", handleMessage);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("error", handleError);
    };
  }, [isOpen]);

  // Activity timeout — if no activity received for 60s, disable input & re-initiate
  useEffect(() => {
    if (!isOpen) return;

    const resetActivityTimeout = () => {
      setChatDisabled(false);
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = setTimeout(() => {
        console.log("[PanditAI] No activity for 60s, re-initiating chat");
        setChatDisabled(true);
        // Re-initiate chat
        if (voiceSocket.connected && userIdLocal) {
          panditAIChatActive = true;
          voiceSocket.emit("chat:initiate", {
            userId: userIdLocal,
            astrologerId: PANDIT_AI_ID,
          });
        }
      }, 60000);
    };

    const handleActivityTick = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      resetActivityTimeout();
    };

    const handleAcceptedTick = (data) => {
      if (data?.astrologerId === PANDIT_AI_ID) {
        resetActivityTimeout();
      }
    };

    voiceSocket.on("activity", handleActivityTick);
    voiceSocket.on("chat:accepted", handleAcceptedTick);

    return () => {
      voiceSocket.off("activity", handleActivityTick);
      voiceSocket.off("chat:accepted", handleAcceptedTick);
      clearTimeout(activityTimeoutRef.current);
    };
  }, [isOpen, userIdLocal]);

  // Ref-based guard so sendText callback stays stable across send cycles
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  const sendText = useCallback(
    (text) => {
      const trimmedText = text.trim();
      if (!trimmedText || sendingRef.current) return;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) {
        pendingMessageRef.current = trimmedText;
        return;
      }

      setSending(true);
      const selectedLanguage = getLanguageMeta(lang);

      const userMsg = {
        _id: `user-${Date.now()}`,
        text: trimmedText,
        sender: "user",
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, userMsg]);

      if (voiceSocket.connected) {
        voiceSocket.emit("chat:message", {
          sender: "user",
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          message: trimmedText,
          type: "message",
          language: selectedLanguage.locale,
          languageCode: selectedLanguage.code,
          targetLanguage: selectedLanguage.code,
          targetLanguageName: selectedLanguage.name,
        });
      } else {
        toast.error("Connection lost. Please try again.");
        setSending(false);
      }
    },
    [lang, userIdLocal]
  );

  // Keep ref in sync so socket handlers can call latest sendText
  sendTextRef.current = sendText;

  return {
    messages,
    isLoading: connecting || historyLoading,
    sending,
    chatDisabled,
    sendText,
    messagesEndRef,
    roomId: roomIdRef.current,
  };
}
