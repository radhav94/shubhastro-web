import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "../../../../../services/socketService";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import toast from "../../../../../component/toast";
import { useChat as useChatContext } from "../../../../../context/ChatContext"
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { useCall } from "../../../../../context/CallContext";
import { showErrorWithHighlight } from "../../../../../utils/showErrorWithHighlight";
import useTypingIndicator from "./useTypingIndicator";
import {
  MESSAGE_STATUS,
  mergeStatus,
  newClientMsgId,
  normalizeReplyTo,
  ACK_TIMEOUT_MS,
  MAX_SEND_RETRIES,
} from "../../../../../utils/helper/chatProtocol";

export default function useChat({
  userId,
  astrologerId,
  roomId,
  isUserSide,
  kundliId,
  setOpenFeedback,
  astrologerName,
  fullName,
  refreshKey = 0
}) {
  const { startTimer, stopTimer, chatSeconds, setActiveChat, activeChat, reconnectToChat } = useChatContext();
  const { activeCall, openReview } = useCall();
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isMessageDisabled, setIsMessageDisabled] = useState(false);
  const systemReconnectInFlightRef = useRef(false);
  const [hightLightText, setHighLightText] = useState("");

  // Typing indicator via new activity:update / activity contract
  const { isTyping, handleTextChange, handleMessageSent } = useTypingIndicator({ roomId, sender: "user" });

  // When the kundali iframe closes, the server may briefly think the user disconnected
  // and fire session-end errors. We ignore those for a short grace period.
  const ignoringSystemEndRef = useRef(false);

  // Fetch kundli profiles to get the "Self" profile
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  // Ref for header-selected kundli profile (from Redux store)
  const selectedKundliRef = useRef(selectedKundli);
  selectedKundliRef.current = selectedKundli;

  // In-memory guard so the initial greeting + kundli auto-share runs at most
  // once per mount. The `onConnected` handler fires synchronously on every
  // effect re-run (deps like activeChat / highlight text change often) and the
  // sessionStorage key is keyed by roomId — which can flip (temp → real) mid
  // connect, bypassing that guard and sending the kundli twice. This ref does
  // not depend on roomId, so the auto-share can only happen once.
  const initSentRef = useRef(false);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  // ─── Protocol message-state helpers ─────────────────────────────────────────
  // Retry timers keyed by clientMsgId so we can clear them on ack/failure.
  const retryTimersRef = useRef({});

  // Update a locally-tracked message identified by its client-generated id.
  const updateMessageByClientMsgId = useCallback((clientMsgId, patch) => {
    if (!clientMsgId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.clientMsgId === clientMsgId
          ? { ...m, ...patch, status: patch.status ? mergeStatus(m.status, patch.status) : m.status }
          : m
      )
    );
  }, []);

  // Update a message identified by its server messageId (used by status/read/star).
  const updateMessageByMessageId = useCallback((messageId, patch) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.messageId === messageId
          ? { ...m, ...patch, status: patch.status ? mergeStatus(m.status, patch.status) : m.status }
          : m
      )
    );
  }, []);

  // Advance all of MY sent messages up to the read watermark to `read` (blue
  // ✓✓). Primary key is `seq`; when it's absent (live messages often arrive
  // without a server seq) we fall back to the timestamp watermark `lastReadAt`
  // so the blue tick still advances.
  const markSentMessagesReadUpToSeq = useCallback((lastReadSeq, lastReadAt) => {
    const hasSeq = typeof lastReadSeq === "number";
    const readAtMs = lastReadAt ? new Date(lastReadAt).getTime() : NaN;
    const hasTime = !Number.isNaN(readAtMs);
    if (!hasSeq && !hasTime) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.sender) return m;
        const bySeq = hasSeq && typeof m.seq === "number" && m.seq <= lastReadSeq;
        const byTime = hasTime && m.dateTime && new Date(m.dateTime).getTime() <= readAtMs;
        return bySeq || byTime
          ? { ...m, status: mergeStatus(m.status, MESSAGE_STATUS.READ) }
          : m;
      })
    );
  }, []);

  console.log("::",messages,"/",error)

  const handleChatEndedFromServer = (data) => {
    // SYSTEM ends are treated as transient transport failures; attempt reconnect
    // instead of tearing down the active chat session.
    if (data?.endedBy === 'SYSTEM') {
      ignoringSystemEndRef.current = true;
      setTimeout(() => { ignoringSystemEndRef.current = false; }, 10000);

      if (!systemReconnectInFlightRef.current) {
        systemReconnectInFlightRef.current = true;
        reconnectToChat?.(activeChat);
        setTimeout(() => {
          systemReconnectInFlightRef.current = false;
        }, 10000);
      }

      return;
    }

    // Non-SYSTEM ends are handled by the global handler (WaitingQueueContext).
    // It clears activeChat, stops timer, shows toast, and dispatches "global:chat:ended".
    // Page-level feedback/UI is handled via the "global:chat:ended" event listener below.
  };

  useEffect(() => {
    if (activeChat?.astrologerId !== astrologerId && activeCall?.astrologerId !== astrologerId) setIsMessageDisabled(true)
    if (!roomId || !userId || !astrologerId) return;
    socketService.connect({
      onConnected: () => {
        if (
          Object.keys(activeChat || {}).length > 0 ||
          (activeCall && activeCall.astrologerId === astrologerId)
        ) {
          //Check if chat is active or there's an active call with this astrologer
          startTimer(); //Start timer only when there is active chat
          setIsMessageDisabled(false);

          // Store chat start time for elapsed time calculation (if not already set)
          // Use localStorage so it persists across page refreshes
          if (!localStorage.getItem("shubhtalk_chat_start_time")) {
            localStorage.setItem(
              "shubhtalk_chat_start_time",
              String(Date.now()),
            );
          }

          // Check if initial messages were already sent for this room (persists across remounts/reconnects)
          const sentKey = `shubhtalk_chat_init_${roomId}`;
          const alreadySent = sessionStorage.getItem(sentKey);

          //Send msg first time only
          if (!refreshKey && !alreadySent && !initSentRef.current) {
            initSentRef.current = true;
            sessionStorage.setItem(sentKey, "true");

            // Check if there's an AI initial query stored
            const aiInitialQuery = localStorage.getItem("aiInitialQuery");

            if (aiInitialQuery) {
              // Send the AI query directly
              sendMessage(aiInitialQuery);
              localStorage.removeItem("aiInitialQuery");
            } else {
              // Regular greeting message. Prefer `astrologerName` — it is the
              // userName-first display name. `fullName` carries the
              // astrologer's real first + last name, so it's only a fallback.
              sendMessage(`Hi ${astrologerName || fullName || ""}`);
            }

            // Find the kundli profile to send — use header-selected profile from Redux store
            const sendKundliWhenReady = (retries = 10) => {
              const currentProfiles = profilesRef.current;
              const headerProfile = selectedKundliRef.current;
              const selfProfile = currentProfiles.find(
                (profile) => profile.relation === "Self",
              );
              const profileIdToUse = headerProfile?._id || selfProfile?._id || kundliId;

              if (profileIdToUse) {
                sendMessage(profileIdToUse, "kundli", profileIdToUse);
              } else if (retries > 0) {
                setTimeout(() => sendKundliWhenReady(retries - 1), 500);
              }
            };

            setTimeout(() => sendKundliWhenReady(), 300);
          } else if (alreadySent) {
            console.log(
              "[ChatWindow] ⏭️ Initial messages already sent for room:",
              roomId,
              "— skipping",
            );
          }
        }
      },
      onError: (errMsg) => {
        // If we're in the grace period after iframe close, ignore session-end errors
        if (
          ignoringSystemEndRef.current &&
          (errMsg === "Chat no longer available" ||
            errMsg === "Chat has already ended" ||
            errMsg === "Session not found")
        ) {
          return;
        }

        console.log("ErrMsg::",hightLightText)

        showErrorWithHighlight(errMsg);

        // toast.error(errMsg + " error" || "Something went wrong");
        setError(errMsg);
        if (
          errMsg === "Chat no longer available" ||
          errMsg === "Chat has already ended" ||
          errMsg === "Session not found"
        ) {
          setIsMessageDisabled(true);
          stopTimer();
          setActiveChat(null);
        }
        // setHighLightText("")
      },
      onWarn: (msg) => {
        toast.warning(msg + " warning" || "Something went wrong");
      },
    });

    // Normalize any incoming message payload (legacy `message:recieved`, new
    // `message:received`, or an `undelivered_batch` item) into our local shape
    // and append it — deduping against messages we already have so the legacy
    // + structured events (which can both fire) never render twice.
    const addIncomingMessage = (data) => {
      const isSenderUser = data.sender === "user";

      // Parse gift messages (detect by type === "gift")
      let messageText = data.message;
      let giftData = null;

      if (data.type === "gift") {
        try {
          const parsed = JSON.parse(data.message);
          messageText = parsed.text;
          giftData = parsed.giftData;
        } catch (e) {
          console.error("Failed to parse gift message:", e);
        }
      }

      const messageId = data.messageId || data._id || null;
      const clientMsgId = data.clientMsgId || null;
      const dateTime = data.timestamp || data.createdAt || data.dateTime || new Date().toISOString();

      setMessages((prev) => {
        // Match an existing message by explicit ids first.
        let matchIdx = prev.findIndex(
          (m) =>
            (messageId && m.messageId === messageId) ||
            (clientMsgId && m.clientMsgId === clientMsgId)
        );

        // Fallback for the legacy echo of MY OWN message when the server did not
        // round-trip clientMsgId: match a still-optimistic (no messageId) user
        // message with identical text + type. Prevents a duplicate bubble.
        if (matchIdx === -1 && isSenderUser && !messageId && !clientMsgId) {
          matchIdx = prev.findIndex(
            (m) =>
              m.sender === true &&
              !m.messageId &&
              m.text === messageText &&
              (m.type || "message") === (data.type || "message")
          );
        }

        if (matchIdx !== -1) {
          // Backfill protocol fields (seq/messageId/replyTo) onto the existing
          // entry instead of duplicating it.
          return prev.map((m, i) => {
            if (i !== matchIdx) return m;
            return {
              ...m,
              messageId: m.messageId || messageId,
              seq: typeof m.seq === "number" ? m.seq : data.seq,
              replyTo: m.replyTo || normalizeReplyTo(data.replyTo),
            };
          });
        }

        return [
          ...prev,
          {
            text: messageText,
            // `sender` is a boolean: true = this user sent it. The render layer
            // maps it to `isSender`. Preserving this keeps existing UI working.
            sender: isSenderUser,
            time: formatTime(),
            dateTime,
            type: data.type,
            giftData,
            kundliName: data?.kundliName,
            suggestedProducts: data?.suggestedProducts,
            kundliId: data?.kundliId,
            // Protocol fields
            messageId,
            clientMsgId,
            seq: typeof data.seq === "number" ? data.seq : undefined,
            replyTo: normalizeReplyTo(data.replyTo),
            starred: !!data.starred,
            // Ticks only render for OUR sent messages. A legacy echo of our own
            // message keeps whatever status the optimistic entry already has;
            // incoming (other-party) messages have no tick.
            status: isSenderUser ? MESSAGE_STATUS.SENT : undefined,
          },
        ];
      });
    };

    // Confirm delivery of messages we just received (guide §4).
    const confirmDelivery = (roomIdForMsg, messageIds) => {
      const ids = (messageIds || []).filter(Boolean);
      if (!roomIdForMsg || ids.length === 0) return;
      if (voiceSocket.connected) {
        voiceSocket.emit("message:delivered", { roomId: roomIdForMsg, messageIds: ids });
      }
    };

    // LEGACY: `message:recieved` (misspelled) still fires to the whole room for
    // backward compatibility. Keep handling it, but dedupe (see addIncomingMessage).
    const handleLegacyMessage = (data) => {
      addIncomingMessage(data);
    };

    // NEW: structured recipient event. Includes seq + replyTo, and requires a
    // delivery confirmation back to the server.
    const handleReceivedMessage = (data) => {
      addIncomingMessage(data);
      const msgId = data.messageId || data._id;
      if (msgId) confirmDelivery(data.roomId || roomId, [msgId]);
    };

    // ✓ Single tick — server saved MY message. Promote pending → sent and store
    // the server-assigned messageId + seq for future status/read updates.
    const handleAck = (data) => {
      if (!data?.clientMsgId) return;
      clearTimeout(retryTimersRef.current[data.clientMsgId]);
      delete retryTimersRef.current[data.clientMsgId];
      updateMessageByClientMsgId(data.clientMsgId, {
        messageId: data.messageId,
        seq: typeof data.seq === "number" ? data.seq : undefined,
        status: MESSAGE_STATUS.SENT,
        dateTime: data.timestamp || undefined,
      });
    };

    // ✓✓ Grey — MY messages were delivered to the other party.
    const handleStatus = (data) => {
      if (data?.status !== "delivered") return;
      (data.messageIds || []).forEach((id) =>
        updateMessageByMessageId(id, { status: MESSAGE_STATUS.DELIVERED })
      );
    };

    // ✓✓ Blue — the other party read MY messages up to lastReadSeq (or the
    // lastReadAt timestamp when seq isn't available).
    const handleReadAck = (data) => {
      if (data?.roomId && data.roomId !== roomId) return;
      markSentMessagesReadUpToSeq(data?.lastReadSeq, data?.lastReadAt);
    };

    // Offline delivery: messages the other party sent while we were away.
    const handleUndeliveredBatch = (data) => {
      const batch = data?.messages || [];
      batch.forEach((msg) =>
        addIncomingMessage({
          messageId: msg._id || msg.messageId,
          roomId: msg.roomId,
          message: msg.message,
          sender: msg.sender,
          seq: msg.seq,
          type: msg.type,
          replyTo: msg.replyTo,
          kundliName: msg.kundliName,
          suggestedProducts: msg.suggestedProducts,
          kundliId: msg.kundliId,
          starred: msg.starred,
          createdAt: msg.createdAt,
        })
      );
      // Note: global delivery confirmation is handled centrally in
      // voiceSocketServices; we only render here.

      // READ RECEIPT for offline messages. The delivery ACK for this batch is
      // emitted globally (voiceSocketServices), but the READ ACK was previously
      // only fired as a side-effect of the ChatWindow read-receipt effect —
      // which races with `isMessageDisabled`/mount timing when coming back
      // online, so the astrologer's ticks stalled at "delivered". Here we
      // proactively emit `message:read` for the batch, mirroring the delivery
      // path. Guarded so we only claim "read" when the user is actually
      // viewing THIS conversation (tab visible + chat active for this room).
      const isViewingThisRoom =
        typeof document === "undefined" || document.visibilityState === "visible";
      const isActiveHere =
        activeChat?.roomId === roomId || activeChat?.astrologerId === astrologerId;
      if (!isViewingThisRoom || !isActiveHere) return;

      // Watermark = highest seq / latest timestamp among the OTHER party's
      // messages in this batch (mine echoed back shouldn't advance a read).
      let maxSeq = 0;
      let maxAt = 0;
      for (const msg of batch) {
        if ((msg.roomId || roomId) !== roomId) continue;
        if (msg.sender === "user") continue; // skip my own messages
        if (typeof msg.seq === "number" && msg.seq > maxSeq) maxSeq = msg.seq;
        const at = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
        if (at > maxAt) maxAt = at;
      }
      if (maxSeq > 0 || maxAt > 0) {
        markMessagesRead?.(maxSeq, { immediate: true, lastReadAt: maxAt });
      }
    };

    // Star / unstar confirmations from the server.
    const handleStarred = (data) => {
      const id = data?.messageId;
      if (!id) return;
      setMessages((prev) => prev.map((m) => (m.messageId === id ? { ...m, starred: true } : m)));
    };
    const handleUnstarred = (data) => {
      const id = data?.messageId;
      if (!id) return;
      setMessages((prev) => prev.map((m) => (m.messageId === id ? { ...m, starred: false } : m)));
    };

    const handleWarning = (msg) => {
      toast.warning(msg.message);
    }

    voiceSocket.on("message:recieved", handleLegacyMessage);
    voiceSocket.on("message:received", handleReceivedMessage);
    voiceSocket.on("message:ack", handleAck);
    voiceSocket.on("message:status", handleStatus);
    voiceSocket.on("message:read_ack", handleReadAck);
    voiceSocket.on("message:undelivered_batch", handleUndeliveredBatch);
    voiceSocket.on("message:starred", handleStarred);
    voiceSocket.on("message:unstarred", handleUnstarred);
    voiceSocket.on("warning", handleWarning);
    voiceSocket.on("chat:ended", handleChatEndedFromServer);

    return () => {
      voiceSocket.off("message:recieved", handleLegacyMessage);
      voiceSocket.off("message:received", handleReceivedMessage);
      voiceSocket.off("message:ack", handleAck);
      voiceSocket.off("message:status", handleStatus);
      voiceSocket.off("message:read_ack", handleReadAck);
      voiceSocket.off("message:undelivered_batch", handleUndeliveredBatch);
      voiceSocket.off("message:starred", handleStarred);
      voiceSocket.off("message:unstarred", handleUnstarred);
      voiceSocket.off("warning", handleWarning);
      voiceSocket.off("chat:ended", handleChatEndedFromServer);
    };
  }, [roomId, activeChat, activeCall, reconnectToChat, hightLightText, updateMessageByClientMsgId, updateMessageByMessageId, markSentMessagesReadUpToSeq]);

  // Listen for global chat:ended event (fired from WaitingQueueContext)
  // Handles page-level actions: disabling input and showing feedback modal
  useEffect(() => {
    const handleGlobalChatEnded = (e) => {
      const data = e.detail;
      // Only react if this chat page matches the ended chat
      if (data?.astrologerId && data.astrologerId !== astrologerId) return;

      setIsMessageDisabled(true);

      // Don't show feedback if call review is already open or there's an active call
      if (!openReview && !activeCall) {
        setOpenFeedback(true);
      }
    };

    window.addEventListener("global:chat:ended", handleGlobalChatEnded);
    return () => window.removeEventListener("global:chat:ended", handleGlobalChatEnded);
  }, [astrologerId, activeCall, openReview, setOpenFeedback]);

  // Re-enable input and timer when activeChat is restored after reconnect
  useEffect(() => {
    if (activeChat?.astrologerId === astrologerId && activeChat?.roomId) {
      setIsMessageDisabled(false);
      startTimer();
    }
  }, [activeChat?.roomId, activeChat?.astrologerId, astrologerId]);

  // ─── Message Queue (for offline/disconnected sends) ─────────────────────────
  const messageQueueRef = useRef([]);

  // Flush queued messages when socket reconnects
  useEffect(() => {
    const flushQueue = () => {
      if (messageQueueRef.current.length === 0) return;
      console.log("[ChatWindow] 🔄 Flushing", messageQueueRef.current.length, "queued messages");
      const queue = [...messageQueueRef.current];
      messageQueueRef.current = [];
      queue.forEach((payload) => {
        voiceSocket.emit("chat:message", payload);
        // Restart the ack-timeout watchdog now that the queued send actually left.
        if (payload.clientMsgId) armAckTimeout(payload, 0);
      });
    };

    voiceSocket.on("connect", flushQueue);
    return () => voiceSocket.off("connect", flushQueue);
  }, []);

  // Retry watchdog: if `message:ack` doesn't arrive within ACK_TIMEOUT_MS,
  // resend the SAME payload (same clientMsgId → server dedupes) up to
  // MAX_SEND_RETRIES, then mark the message failed. (guide §14)
  const armAckTimeout = useCallback(
    (payload, retryCount = 0) => {
      const { clientMsgId } = payload;
      if (!clientMsgId) return;
      clearTimeout(retryTimersRef.current[clientMsgId]);
      retryTimersRef.current[clientMsgId] = setTimeout(() => {
        setMessages((prev) => {
          const msg = prev.find((m) => m.clientMsgId === clientMsgId);
          // Already acknowledged (has messageId or advanced past pending) → stop.
          if (!msg || msg.messageId || msg.status !== MESSAGE_STATUS.PENDING) return prev;

          if (retryCount < MAX_SEND_RETRIES) {
            if (voiceSocket.connected) {
              voiceSocket.emit("chat:message", payload);
            }
            armAckTimeout(payload, retryCount + 1);
            return prev;
          }
          // Retries exhausted.
          return prev.map((m) =>
            m.clientMsgId === clientMsgId ? { ...m, status: MESSAGE_STATUS.FAILED } : m
          );
        });
      }, ACK_TIMEOUT_MS);
    },
    []
  );

  // USER SEND — optimistic UI + idempotency + retry. Backward-compatible
  // signature: sendMessage(text, type, kundliID, options?).
  const sendMessage = (text, type = "message", kundliID = null, options = {}) => {
    console.log("sendMessage", text);
    setHighLightText(text);

    // Clear typing state immediately on send
    handleMessageSent();

    const clientMsgId = newClientMsgId();
    const replyTo = options?.replyTo || null;
    const replyToId = replyTo?.messageId || replyTo?._id || options?.replyToId || null;

    const payload = {
      sender: "user",
      kundliId: kundliID ?? kundliId,
      roomId,
      userId,
      astrologerId,
      message: text,
      type,
      clientMsgId,
      ...(replyToId ? { replyToId } : {}),
    };

    // Optimistic UI: show the message immediately as pending (⏱ / no tick).
    let optimisticText = text;
    let giftData = null;
    if (type === "gift") {
      try {
        const parsed = JSON.parse(text);
        optimisticText = parsed.text;
        giftData = parsed.giftData;
      } catch { /* leave as-is */ }
    }
    addMessage({
      text: optimisticText,
      sender: true, // true = this user sent it
      time: formatTime(),
      dateTime: new Date().toISOString(),
      type,
      giftData,
      kundliId: payload.kundliId,
      clientMsgId,
      messageId: null,
      seq: undefined,
      status: MESSAGE_STATUS.PENDING,
      replyTo: replyTo ? normalizeReplyTo(replyTo) : null,
      starred: false,
    });

    if (voiceSocket.connected) {
      voiceSocket.emit("chat:message", payload);
      armAckTimeout(payload, 0);
      return;
    }

    // Socket disconnected — queue the message for delivery on reconnect. It
    // stays `pending` until the flush sends it and the ack arrives.
    messageQueueRef.current.push(payload);
    console.log("[ChatWindow] 📦 Message queued (socket disconnected). Queue size:", messageQueueRef.current.length);
  };

  // Manual retry for a message that reached `failed` state.
  const retryMessage = useCallback(
    (clientMsgId) => {
      if (!clientMsgId) return;
      const msg = messages.find((m) => m.clientMsgId === clientMsgId);
      if (!msg) return;

      const payload = {
        sender: "user",
        kundliId: msg.kundliId ?? kundliId,
        roomId,
        userId,
        astrologerId,
        message: msg.text,
        type: msg.type || "message",
        clientMsgId,
        ...(msg.replyTo?.messageId ? { replyToId: msg.replyTo.messageId } : {}),
      };

      updateMessageByClientMsgId(clientMsgId, { status: MESSAGE_STATUS.PENDING });

      if (voiceSocket.connected) {
        voiceSocket.emit("chat:message", payload);
        armAckTimeout(payload, 0);
      } else {
        messageQueueRef.current.push(payload);
      }
    },
    [messages, kundliId, roomId, userId, astrologerId, armAckTimeout, updateMessageByClientMsgId]
  );

  // Star / unstar a message (guide §7). Idempotent server-side.
  const starMessage = useCallback(
    (messageId) => {
      if (!messageId || !voiceSocket.connected) return;
      voiceSocket.emit("message:star", { messageId, roomId });
    },
    [roomId]
  );
  const unstarMessage = useCallback(
    (messageId) => {
      if (!messageId || !voiceSocket.connected) return;
      voiceSocket.emit("message:unstar", { messageId });
    },
    []
  );

  // Read receipts: report the read watermark of the OTHER party's messages the
  // user has seen. `seq` is the ideal key, but live socket messages often
  // arrive WITHOUT a server-assigned seq (only history/ack messages carry one),
  // so we ALSO track a timestamp watermark (`lastReadAt`) which every message
  // has. This is why the receipt previously only worked after a reload — on a
  // live session otherPartyMax(seq) stayed 0. Debounced to avoid flooding.
  const readDebounceRef = useRef(null);
  const lastReadSeqRef = useRef(0);
  const lastReadAtRef = useRef(0); // ms epoch of the latest read message
  // Watermark we still owe the server but couldn't send (socket was down, e.g.
  // it dropped while the tab was backgrounded). Flushed on the next `connect`.
  const pendingReadRef = useRef(null); // { seq, at } | null

  // Actually push the read receipt to the server. Falls back to queueing when
  // the socket is momentarily disconnected so a re-focus after the socket
  // dropped still reports the read once it reconnects.
  const flushReadReceipt = useCallback(
    (seq, atMs) => {
      const hasSeq = typeof seq === "number" && seq > 0;
      const hasTime = typeof atMs === "number" && atMs > 0;
      if ((!hasSeq && !hasTime) || !roomId) return;
      const payload = { roomId };
      if (hasSeq) payload.lastReadSeq = seq;
      if (hasTime) payload.lastReadAt = new Date(atMs).toISOString();
      if (voiceSocket.connected) {
        voiceSocket.emit("message:read", payload);
        pendingReadRef.current = null;
      } else {
        // Can't send now — remember the highest watermark and let the connect
        // handler emit it once the socket is back.
        const prev = pendingReadRef.current || { seq: 0, at: 0 };
        pendingReadRef.current = {
          seq: Math.max(prev.seq, hasSeq ? seq : 0),
          at: Math.max(prev.at, hasTime ? atMs : 0),
        };
      }
    },
    [roomId]
  );

  // Mark messages read up to a watermark. `lastReadSeq` may be 0/undefined for
  // live messages that lack a server seq; `lastReadAt` (ms epoch) is the
  // reliable fallback. Emits when EITHER watermark advances. Debounced by
  // default; pass `{ immediate: true }` to emit right away (used on tab
  // refocus, so the receipt isn't delayed or lost to a background throttle).
  const markMessagesRead = useCallback(
    (lastReadSeq, { immediate = false, lastReadAt } = {}) => {
      const seq = typeof lastReadSeq === "number" ? lastReadSeq : 0;
      const atMs = typeof lastReadAt === "number" ? lastReadAt : 0;
      const seqAdvances = seq > lastReadSeqRef.current;
      const timeAdvances = atMs > lastReadAtRef.current;
      if (!seqAdvances && !timeAdvances) return;
      if (seqAdvances) lastReadSeqRef.current = seq;
      if (timeAdvances) lastReadAtRef.current = atMs;
      clearTimeout(readDebounceRef.current);
      if (immediate) {
        flushReadReceipt(lastReadSeqRef.current, lastReadAtRef.current);
        return;
      }
      readDebounceRef.current = setTimeout(
        () => flushReadReceipt(lastReadSeqRef.current, lastReadAtRef.current),
        500
      );
    },
    [flushReadReceipt]
  );

  // If a read receipt couldn't be sent because the socket was down, flush it
  // as soon as the socket reconnects.
  useEffect(() => {
    const flushPendingRead = () => {
      if (pendingReadRef.current) flushReadReceipt(pendingReadRef.current.seq, pendingReadRef.current.at);
    };
    voiceSocket.on("connect", flushPendingRead);
    return () => voiceSocket.off("connect", flushPendingRead);
  }, [flushReadReceipt]);

  // Clear any pending retry / read-receipt timers when the chat unmounts so we
  // don't fire stray resends or reads after the user leaves the screen.
  useEffect(() => {
    const timers = retryTimersRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
      clearTimeout(readDebounceRef.current);
    };
  }, []);

  // ASTRO SEND
  const astroReply = (text) => {
    if (!voiceSocket.connected) {
      setError("Socket not connected, try again.");
      return;
    }

    voiceSocket.emit("astrologer_sent_message", {
      sender: astrologerId,
      roomId,
      userId,
      astrologerId,
      message: text,
    });

    addMessage({
      text,
      sender: "astro",
      isSender: !isUserSide,
      time: formatTime(),
    });
  };

  //  typing is now handled by useTypingIndicator hook

  return {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    handleTextChange,
    chatSeconds,
    isMessageDisabled,
    setIsMessageDisabled,
    remainingTime: activeChat?.remainingTime || 0,
    handleChatEndedFromServer,
    // WhatsApp-style protocol helpers
    retryMessage,
    starMessage,
    unstarMessage,
    markMessagesRead,
  };
}
