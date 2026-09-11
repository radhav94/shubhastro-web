import { useLayoutEffect, useMemo, useState, useRef, useEffect, useCallback } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { useInactivityTimer } from "../../../../../utils/hooks/useInactivityTimer";
import InactivityModal from "../../../../../component/UI/modal/inActivity/InactivityModal";
import { useCall } from "../../../../../context/CallContext";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatFooter from "./ChatFooter";
import FloatingActions from "./FloatingActions";
import useChatSocket from "./useChatSocket";
import Feedback from "./Feedback";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
import { trackEvent } from "../../../../../utils/analytics";
import { Toast } from "../../../../../component";
import dayjs from "dayjs";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

// Import SVG icons
import CallIcon from "../../../../../assets/chat/Call.svg";
import VideocamIcon from "../../../../../assets/chat/Videocam.svg";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");
const MIN_CHAT_SECONDS = 0;

import { useGetS3SignedUrlMutation } from "../../../../../redux/api/s3SignedApi";
import { useGetAstrologerByIdQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import SwitchWaitingPopup from "../../../../../component/UI/switchWaiting/SwitchWaitingPopup";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import { PATH } from "../../../../../utils/routes/Paths";
import ProfileListingModal from "../../../../../component/UI/Profile/ProfileListingModal";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import GiftModal from "../../../../../component/call/GiftModal";
import { ProfileManager } from "../../../../../component/UI/Profile";
import { useChat as useChatContext } from "../../../../../context/ChatContext";
import RechargeModal from "../../../../../component/recharge-modal/RechargeModal";
import useAstrologerAvailability from "../../../../../utils/hooks/useAstrologerAvailability";

import { getAstrologerImageUrl } from "../../../../../utils/appImages";
import { sortBySeq, MESSAGE_STATUS, normalizeReplyTo, replyPreviewLabel } from "../../../../../utils/helper/chatProtocol";
const ChatWindow = () => {
  const messagesRef = useRef(null);
  const chatPageRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id: urlAstrologerId } = useParams();
  const {
    userId: stateUserId,
    astrologerId: stateAstrologerId,
    roomId: stateRoomId,
    fullName: stateFullName,
    isUserSide: stateIsUserSide,
    kundliId: stateKundliId,
    astrologerName: stateAstrologerName,
    refreshKey: stateRefreshKey,
    astroID: stateAstroID,
    experience: stateExperience,
    profileImgUrl: stateProfileImgUrl,
    gender: stateGender
  } = state || {};
  const astrologerId = stateAstrologerId || urlAstrologerId;

  // Always customer side — this app is the customer-facing frontend
  const isUserSide = stateIsUserSide ?? true;

  const { activeCall, isCallMinimized, reviewData } = useCall();
  const [openFeedback, setOpenFeedback] = useState(false);

  // Astrologer availability (chat/call/video) for the connected session.
  // Used to hide the Voice/Video buttons when the astrologer disabled them.
  const astroAvailability = useAstrologerAvailability(astrologerId, {
    enabled: !!isUserSide,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileManagerModal, setShowProfileManagerModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const { activeChat, isReconnecting } = useChatContext();

  // Fetch astrologer profile to get the correct/up-to-date avatar
  const { data: astrologerProfileData } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId }
  );

  // Resolve values: prefer navigation state, fall back to activeChat, then API data (for new tab scenarios)
  const userId = stateUserId || activeChat?.userId || localStorage.getItem("shubhtalk_customer_id");
  const roomId = stateRoomId || activeChat?.roomId;
  const fullName = stateFullName || activeChat?.fullName || activeChat?.callerName;
  const kundliId = stateKundliId || activeChat?.kundliId;
  // userName-first. The profile API (keyed on this chat's astrologerId) is the
  // authoritative source for `userName`, so prefer it — navigation state /
  // activeChat can carry an older name captured at connect time (e.g. from the
  // live flow, which only had the real first + last name).
  const astrologerName =
    getAstrologerDisplayName(astrologerProfileData?.data) ||
    stateAstrologerName ||
    activeChat?.astrologerName ||
    astrologerProfileData?.data?.astrologerName ||
    "";
  const refreshKey = stateRefreshKey;
  const astroID = stateAstroID || activeChat?.astrologerID;
  const experience = stateExperience || activeChat?.experience || astrologerProfileData?.data?.experience || "";

  // Capture astrologerID (numeric) for review submission - persists after activeChat is cleared
  const lastAstrologerIDRef = useRef(astroID || null);
  useEffect(() => {
    if (activeChat?.astrologerID) {
      lastAstrologerIDRef.current = activeChat.astrologerID;
    }
  }, [activeChat?.astrologerID]);

  // Resolve profileImgUrl: prefer fresh API data; only use fallbacks while API is loading.
  //
  // The chat avatars render at roughly 28-40px, so ask for the `small` (100x125)
  // derivative rather than the unresized original that `profileImgUrl` points at.
  // getAstrologerImageUrl falls back to profileImgUrl on its own, which also
  // covers the fallback branch below — navigation state, activeChat and the
  // query param all carry only the bare URL.
  const profileImgUrl = astrologerProfileData
    ? (getAstrologerImageUrl(astrologerProfileData?.data, "small") || "")
    : (stateProfileImgUrl || activeChat?.profileImgUrl || (() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get("profileImgUrl") || "";
        } catch { return ""; }
      })());

  // Resolve gender from fetched data
  const gender = astrologerProfileData?.data?.gender || stateGender || activeChat?.gender;

  // Check if there's an active call (audio or video)
  const isVideoCallActive = activeCall && activeCall.callType === "video" && !isCallMinimized;
  const isAudioCallActive = activeCall && activeCall.callType === "audio";
  const isCallActive = !!activeCall;
  const isChatActive = activeChat && activeChat.roomId;

  // Get wallet balance
  const { balance, refreshWallet } = useWalletBalance();

  // Fetch kundli profiles
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  // Listen for wallet balance updates
  useLayoutEffect(() => {
    const handleBalanceUpdate = () => {
      refreshWallet();
    };

    window.addEventListener("walletBalanceUpdated", handleBalanceUpdate);
    return () => window.removeEventListener("walletBalanceUpdated", handleBalanceUpdate);
  }, [refreshWallet]);

  // iOS/Android keyboard fix: resize chatPage based on viewport changes
  useEffect(() => {
    if (!chatPageRef.current) return;

    // Only apply on mobile (touch devices)
    const isMobile = window.innerWidth <= 1180;
    if (!isMobile) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Use visualViewport API — iOS ignores interactive-widget meta,
      // so visualViewport.height reflects the visible area above the keyboard
      const viewport = window.visualViewport;
      if (!viewport) return;

      const onResize = () => {
        if (!chatPageRef.current) return;
        const currentHeight = viewport.height;
        const fullHeight = window.screen.height;
        const keyboardOpen = currentHeight < fullHeight * 0.75;

        if (keyboardOpen) {
          chatPageRef.current.style.height = `${currentHeight}px`;
          chatPageRef.current.style.bottom = 'auto';
        } else {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      viewport.addEventListener('resize', onResize);
      viewport.addEventListener('scroll', onResize);

      return () => {
        viewport.removeEventListener('resize', onResize);
        viewport.removeEventListener('scroll', onResize);
        if (chatPageRef.current) {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
      };
    } else if (isAndroid) {
      // Android with resizes-content: the window itself resizes when keyboard opens.
      // position:fixed elements relative to layout viewport get pushed up correctly,
      // but we need to update height to match the new window size.
      const onResize = () => {
        if (!chatPageRef.current) return;
        const newHeight = window.innerHeight;
        // On Android with resizes-content, innerHeight shrinks when keyboard opens
        chatPageRef.current.style.height = `${newHeight - 53}px`; // subtract top header
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      // Set initial
      onResize();

      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        if (chatPageRef.current) {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
      };
    }
  }, []);

  const {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    handleTextChange,
    chatSeconds,
    isMessageDisabled,
    remainingTime,
    handleChatEndedFromServer,
    retryMessage,
    starMessage,
    unstarMessage,
    markMessagesRead,
  } = useChat({
    userId,
    astrologerId,
    roomId,
    isUserSide,
    kundliId,
    setOpenFeedback,
    astrologerName,
    fullName,
    refreshKey,
  });

  const [message, setMessage] = useState("");
  // Message the user is currently replying to (null = normal compose).
  const [replyTarget, setReplyTarget] = useState(null);

  // Mirror of `replyTarget` for async send paths (attachments, voice, gift).
  // Those callers run inside promises/modals that closed over a stale value, so
  // they read the ref instead of the state to pick up the reply active at the
  // moment the user actually hit send.
  const replyTargetRef = useRef(null);
  useEffect(() => {
    replyTargetRef.current = replyTarget;
  }, [replyTarget]);

  // Consume the current reply target: return the { replyTo } send options (or an
  // empty object) and clear the reply so the compose bar resets after the send.
  const consumeReplyOptions = useCallback(() => {
    const target = replyTargetRef.current;
    if (!target?.messageId) return {};
    setReplyTarget(null);
    return { replyTo: target };
  }, []);

  // Scroll to a quoted message when the user taps a reply preview.
  const scrollToMessage = useCallback((messageId) => {
    if (!messageId || !messagesRef.current) return;
    const el = messagesRef.current.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(styles.messageHighlight);
      setTimeout(() => el.classList.remove(styles.messageHighlight), 1500);
    }
  }, []);

  // Star / unstar toggler driven from the message action menu.
  const handleToggleStar = useCallback(
    (msg) => {
      if (!msg?.messageId) return;
      if (msg.starred) unstarMessage?.(msg.messageId);
      else starMessage?.(msg.messageId);
    },
    [starMessage, unstarMessage]
  );

  const {
    waitingPopup: localWaitingPopup,
    switchType,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall,
  } = useChatSocket({
    userId,
    astrologerId,
    fullName,
    kundliId,
    roomId,
    isUserSide,
    astroID,
    experience,
    profileImgUrl,
  });

  // Only show waiting popup if it's a local switch request from this chat,
  // not a global waiting list from other pending connections
  const waitingPopup = localWaitingPopup;

  const [historyPage, setHistoryPage] = useState(1);
  const isLoadingMoreRef = useRef(false);
  const prevScrollHeightRef = useRef(null);

  const { data, isFetching: isHistoryFetching } = useGetChatHistoryQuery(
    { userId: astrologerId, page: historyPage },
    { refetchOnMountOrArgChange: true }
  );
  const history = data?.data || [];
  const pagination = data?.pagination || {};
  const hasMoreHistory = pagination.hasNextPage ?? (historyPage < (pagination.totalPages || 1));

  const finalMsgs = useMemo(() => {
    const historyMsgs = history.map((item) => {
      // Parse gift messages from history (detect by type === "gift")
      let messageText = item.message || "";
      let giftData = null;
      
      if (item.type === "gift") {
        try {
          const parsed = JSON.parse(messageText);
          messageText = parsed.text;
          giftData = parsed.giftData;
        } catch (e) {
          console.error("Failed to parse gift message from history:", e);
        }
      }
      
      const isSender = isUserSide
        ? item.sender === "user"
        : item.sender === "astrologer";

      return {
        text: messageText,
        type: item?.type,
        isSender,
        time: new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).toUpperCase(),
        dateTime: item.createdAt,
        giftData: giftData,
        kundliName: item?.kundliName,
        suggestedProducts: item?.suggestedProducts,
        kundliId: item?.kundliId,
        // Protocol fields from persisted history. Old messages have no seq/status
        // (guide §13): treat them as already `read` and let seq fall back to time.
        messageId: item?._id,
        clientMsgId: item?.clientMsgId,
        seq: typeof item?.seq === "number" ? item.seq : undefined,
        status: isSender ? (item?.status || MESSAGE_STATUS.READ) : undefined,
        replyTo: normalizeReplyTo(item?.replyTo),
        starred: !!item?.starred,
      };
    });


    const socket = messages.map((msg, idx) => ({
      id: msg.clientMsgId || msg.messageId || `socket-${idx}-${msg.time}`,
      text: msg.text,
      isSender: msg.sender,
      time: msg.time,
      type: msg?.type,
      date: msg.date || formatDate(new Date()),
      dateTime: msg.dateTime || new Date().toISOString(),
      giftData: msg?.giftData, // Include gift data from socket messages
      kundliName: msg?.kundliName,
      suggestedProducts: msg?.suggestedProducts,
      kundliId: msg?.kundliId,
      // Protocol fields
      messageId: msg?.messageId,
      clientMsgId: msg?.clientMsgId,
      seq: typeof msg?.seq === "number" ? msg.seq : undefined,
      status: msg?.status,
      replyTo: normalizeReplyTo(msg?.replyTo),
      starred: !!msg?.starred,
    }));


    // A message can arrive both over the socket (live echo) and from the history
    // API (once persisted), which would render it twice. Prefer stable ids
    // (messageId / clientMsgId) for dedup; fall back to the legacy fuzzy key
    // (type + text + sender + minute) for old messages that have neither.
    const historyIds = new Set();
    historyMsgs.forEach((m) => {
      if (m.messageId) historyIds.add(`id:${m.messageId}`);
      if (m.clientMsgId) historyIds.add(`cid:${m.clientMsgId}`);
    });
    const fuzzyKey = (m) =>
      `${m.type || "message"}|${m.text}|${m.isSender ? 1 : 0}|${dayjs(m.dateTime).format("YYYY-MM-DD HH:mm")}`;
    const historyFuzzy = new Set(historyMsgs.map(fuzzyKey));

    const dedupedSocket = socket.filter((m) => {
      if (m.messageId && historyIds.has(`id:${m.messageId}`)) return false;
      if (m.clientMsgId && historyIds.has(`cid:${m.clientMsgId}`)) return false;
      // Only apply the fuzzy fallback when there's no stable id to trust.
      if (!m.messageId && !m.clientMsgId && historyFuzzy.has(fuzzyKey(m))) return false;
      return true;
    });

    // Order by server-assigned seq (ascending); messages without a seq fall back
    // to their timestamp (guide §9).
    return sortBySeq([...historyMsgs, ...dedupedSocket]);
  }, [history, messages, isUserSide]);

  // Emit a read receipt for the highest seq of the OTHER party's messages when
  // the chat page is visible (guide §5). This runs both when new messages
  // arrive AND when the tab/window regains visibility — otherwise a message
  // that lands while the tab is hidden never gets a read receipt, because the
  // effect below early-returns on hidden and never re-runs on refocus (the
  // visibility change isn't a React dependency). markMessagesRead has its own
  // monotonic guard, so re-invoking it is safe (no duplicate/backwards emits).
  // Tracks other-party message ids we've already sent `message:delivered` for,
  // so re-runs of the read-receipt effect don't re-emit duplicates.
  const confirmedDeliveryIdsRef = useRef(new Set());
  const emitReadReceiptRef = useRef(() => {});
  emitReadReceiptRef.current = (immediate = false) => {
    // NOTE: read receipts are intentionally NOT gated by `isMessageDisabled`.
    // `isMessageDisabled` means "the user can't SEND/type" (session ended, not
    // yet reconnected, no active live chat), which is a different concern from
    // "the user has SEEN these messages". When a customer reopens a chat where
    // the astrologer sent messages while they were offline, there is no live
    // `activeChat`, so `isMessageDisabled` stays true — previously that blocked
    // the read receipt entirely and the astrologer's ticks stalled at
    // sent/delivered. Acknowledging reads only requires the messages to be
    // visible on screen, so we gate on visibility alone.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    // Highest seq AND latest timestamp among the OTHER party's messages. Live
    // socket messages frequently lack a numeric seq, so the timestamp is the
    // reliable watermark that makes refocus receipts work without a reload.
    let otherPartyMaxSeq = 0;
    let otherPartyMaxAt = 0;
    // Collect ids of the other party's messages we haven't confirmed delivery
    // for yet. Messages loaded purely from REST history (e.g. sent while the
    // customer was offline) never went through the live `message:received` /
    // `undelivered_batch` socket handlers, so their delivery was never
    // confirmed and the astrologer's ticks stay on a single "sent" tick. We
    // confirm delivery here, once, before reporting the read watermark.
    const toConfirmDelivery = [];
    for (const m of finalMsgs) {
      if (m.isSender) continue;
      if (typeof m.seq === "number" && m.seq > otherPartyMaxSeq) otherPartyMaxSeq = m.seq;
      const at = m.dateTime ? new Date(m.dateTime).getTime() : 0;
      if (at > otherPartyMaxAt) otherPartyMaxAt = at;
      const id = m.messageId;
      if (id && !confirmedDeliveryIdsRef.current.has(id)) {
        toConfirmDelivery.push(id);
      }
    }
    if (toConfirmDelivery.length && roomId && voiceSocket.connected) {
      toConfirmDelivery.forEach((id) => confirmedDeliveryIdsRef.current.add(id));
      voiceSocket.emit("message:delivered", { roomId, messageIds: toConfirmDelivery });
    }
    if (otherPartyMaxSeq > 0 || otherPartyMaxAt > 0) {
      markMessagesRead?.(otherPartyMaxSeq, { immediate, lastReadAt: otherPartyMaxAt });
    }
  };

  // Fire on message/history changes (live receipts while the tab is focused).
  useEffect(() => {
    emitReadReceiptRef.current();
  }, [finalMsgs, isMessageDisabled]);

  // Re-fire once the socket (re)connects. History can finish loading BEFORE the
  // socket is connected — in that case the delivered/read emits above are
  // skipped (voiceSocket.connected is false and flushReadReceipt queues the
  // read). Re-running on `connect` ensures the astrologer's ticks advance to
  // delivered/read as soon as we're back online, without needing a refocus.
  useEffect(() => {
    const onConnect = () => emitReadReceiptRef.current(true);
    voiceSocket.on("connect", onConnect);
    return () => voiceSocket.off("connect", onConnect);
  }, []);

  // First-connect flush: when the customer joins this chat with the astrologer
  // for the first time in this session, immediately confirm delivery AND report
  // the read watermark for whatever the astrologer already sent (including
  // messages sent while the customer was offline, loaded from history). This
  // runs once per room, as soon as the room is established and history has
  // finished its initial load — so the astrologer's ticks advance the moment
  // the customer opens the conversation, not only on a later focus/message.
  const firstConnectDoneRef = useRef(null);
  useEffect(() => {
    if (!roomId) return;
    // Wait for the first history load to settle so finalMsgs contains the
    // astrologer's existing messages.
    if (isHistoryFetching) return;
    // Only fire once per room.
    if (firstConnectDoneRef.current === roomId) return;
    firstConnectDoneRef.current = roomId;
    emitReadReceiptRef.current(true);
  }, [roomId, isHistoryFetching, finalMsgs.length]);

  // Fire when the tab/window comes back to the foreground, so messages that
  // arrived while hidden get their read receipt as soon as the user returns.
  // Emit immediately (skip the debounce) — background timers get throttled, so
  // a deferred emit could be dropped or arrive late.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "visible") emitReadReceiptRef.current(true);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("focus", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("focus", flush);
    };
  }, []);

  // Load older messages when scrolling to top
  const handleMessagesScroll = useCallback(() => {
    if (!messagesRef.current || isLoadingMoreRef.current || isHistoryFetching || !hasMoreHistory) return;
    if (messagesRef.current.scrollTop < 80) {
      isLoadingMoreRef.current = true;
      prevScrollHeightRef.current = messagesRef.current.scrollHeight;
      setHistoryPage((prev) => prev + 1);
    }
  }, [isHistoryFetching, hasMoreHistory]);

  // Restore scroll position after older messages are prepended
  useLayoutEffect(() => {
    if (!isLoadingMoreRef.current || !prevScrollHeightRef.current) return;
    if (isHistoryFetching) return;

    const container = messagesRef.current;
    if (container) {
      const newScrollTop = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = newScrollTop;
      prevScrollHeightRef.current = null;
      isLoadingMoreRef.current = false;
    }
  }, [history, isHistoryFetching]);

  // Auto-scroll to bottom ONLY for new real-time messages or typing indicator
  const prevSocketCountRef = useRef(messages.length);
  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    // Only scroll to bottom if socket messages count actually increased
    if (messages.length > prevSocketCountRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    prevSocketCountRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom when typing indicator appears
  useLayoutEffect(() => {
    if (!isTyping) return;
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [isTyping]);

  // On initial mount / first history load, scroll to bottom once
  const initialScrollDoneRef = useRef(false);
  useLayoutEffect(() => {
    if (initialScrollDoneRef.current) return;
    if (history.length > 0 && !isHistoryFetching) {
      const container = messagesRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        initialScrollDoneRef.current = true;
      }
    }
  }, [history, isHistoryFetching]);

  const { isInactive, resetTimer } = useInactivityTimer(120000, !!activeCall);

  const handleDisconnect = () => {
    if (isEnding) return;
    try {
      voiceSocket.emit("chat:end", { roomId, endedBy: "CUSTOMER" });
      
      // Refresh wallet balance after chat ends
      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));
    } catch (error) {
      handleChatEndedFromServer();
      console.log('chat end error', error)
    }
  };

  const handleChatEnd = () => {
    if (isEnding) return false;
    
    // Check if a call/video call is active — prevent ending chat
    if (isCallActive) {
      const callType = activeCall?.callType === "video" ? "Video Call" : "Voice Call";
      Toast.error(`${callType} is active. Please end the ${callType} first before ending the chat.`);
      return false;
    }
    
    // Primary: use wall-clock time from session start (persisted in localStorage)
    const chatStartTime = localStorage.getItem("shubhtalk_chat_start_time");
    const wallClockElapsed = chatStartTime 
      ? Math.floor((Date.now() - Number(chatStartTime)) / 1000)
      : 0;
    
    // Secondary: calculate from timer if wall-clock not available
    const initialRemainingMinutes = activeChat?.remainingTime || remainingTime || 0;
    const totalSessionSeconds = initialRemainingMinutes * 60;
    const timerBasedElapsed = totalSessionSeconds > 0 ? totalSessionSeconds - chatSeconds : 0;
    
    // Use wall-clock as primary (more reliable), fall back to timer-based
    const effectiveElapsed = wallClockElapsed > 0 ? wallClockElapsed : timerBasedElapsed;

    // Show confirmation popup instead of ending directly
    setShowEndChatConfirm(true);
    return false;
  };

  const confirmEndChat = () => {
    setShowEndChatConfirm(false);
    handleDisconnect();
  };

  const handleSend = (kundli = null) => {
    if (kundli?._id) {
      // Attach the reply target (if any) so a shared Kundli can also be a reply.
      const kundliReplyOptions = replyTarget?.messageId ? { replyTo: replyTarget } : {};
      isUserSide ? sendMessage(kundli._id, 'kundli', kundli?._id, kundliReplyOptions) : astroReply(kundli._id);

      setMessage("");
      setReplyTarget(null);
      return;
    }

    if (!message.trim()) return;
    // Attach the reply target (if any) so the server stores a quoted snapshot.
    const sendOptions = replyTarget?.messageId ? { replyTo: replyTarget } : {};
    isUserSide ? sendMessage(message, "message", null, sendOptions) : astroReply(message);
    if (isUserSide) {
      trackEvent("session_message_sent", { astrologer_id: astroID || activeChat?.astrologerId, session_id: activeChat?.roomId });
    }
    setMessage("");
    setReplyTarget(null);
  };

  const user = getUserFromStorage();
  const [addAstrologerReview, { isLoading }] = useAddAstrologerReviewMutation();
  /*
    Returns false when the review could not be posted, which keeps FeedbackModal
    mounted with the rating and text intact so the visitor can actually retry.

    Every failure path here used to show "Something went wrong. Please try
    again." and then call setOpenFeedback(false). That closed the modal, and
    FeedbackModal's own resetForm() runs whenever the handler returns anything
    other than `false` — so the advice to try again arrived at the same moment
    both the form and everything typed into it disappeared. On the missing-id
    path it was worse than unhelpful: retrying could not have succeeded, because
    the id was already absent from every source before the request was made.

    FeedbackModal has supported this since the resetForm fix — a handler opts in
    by returning exactly `false`. StickyReview.jsx already does, and its handler
    is the reference for this one. ChatWindow was simply never brought across,
    so the opt-in existed with no caller here using it.

    Clarity session 1tu0x7x (Sep 3, Instagram in-app, mobile, 11:37) shows the
    cost: a guest deep in a chat, "entering information", hitting "Something
    went wrong" at 04:18. Only success closes the modal now.
  */
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    // Use astroID from location state, fall back to captured ref, activeChat, activeCall, or reviewData
    const reviewAstrologerID = astroID || lastAstrologerIDRef.current || activeChat?.astrologerID || activeCall?.astrologerID || activeCall?.astrologerId || reviewData?.astrologerID || reviewData?.astrologer_ID;

    if (!reviewAstrologerID) {
      /*
        Not retryable: none of the seven sources above carried an id, and
        pressing Submit again re-reads the same empty values. Say what might
        actually help instead of "try again", and leave the text on screen so it
        survives the reload prompt.
      */
      Toast.error("We couldn't identify this astrologer. Please reload the page and try again.");
      return false;
    }

    try {
      const res = await addAstrologerReview({
        astrologerID: reviewAstrologerID,
        rating,
        review,
        isAnonymous,
        roomId,
      }).unwrap();

      if (!res.success) {
        Toast.error("Couldn't post your review. Please try again.");
        return false;
      }

      Toast.success(res.message || "Review submitted successfully");
      if (isChatActive && !isMessageDisabled) {
        handleDisconnect();
      }
      setOpenFeedback(false);
      return true;
    } catch (error) {
      // Generic copy on purpose — the raw API message is not user-facing.
      console.error("Failed to submit review", error);
      Toast.error("Couldn't post your review. Please try again.");
      return false;
    }
  };

  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const sendVoiceMessage = async (blob = null, duration, mimeType) => {
    // Capture + clear the reply target now (before the async upload) so the
    // voice note is delivered as a reply and the compose bar resets immediately.
    const sendOptions = consumeReplyOptions();
    // Upload in background — don't block the chat UI
    (async () => {
      try {
        // Label the upload by the actual recorded format. Recording as mp4 but
        // uploading as .x-m4a (the old behaviour) breaks playback on iOS when
        // the device actually recorded webm.
        const recordedType = mimeType || blob?.type || "audio/mp4";
        const isM4a = recordedType.includes("mp4");
        const fileType = isM4a ? "audio/x-m4a" : "audio/webm";

        const signedUrl = await getS3SignedUrl({ fileType }).unwrap();
        const audioUrl = signedUrl.uploadUrl.split("?")[0];
        const uploadUrl = signedUrl.uploadUrl;
        // Re-label the blob so the S3 Content-Type matches the signed file type
        // (bytes are unchanged).
        const uploadBlob = new Blob([blob], { type: fileType });
        await uploadFileToS3(uploadUrl, uploadBlob);
        sendMessage(audioUrl, "audio", null, sendOptions);
      } catch (err) {
        console.error("Voice upload failed:", err);
        Toast.error("Failed to send voice message");
      }
    })();
    setMessage("");
  };

  const sendFiles = async (blob, meta) => {
    // Capture + clear the reply target up front so the attachment is delivered
    // as a reply even though the S3 upload below is async, and the compose bar
    // resets right away.
    const sendOptions = consumeReplyOptions();
    // Extract file extension from original name for proper S3 key
    const ext = meta?.name?.split('.').pop();
    const fileType = ext && ext !== meta?.name ? `application/${ext}` : blob.type;
    
    const signedUrl = await getS3SignedUrl({
      fileType,
    }).unwrap();

    const uploadUrl = signedUrl.uploadUrl;
    const fileUrl = uploadUrl.split("?")[0];

    await uploadFileToS3(uploadUrl, blob);

    const attachType = getAttachType(blob.type);
    // Send as JSON with fileName so display can show proper name and icon
    const messagePayload = attachType === "image" || attachType === "video" || attachType === "audio"
      ? fileUrl
      : JSON.stringify({ url: fileUrl, fileName: meta?.name || `file.${ext}` });
    sendMessage(messagePayload, attachType, null, sendOptions);
    setMessage("");
    console.log("FILE UPLOADED URL:", fileUrl);
  };

  const uploadFileToS3 = async (uploadUrl, blob) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type,
      },
    });

    if (!res.ok) {
      throw new Error("S3 upload failed");
    }

    return "success";
  };

  const getAttachType = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'attachment';
    }
  };

  // Floating action handlers
  const handleSwitchProfile = () => {
    setShowProfileManagerModal(true);
  };

  const handleSparkles = () => {
    navigate(PATH.privateRoutes.AI_WOW.path);
  };

  const handleGift = () => {
    setShowGiftModal(true);
  };

  const handleRecharge = () => {
    setIsRechargeModalOpen(true);
  };

  const handleRechargeSuccess = (paymentData) => {
    console.log('Payment successful in chat:');
    // Wallet balance is already refreshed by the modal
    refreshWallet();
  };

  const handleSelectProfile = (profile) => {
    // Send the selected kundli profile
    handleSend(profile);
    setShowProfileModal(false);
  };

  const handleProfileManagerStartCall = (selectedProfile) => {
    console.log('selectedProfile :>> ', selectedProfile);
    // Send the selected kundli profile
    handleSend(selectedProfile);
    setShowProfileManagerModal(false);
  };

  // Redirect to home when chat ends or voice/video call ends while on chat window
  const prevActiveCallRef = useRef(activeCall);
  const prevChatActiveRef = useRef(isChatActive);
  const prevFeedbackRef = useRef(openFeedback);
  const openFeedbackRef = useRef(openFeedback);
  openFeedbackRef.current = openFeedback;
  useEffect(() => {
    const hadCall = prevActiveCallRef.current;
    const hadChat = prevChatActiveRef.current;
    const hadFeedback = prevFeedbackRef.current;
    prevActiveCallRef.current = activeCall;
    prevChatActiveRef.current = isChatActive;
    prevFeedbackRef.current = openFeedback;

    // Don't redirect while feedback modal is open
    if (openFeedback) return;

    /*
      When the chat was launched from a report's chat popup (e.g. the Muhurat
      calendar), a return path is stashed in sessionStorage. Read + clear it so
      the user is taken back to that report instead of the astrologers list.
      Only chat sets this marker, so calls fall through to the default.
    */
    const consumeReturnPath = () => {
      try {
        const path = sessionStorage.getItem("shubhtalk_chat_return_path");
        if (path) sessionStorage.removeItem("shubhtalk_chat_return_path");
        return path || null;
      } catch {
        return null;
      }
    };

    // Feedback just closed and no active session → redirect
    if (hadFeedback && !openFeedback && !isChatActive && !activeCall) {
      const returnPath = consumeReturnPath();
      navigate(returnPath || PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
      return;
    }

    // Chat was active and just ended → redirect
    // Use a short delay to allow feedback modal state to settle (e.g. report-triggered end)
    if (hadChat && !isChatActive && !activeCall) {
      const timer = setTimeout(() => {
        if (!openFeedbackRef.current) {
          const returnPath = consumeReturnPath();
          navigate(returnPath || PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    // Voice/video call was active and just ended, no active chat → redirect to astrologers list
    if (hadCall && !activeCall && !isChatActive) {
      navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
    }
  }, [activeCall, isChatActive, openFeedback, navigate]);

  // Auto-end chat when timer reaches 0
  // Use a ref to track if timer was ever started (to avoid ending on initial mount/refresh)
  const timerStartedRef = useRef(false);
  useLayoutEffect(() => {
    if (chatSeconds > 0) {
      timerStartedRef.current = true;
    }
    if (chatSeconds === 0 && remainingTime > 0 && timerStartedRef.current) {
      // Timer has counted down to 0, automatically end the chat
      handleDisconnect();
    }
  }, [chatSeconds, remainingTime]);

  return (
    <>
      <SwitchWaitingPopup
        isVisible={localWaitingPopup}
        switchType={switchType || "audio"}
        onCancel={handleCancelCall}
      />
      <div className={styles.chatPage} ref={chatPageRef}>
        <div className={styles.chatWindow}>
          <ChatHeader
            fullName={fullName}
            isTyping={isTyping}
            onBack={() => navigate(-1)}
            onAudioCall={handleAudioCall}
            onVideoCall={handleVideoCall}
            disabled={!!activeCall}
            walletBalance={balance || 0}
            experience={experience}
            remainingTime={chatSeconds > 0 ? chatSeconds : 0}
            onRecharge={handleRecharge}
            isVideoCallActive={isVideoCallActive}
            onChatEnd={handleChatEnd}
            isChatActive={isChatActive}
            isEnding={isEnding || waitingPopup}
            profileImgUrl={profileImgUrl}
            gender={gender}
          />

          {/* Call Buttons Below Header */}
          {(astroAvailability.call || astroAvailability.video) && (
            <div className={styles.callButtonsContainer}>
              {astroAvailability.call && (
                <button
                  className={styles.voiceCallButton}
                  onClick={handleAudioCall}
                  disabled={!!activeCall}
                >
                  <img src={CallIcon} alt="Voice Call" width="20" height="20" />
                  Voice Call
                </button>
              )}

              {astroAvailability.call && astroAvailability.video && (
                <span className={styles.dividerLine}></span>
              )}

              {astroAvailability.video && (
                <button
                  className={styles.videoCallButton}
                  onClick={handleVideoCall}
                  disabled={!!activeCall}
                >
                  <img src={VideocamIcon} alt="Video Call" width="20" height="20" />
                  Video Call
                </button>
              )}
            </div>
          )}

          <div className={styles.messagesContainer}>
            <ChatMessages
              messages={finalMsgs}
              isTyping={isTyping}
              error={error}
              messagesRef={messagesRef}
              astrologerName={astrologerName || fullName}
              customerName={user?.firstName}
              onScroll={handleMessagesScroll}
              isLoadingMore={isHistoryFetching && historyPage > 1}
              onReply={(msg) => setReplyTarget(msg)}
              onToggleStar={handleToggleStar}
              onRetry={(msg) => retryMessage?.(msg.clientMsgId)}
              onReplyPreviewClick={scrollToMessage}
            />

            <FloatingActions
              onShuffle={handleSwitchProfile}
              onSparkles={handleSparkles}
              onGift={handleGift}
            />
          </div>

          {(!isMessageDisabled || isCallActive) && (
            <>
              {replyTarget && (
                <div className={styles.replyComposeBar}>
                  <div className={styles.replyComposeContent}>
                    <span className={styles.replyComposeSender}>
                      {replyTarget.isSender ? "You" : (astrologerName || fullName || "Astrologer")}
                    </span>
                    <span className={styles.replyComposeText}>
                      {replyPreviewLabel(replyTarget)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.replyComposeClose}
                    onClick={() => setReplyTarget(null)}
                    aria-label="Cancel reply"
                  >
                    ✕
                  </button>
                </div>
              )}
              <ChatInput
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTextChange();
                }}
                onSend={handleSend}
                isMessageDisabled={isMessageDisabled && !isCallActive}
                onChatEnd={handleChatEnd}
                setOpen={setOpenFeedback}
                sendVoiceMessage={sendVoiceMessage}
                sendFiles={sendFiles}
              />
            </>
          )}

          {/* {!isVideoCallActive && (
            <ChatFooter 
              remainingTime={chatSeconds > 0 ? chatSeconds : 0}
              onRecharge={handleRecharge}
            />
          )} */}

          {/* {waitingPopup && (
            <WaitingPopup open={waitingPopup} onCancel={handleCancelCall} />
          )} */}

          {!isMessageDisabled && <InactivityModal
            isOpen={isInactive}
            onDisconnect={handleChatEnd}
            onContinue={resetTimer}
          />}

          <Feedback
            open={openFeedback}
            onClose={() => setOpenFeedback(false)}
            handleSubmit={handleReviewSubmit}
            ratedUserName={fullName}
            profileImgUrl={profileImgUrl}
            loading={isLoading}
            gender={gender}
          />

          {isReconnecting && (
            <div className={styles.reconnectOverlay}>
              <div className={styles.reconnectModal}>
                <div className={styles.reconnectSpinner}>
                  <svg viewBox="0 0 50 50" className={styles.spinnerSvg}>
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="url(#reconnectGradientChat)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="80, 200"
                      className={styles.spinnerCircle}
                    />
                    <defs>
                      <linearGradient id="reconnectGradientChat" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F75801" />
                        <stop offset="100%" stopColor="#D43400" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h3 className={styles.reconnectTitle}>Connection lost...</h3>
                <p className={styles.reconnectText}>
                  Please wait while we restore your chat connection...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render modal outside overflow containers */}
      {/* <ProfileListingModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profiles={profiles}
        selectedProfileId={kundliId}
        onSelectProfile={handleSelectProfile}
        title="Select Kundli Profile"
        showAddButton={false}
        showDeleteButton={false}
      /> */}

      <ProfileManager
        isOpen={showProfileManagerModal}
        onClose={() => setShowProfileManagerModal(false)}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile"
        callModeBtnTitle="Continue"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Gift Modal */}
      <GiftModal
        isOpen={showGiftModal}
        onClose={() => {
          setShowGiftModal(false);
          // Refresh wallet balance when modal closes
          refreshWallet();
        }}
        replyTo={replyTarget}
        onReplySent={() => setReplyTarget(null)}
        astrologerId={astrologerId}
        astrologerName={fullName}
        roomId={roomId}
        userId={userId}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={handleRechargeSuccess}
        title="Recharge to Continue Chat"
      />

      {/* End Chat Confirmation Modal */}
      {showEndChatConfirm && (
        <div className={styles.endChatConfirmOverlay} onClick={() => setShowEndChatConfirm(false)}>
          <div className={styles.endChatConfirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.endChatConfirmTitle}>End Chat?</h3>
            <p className={styles.endChatConfirmText}>
              Are you sure you want to end this chat session with {fullName || "the astrologer"}?
            </p>
            <div className={styles.endChatConfirmActions}>
              <button className={styles.endChatBtnCancel} onClick={() => setShowEndChatConfirm(false)}>
                Continue Chat
              </button>
              <button className={styles.endChatBtnConfirm} onClick={confirmEndChat}>
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow;
