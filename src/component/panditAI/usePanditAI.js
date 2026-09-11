import { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
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
import { trackEvent } from "../../utils/analytics";

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

// The AI service answers with a generic fallback when it fails to produce a
// reading (e.g. "I couldn't process that request. Please try again."). Those
// replies arrive on the normal message channel, so match them here to render a
// retry affordance instead of a dead-end bubble.
const AI_FAILURE_PATTERN =
  /(couldn'?t|could ?not|unable to|can'?t)\s+(process|understand|generate|complete|answer)|something went wrong|try (again|asking again)\s*(later)?\.?$/i;

const isFailureReply = (data, text) =>
  data?.isError === true ||
  data?.error === true ||
  (!!text && text.length < 220 && AI_FAILURE_PATTERN.test(text));

// How long to wait for a reply before offering a retry instead of an endless
// "Typing..." indicator.
const RESPONSE_TIMEOUT_MS = 45000;

const makeAiErrorMessage = (text) => ({
  _id: `err-${Date.now()}-${Math.random()}`,
  text,
  sender: "ai",
  isError: true,
  createdAt: new Date().toISOString(),
  time: new Date()
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    .toUpperCase(),
});

// Delivery-status ordering so a later event never downgrades an earlier one
// (e.g. an out-of-order message:status shouldn't undo a read_ack).
const STATUS_RANK = { sending: 0, sent: 1, delivered: 2, read: 3 };
const rankStatus = (status) => STATUS_RANK[status] ?? 0;

const getLanguageMeta = (language) =>
  LANGUAGE_META[language] || {
    code: language?.split("-")?.[0] || DEFAULT_LANGUAGE.code,
    locale: language || DEFAULT_LANGUAGE.locale,
    name: DEFAULT_LANGUAGE.name,
  };

// Global flag so other socket handlers can skip Pandit AI events
let panditAIChatActive = false;
let panditAIRoomId = null;
// Flag to prevent session end when switching to voice mode
let panditAIVoiceHandover = false;
export const isPanditAIChatActive = () => panditAIChatActive;
export const setPanditAIChatActive = (active, roomId = null) => {
  panditAIChatActive = active;
  if (roomId !== null) panditAIRoomId = roomId;
};
export const setPanditAIVoiceHandover = (value) => { panditAIVoiceHandover = value; };
export const getPanditAIRoomId = () => panditAIRoomId;
export const isPanditAIEvent = (data = {}) =>
  data?.astrologerId === PANDIT_AI_ID ||
  data?.sender === PANDIT_AI_ID ||
  (data?.roomId && data.roomId === panditAIRoomId);

export default function usePanditAI({ isOpen, lang = "en-IN" }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [followupQuestions, setFollowupQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef(sessionStorage.getItem("panditai_roomId") || null);
  const initiatedRef = useRef(false);
  const historyLoadedRef = useRef(false);
  const pendingMessageRef = useRef(null);
  const sendTextRef = useRef(null);
  // Last question the user actually asked, so a failed reply can be retried
  // without making them retype it.
  const lastQuestionRef = useRef(null);
  const responseTimerRef = useRef(null);

  const clearResponseTimer = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, []);

  const startResponseTimer = useCallback(() => {
    clearResponseTimer();
    responseTimerRef.current = setTimeout(() => {
      responseTimerRef.current = null;
      setSending(false);
      setMessages((prev) => [
        ...prev,
        makeAiErrorMessage(
          "That took longer than usual and I didn't get a reply. Please try again."
        ),
      ]);
    }, RESPONSE_TIMEOUT_MS);
  }, [clearResponseTimer]);

  useEffect(() => clearResponseTimer, [clearResponseTimer]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);
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

  // Fetch previous chat history. Skip for guests (no userId) — firing this
  // unauthenticated would 401 and redirect them to the login screen.
  const { data: historyData, isLoading: historyLoading } = useGetChatHistoryQuery(
    { userId: PANDIT_AI_ID },
    { skip: !isOpen || !userIdLocal, refetchOnMountOrArgChange: true }
  );

  // Load history into messages once
  useEffect(() => {
    if (historyData?.data?.length && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      const mapped = [...historyData.data].reverse().map((msg) => ({
        _id: msg._id,
        messageId: msg.messageId || msg._id,
        seq: typeof msg.seq === "number" ? msg.seq : undefined,
        text: msg.message,
        sender: msg.sender === "user" ? "user" : "ai",
        // History user messages default to "read" (they've long been seen);
        // fall back to the server-provided status when present.
        status: msg.sender === "user" ? msg.status || "read" : msg.status || "sent",
        replyTo: msg.replyTo
          ? {
              messageId: msg.replyTo.messageId,
              content: msg.replyTo.message ?? msg.replyTo.content,
              role: msg.replyTo.sender === "user" ? "user" : "assistant",
            }
          : null,
        createdAt: msg.createdAt,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).toUpperCase(),
      }));
      setMessages(mapped);
    }
  }, [historyData]);

  // Ref placed at the start of the last AI message (set via lastAiMsgRef)
  const lastAiMsgRef = useRef(null);
  const scrollTimerRef = useRef(null);
  /*
    Mirrors `messages` so the scroll callback can stay referentially stable.
    It used to close over `messages` directly, so it got a new identity on every
    message change — and it sits in the dependency array of BOTH effects below.
    One new reply therefore re-ran both effects and queued two overlapping
    `scrollIntoView({ behavior: "smooth" })` animations on the same element.

    A smooth scroll runs for a few hundred milliseconds, so for roughly the first
    half-second after an answer appeared the reply text was still sliding under
    the cursor. Clicking the text in that window lands on whatever moved into
    that spot instead, and the natural response is to click again — which is the
    repeated-clicks-then-rage-click pattern seen on Pandit AI answers.
  */
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const scrollToLatestMessage = useCallback(() => {
    // At most one pending scroll: a newer request supersedes the older one
    // rather than animating alongside it.
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      const list = messagesRef.current;
      const lastMsg = list[list.length - 1];
      const isLastFromAi = lastMsg && lastMsg.sender !== "user";

      if (isLastFromAi && lastAiMsgRef.current) {
        // AI response: scroll so the top of the message is visible
        lastAiMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (messagesEndRef.current) {
        // User message or fallback: scroll to bottom so sent message is visible
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 150);
  }, []);

  // Don't leave a scroll queued against an unmounted chat.
  useEffect(
    () => () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    },
    []
  );

  useEffect(() => {
    scrollToLatestMessage();
  }, [messages.length, scrollToLatestMessage]);

  useEffect(() => {
    if (isOpen) scrollToLatestMessage();
  }, [isOpen, scrollToLatestMessage]);

  // Track AI Pandit open
  useEffect(() => {
    if (isOpen) trackEvent("ai_pandit_opened", { mode: "text" });
  }, [isOpen]);

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
      // Socket is back — clear the "Reconnecting…" state
      setChatDisabled(false);
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

    // Only disable input on an actual network drop — socket.io will auto-
    // reconnect and fire "connect", which triggers chat:reconnect above.
    const handleSocketDisconnect = () => {
      if (!chatEndedRef.current) setChatDisabled(true);
    };

    voiceSocket.on("connect", handleSocketReconnect);
    voiceSocket.on("disconnect", handleSocketDisconnect);

    return () => {
      voiceSocket.off("connect", handleSocketReconnect);
      voiceSocket.off("disconnect", handleSocketDisconnect);
    };
  }, [isOpen, userIdLocal, createChatRoom]);

  // End session when popup closes (skip if handing over to voice mode)
  useEffect(() => {
    if (isOpen) return;

    // Reset typing indicator when closed
    setSending(false);

    // If voice mode is taking over, don't end the session
    if (panditAIVoiceHandover) {
      panditAIVoiceHandover = false;
      initiatedRef.current = false;
      historyLoadedRef.current = false;
      return;
    }

    const currentRoomId = roomIdRef.current;
    if (currentRoomId && voiceSocket.connected && !chatEndedRef.current) {
      voiceSocket.emit("chat:end", {
        roomId: currentRoomId,
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
      });
      trackEvent("ai_pandit_session_ended", { mode: "text" });
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
          sendTextRef.current?.(pending.text, {
            silent: pending.echoed,
            clientMsgId: pending.clientMsgId,
            replyTo: pending.replyTo,
            replyToId: pending.replyToId,
          });
        } else {
          // Send default "Hi" message with kundli id when chat is accepted with no pending input
          sendTextRef.current?.("Hi", { kundliId: selectedKundli?._id || null, silent: true });
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
        // A message typed before the room was ready is queued in sendText. On
        // this path "chat:accepted" never fires, so flush it here or it would
        // be dropped silently and the user would think the app ignored them.
        const pending = pendingMessageRef.current;
        if (pending) {
          pendingMessageRef.current = null;
          sendTextRef.current?.(pending.text, {
            silent: pending.echoed,
            clientMsgId: pending.clientMsgId,
            replyTo: pending.replyTo,
            replyToId: pending.replyToId,
          });
        }
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

      clearResponseTimer();

      const text = data.message || data.response;
      const failed = isFailureReply(data, text);

      // Keep the internal _id unique and client-generated exactly as before
      // (React keys + lastAiMsgRef scroll depend on it). The server id, when
      // present, is stored separately for delivery/reply metadata only.
      const serverMessageId = data.messageId || data._id || null;
      // Incoming reply snapshot: { messageId, message, sender, type }.
      const incomingReplyTo = data.replyTo
        ? {
            messageId: data.replyTo.messageId,
            content: data.replyTo.message ?? data.replyTo.content,
            role: data.replyTo.sender === "user" ? "user" : "assistant",
          }
        : null;

      const msg = {
        _id: `msg-${Date.now()}-${Math.random()}`,
        messageId: serverMessageId,
        text,
        sender: "ai",
        isError: failed,
        replyTo: incomingReplyTo,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).toUpperCase(),
      };
      setMessages((prev) => [...prev, msg]);
      setSending(false);

      // Receiver got the message → tell the backend it's delivered, and since
      // the chat panel is open and in view, immediately mark it read too.
      // Only when we actually have a server id, so we never emit placeholders.
      const activeRoomId = roomIdRef.current;
      if (activeRoomId && voiceSocket.connected && !failed && serverMessageId) {
        voiceSocket.emit("message:delivered", {
          roomId: activeRoomId,
          messageIds: [serverMessageId],
        });
        if (typeof data.seq === "number") {
          voiceSocket.emit("message:read", {
            roomId: activeRoomId,
            lastReadSeq: data.seq,
          });
        }
      }
      trackEvent(
        failed ? "ai_pandit_response_failed" : "ai_pandit_response_received",
        { mode: "text" }
      );
    };

    const handleError = (err) => {
      console.error("[PanditAI] Socket error:", err);
      clearResponseTimer();
      // CONTENT_BLOCKED — remove the user's message (unsend it)
      if (err?.code === "CONTENT_BLOCKED") {
        setMessages((prev) => prev.slice(0, -1));
        setSending(false);
        return;
      }
      panditAIRoomId = null;
      panditAIChatActive = false;
      setSending(false);
      // Give the user something to act on instead of a silent stall.
      if (!err?.message?.toLowerCase?.().includes("insufficient balance")) {
        setMessages((prev) => [
          ...prev,
          makeAiErrorMessage(
            "I couldn't reach my readings just now. Please try again."
          ),
        ]);
      }
    };

    const handleRejected = () => {
      panditAIRoomId = null;
      panditAIChatActive = false;
    };

    const handleChatEnded = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      chatEndedRef.current = true;
      clearResponseTimer();
      setRoomId(null);
      panditAIRoomId = null;
      panditAIChatActive = false;
      clearChatSession();
      setMessages([]);
      setSending(false);
    };

    // Delivery-tick lifecycle for the user's own messages.
    //   message:ack       → server saved it            → single grey tick (sent)
    //   message:status    → receiver got it            → double grey tick (delivered)
    //   message:read_ack  → receiver read it (up to seq) → double blue tick (read)
    // AI Pandit's backend auto-marks the user's message delivered + read, so
    // all three fire for this feature with no extra work.
    const handleAck = (d) => {
      if (d?.roomId && roomIdRef.current && d.roomId !== roomIdRef.current) return;
      setMessages((prev) =>
        prev.map((m) => {
          // Correlate by clientMsgId (preferred) or the server messageId.
          const matches =
            (d?.clientMsgId && m.clientMsgId === d.clientMsgId) ||
            (d?.messageId && m.messageId === d.messageId);
          if (!matches || m.sender !== "user") return m;
          return {
            ...m,
            messageId: d.messageId || m.messageId,
            // Never downgrade a status that's already further along.
            status: rankStatus(m.status) >= rankStatus("sent") ? m.status : (d.status || "sent"),
          };
        })
      );
    };

    const handleStatus = (d) => {
      if (d?.roomId && roomIdRef.current && d.roomId !== roomIdRef.current) return;
      const ids = d?.messageIds || (d?.messageId ? [d.messageId] : []);
      const newStatus = d?.status || "delivered";
      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender !== "user") return m;
          const matches =
            (d?.clientMsgId && m.clientMsgId === d.clientMsgId) ||
            (m.messageId && ids.includes(m.messageId));
          if (!matches) return m;
          return rankStatus(newStatus) > rankStatus(m.status)
            ? { ...m, status: newStatus }
            : m;
        })
      );
    };

    const handleReadAck = (d) => {
      if (d?.roomId && roomIdRef.current && d.roomId !== roomIdRef.current) return;
      const lastReadSeq = d?.lastReadSeq;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender !== "user") return m;
          // Mark read up to lastReadSeq when a seq is present; otherwise mark
          // all outstanding user messages read (AI Pandit acks the latest send).
          const withinRead =
            typeof lastReadSeq === "number" && typeof m.seq === "number"
              ? m.seq <= lastReadSeq
              : true;
          if (!withinRead) return m;
          return rankStatus("read") > rankStatus(m.status)
            ? { ...m, status: "read" }
            : m;
        })
      );
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:reconnected", handleReconnected);
    voiceSocket.on("message:recieved", handleMessage);
    voiceSocket.on("message:ack", handleAck);
    voiceSocket.on("message:status", handleStatus);
    voiceSocket.on("message:read_ack", handleReadAck);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("error", handleError);

    const handleTyping = (isTyping) => {
      if (!isTyping) setSending(false);
    };
    voiceSocket.on("typing", handleTyping);

    const handleFollowup = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      if (data?.followupQuestions?.length) {
        setFollowupQuestions(data.followupQuestions);
      }
    };
    voiceSocket.on("ai_followup_questions", handleFollowup);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:reconnected", handleReconnected);
      voiceSocket.off("message:recieved", handleMessage);
      voiceSocket.off("message:ack", handleAck);
      voiceSocket.off("message:status", handleStatus);
      voiceSocket.off("message:read_ack", handleReadAck);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("error", handleError);
      voiceSocket.off("typing", handleTyping);
      voiceSocket.off("ai_followup_questions", handleFollowup);
    };
  }, [isOpen]);

  // Ref-based guard so sendText callback stays stable across send cycles
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  const sendText = useCallback(
    (text, options = {}) => {
      const trimmedText = text.trim();
      if (!trimmedText && !options.kundliId) return;

      setFollowupQuestions([]);

      // Client-generated id so message:ack can correlate the server messageId
      // back to this optimistic bubble and flip its tick sent → delivered → read.
      const clientMsgId = options.clientMsgId || `user-${Date.now()}-${Math.random()}`;
      // Snapshot of the message being replied to (rendered inside the bubble).
      const replyTo = options.replyTo || null;
      const replyToId = options.replyToId || replyTo?.messageId || null;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) {
        if (trimmedText) {
          // `echoed` records whether the bubble is already on screen, so the
          // flush below doesn't render the same question twice.
          pendingMessageRef.current = {
            text: trimmedText,
            echoed: !options.silent,
            clientMsgId,
            replyTo,
            replyToId,
          };
          lastQuestionRef.current = trimmedText;

          /*
           * `silent` means "the user's bubble is already on screen, don't echo
           * it again" — nothing more. It used to also skip the typing state and
           * the response timer, which made Retry a dead click whenever the room
           * had not come up: retryQuestion removes the error bubble and calls
           * this with silent:true, so the error vanished and absolutely nothing
           * replaced it. No typing dots, and no armed timer, so no second error
           * could ever appear either — the chat sat there permanently idle.
           * Echoing is conditional; showing that work is queued is not.
           */
          if (!options.silent) {
            setMessages((prev) => [
              ...prev,
              {
                _id: clientMsgId,
                clientMsgId,
                text: trimmedText,
                sender: "user",
                status: "sending",
                replyTo,
                createdAt: new Date().toISOString(),
                time: new Date()
                  .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                  .toUpperCase(),
              },
            ]);
          }
          setSending(true);
          startResponseTimer();
        }
        return;
      }

      setSending(true);
      startResponseTimer();
      const selectedLanguage = getLanguageMeta(lang);

      if (trimmedText) lastQuestionRef.current = trimmedText;

      if (trimmedText && !options.silent) {
        const userMsg = {
          _id: clientMsgId,
          clientMsgId,
          text: trimmedText,
          sender: "user",
          status: "sending",
          replyTo,
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }).toUpperCase(),
        };
        setMessages((prev) => [...prev, userMsg]);
        trackEvent("ai_pandit_question_asked", { mode: "text", question_length: trimmedText.length });
      }

      if (voiceSocket.connected) {
        const kundliId = options.kundliId !== undefined ? options.kundliId : (selectedKundli?._id || null);
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
          kundliId,
          // Delivery-tick + reply metadata (backend threads these through).
          clientMsgId,
          replyToId,
        });
        // The socket accepted it → advance the optimistic bubble off the clock
        // to a single tick immediately, so it never lingers on "sending" while
        // the AI composes. message:ack/status/read_ack then upgrade it.
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMsgId === clientMsgId && m.sender === "user" && rankStatus(m.status) < rankStatus("sent")
              ? { ...m, status: "sent" }
              : m
          )
        );
      } else {
        toast.error("Connection lost. Please try again.");
        setSending(false);
      }
    },
    [lang, userIdLocal, selectedKundli, startResponseTimer]
  );

  // Keep ref in sync so socket handlers can call latest sendText
  sendTextRef.current = sendText;

  /*
    Re-ask the last question after a failed reply. The user's bubble is still on
    screen, so send silently and drop the error bubble being retried.

    Returns null when the retry actually went out, or a reason string when it
    could not — the caller renders that reason inside the bubble that was
    tapped. Two things forced this shape:

      1. The order of operations was destructive. The error bubble was filtered
         out FIRST, then sendText was called. sendText's socket-down branch does
         nothing but `toast.error("Connection lost…")` + setSending(false), so a
         retry with no connection removed the bubble, left `sending` false (no
         typing dots), and answered only with a toast — which Clarity cannot see
         and which, in a portalled full-screen chat panel inside an in-app
         WebView, is top-right and easy to miss entirely. Nothing on screen
         changed, and the "Try again" button had gone with the bubble, so there
         was no second attempt available either. The 45s response timer stays
         armed in that branch, so the *only* eventual feedback was three quarters
         of a minute away.

         Clarity session 2vh07z (Instagram WebView, mobile, 43 clicks across ONE
         page in 3:28) sent a message at 02:53 that errored, tapped "Try again"
         at 03:05, and left. Twelve seconds — far inside the 45s window.

      2. The !question branch answered with a toast for the same reason, on the
         one control added specifically to rescue a dead-end bubble.

    So: check everything that can stop the send BEFORE touching the message
    list, and report back instead of firing a toast.
  */
  const retryQuestion = useCallback(
    (errorMessageId) => {
      const question = lastQuestionRef.current;
      // No remembered question — e.g. an error bubble restored from history in a
      // fresh session, where lastQuestionRef was never populated.
      if (!question) {
        return "I don't have that question saved any more — please type it again below.";
      }
      if (chatDisabled) {
        return "Still reconnecting to Pandit AI. Give it a moment, then tap Try again.";
      }
      // Mirrors sendText's own connectivity check. Queueing into
      // pendingMessageRef is no better here: with the socket down the room can
      // never come up, so it would sit as "Typing…" until the 45s timer fired.
      if (!voiceSocket.connected) {
        return "You look offline right now. Check your connection, then tap Try again.";
      }
      setMessages((prev) =>
        errorMessageId ? prev.filter((m) => m._id !== errorMessageId) : prev
      );
      trackEvent("ai_pandit_question_retried", { mode: "text" });
      sendText(question, { silent: true });
      return null;
    },
    [sendText, chatDisabled]
  );

  return {
    messages,
    isLoading: connecting || historyLoading,
    sending,
    chatDisabled,
    sendText,
    retryQuestion,
    followupQuestions,
    messagesEndRef,
    lastAiMsgRef,
    roomId: roomIdRef.current,
  };
}
