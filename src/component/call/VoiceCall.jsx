import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import AgoraRTC from "agora-rtc-sdk-ng";
import { AUDIO_ENCODER_CONFIG } from "../../agora/agoraConfig";
import { getWorstNetworkQuality } from "../../agora/networkQuality";
import { getAstrologerDisplayName } from "../../utils/helper/string.utils";
import { resolveKundliProfile } from "../../utils/helper/introMessage";
import { trackEvent } from "../../utils/analytics";
import { BranchEvents } from "../../utils/branchEvents";
import {
  IoMic,
  IoMicOff,
  IoArrowBack,
  IoGift,
  IoVolumeHigh,
  IoVolumeMute,
  IoCallSharp,
  IoCellular,
} from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { isPanditAIEvent } from "../panditAI/usePanditAI";
import { useCall } from "../../context/CallContext";
import { useChat as useChatContext } from "../../context/ChatContext";
import GiftModal from "./GiftModal";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";
import RechargeModal from "../recharge-modal/RechargeModal";
import ProfileManager from "../UI/Profile/ProfileManager";
import { useGetAllKundlisQuery } from "../../services/appServices/kundliServicesNew";
import VideoCallChat from "./VideoCallChat";
import { Toast } from "../index";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import { useMediaPermission } from "../../utils/hooks/useMediaPermission";

// Import SVG icons from chat assets
import VideocamIcon from "../../assets/chat/Videocam.svg";
import CallIcon from "../../assets/chat/Call.svg";
import ChatNotificationBanner from "../UI/ChatNotificationBanner/ChatNotificationBanner";
import { getAstrologerDefaultImage, getAstrologerImageUrl } from "../../utils/appImages";
import { useGetAstrologerByIdQuery } from "../../redux/api/astrologer/astrologerApi";
import { capitalizeWords } from "../../utils/capitalize";
import walletIcon from "../../assets/images/wallet-icon.svg";
import headerCoin from "../../assets/images/headerCoin.svg";
import SuggestedRemedyPanel from "./SuggestedRemedyPanel";
import SwitchWaitingPopup from "../UI/switchWaiting/SwitchWaitingPopup";
import { isShubhMallEnabled } from "../../utils/featureConfig";
import { getAttachmentDisplayName } from "../../utils/helper/getAttachmentDisplayName";
import useAstrologerAvailability from "../../utils/hooks/useAstrologerAvailability";
import { isFreeSessionCall, payloadSaysFree, payloadSaysLive, freeSessionCallId } from "../../utils/auth/freeSessionRoom";
import {
  FreeCallScreen,
  FreeCallEndingBanner,
  FreeCallContinueNotice,
  FreeCallLowBalancePopup,
} from "./FreeCallUI";
import { useFreeSessionPhase } from "../../screens/private/home/components/chats/freeSession/useFreeSessionPhase";
import {
  getRatePerMinute,
  isLowBalanceWarning,
  getAudioCallRateOffer,
} from "../../screens/private/home/components/chats/freeSession/freeSessionUtils";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const CHAT_STORAGE_KEY = "shubhtalk_active_chat";

const AgoraVoiceCalling = ({ callData }) => {
  const { activeCall, setActiveCall, lastRequestedAstro, lastSelectedKundli, setOpenReview, setReviewData, callSeconds, setCallSeconds, startTimer, stopTimer, setWaitingList, resetCallFlow, isCallMinimized, setIsCallMinimized, reconnectToCall, isMicOn, setIsMicOn, isSpeakerOn, setIsSpeakerOn, setEndedFreeCall } = useCall();
  const { activeChat, lastRequestedAstro: chatLastRequestedAstro } = useChatContext();
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnLivePage = location.pathname.startsWith("/live");

  // Astrologer availability for the connected call — used to hide the
  // "Video"/"Chat" switch buttons when the astrologer disabled those modes.
  const astroAvailability = useAstrologerAvailability(activeCall?.astrologerId, {
    enabled: !!activeCall && activeCall.callType === "audio",
  });

  // Fetch the astrologer so we can use the pre-resized `profileImages` variants
  // for the avatars. Everything plumbed through CallContext / the socket payload
  // carries only `profileImgUrl`, which is the unresized original (896x902 and
  // 1433x1433 have both been observed) — painted into a 220px circle and a 40px
  // header thumbnail. RTK Query dedupes, so this is usually already cached from
  // the astrologer profile page or ChatWindow.
  const { data: astrologerFullData } = useGetAstrologerByIdQuery(
    { id: activeCall?.astrologerId },
    { skip: !activeCall?.astrologerId }
  );

  // Free first-session call state (see "FREE FIRST SESSION" below). Declared
  // before the early return so it adds nothing to the existing conditional-hook
  // problem further down.
  const [freeLowBalanceDismissed, setFreeLowBalanceDismissed] = useState(false);
  const freeTimerStartedRef = useRef(false);
  const freeCallEndRef = useRef(null);
  // Free call "Call duration": wall-clock join time and the last value shown.
  const freeJoinedAtRef = useRef(0);
  const freeDurationRef = useRef(0);
  // Largest remaining time seen for this free call = the free allowance.
  const freeAllowanceRef = useRef(0);
  // Read by the socket `warning` handler (registered once) — see below.
  const freeCallSuppressWarningRef = useRef(() => false);
  // The user pressed End Call (vs. the server ending the call).
  const userEndedCallRef = useRef(false);

  /*
    Balance-aware free call (see chats/freeSession/useFreeSessionPhase). Called
    here, before the early return below, so it is not a conditional hook. When
    the wallet covers the audio rate, the last minute shows a calm "continues at
    ₹X/min" notice (no low-balance popup / recharge banner) and at 00:00 the
    screen switches to the normal paid call layout — nothing is ended
    client-side. Otherwise the free flow is unchanged.
  */
  const freeCallRoomId = callData?.roomId;
  // A call placed from a live stream is never the free call (SHB-2148): no
  // free UI, and no locked FreeCallEndedScreen when it ends. The watcher no
  // longer tags it; this also covers a room tagged before that fix.
  const isFreeCallSession =
    !!activeCall &&
    activeCall.callType === "audio" &&
    !payloadSaysLive(activeCall) && // origin "live" / isLive / liveRoomDetails
    (isFreeSessionCall(freeCallRoomId) || payloadSaysFree(activeCall));
  const { balance: freeCallBalance } = useWalletBalance();
  const freeCallRateOffer = getAudioCallRateOffer(astrologerFullData?.data || lastRequestedAstro);
  const freeCallRatePerMinute = getRatePerMinute(freeCallRateOffer);
  const freeCallPhase = useFreeSessionPhase({
    isFree: isFreeCallSession,
    sessionKey: freeSessionCallId(freeCallRoomId),
    roomId: activeCall?.roomId || freeCallRoomId,
    isActive: isFreeCallSession,
    sessionSeconds: callSeconds,
    balance: freeCallBalance,
    ratePerMinute: freeCallRatePerMinute,
    seedSessionSeconds: (secs) => {
      setCallSeconds(secs);
      startTimer();
    },
  });

  if (!activeCall || activeCall.callType !== "audio") {
    return null;
  }

  const { 
    roomId, 
    sessionRoomId,
    channelName,
    agoraToken, 
    callerName, 
    isUserSide, 
    experience, 
    astrologerImage
  } = callData;

  // Astrologer-shaped object for getAstrologerImageUrl.
  //
  // `profileImgUrl` / `imageUrl` keep the exact precedence the avatars used
  // before, so nothing regresses while the query is in flight or if the
  // astrologer has no derivatives yet. The helper falls back through them in
  // order and ends on the gendered placeholder, so it always returns a URL.
  const astroForImage = {
    // `lastRequestedAstro` is the whole astrologer object as it came off the
    // card that started the call (see useAstrologerConnect), so it usually
    // already carries `profileImages` — that covers the window before the query
    // resolves, and on a refresh-resume the query is the only source.
    profileImages:
      astrologerFullData?.data?.profileImages ||
      lastRequestedAstro?.profileImages ||
      chatLastRequestedAstro?.profileImages,
    profileImgUrl:
      activeCall?.profileImgUrl ||
      astrologerImage ||
      lastRequestedAstro?.profileImgUrl,
    imageUrl: lastRequestedAstro?.imageUrl,
    gender:
      activeCall?.gender ||
      lastRequestedAstro?.gender ||
      chatLastRequestedAstro?.gender,
  };

  // Avatar for the in-call "New message" toast. Derived from the same source as
  // the call UI avatars so it never falls back to a placeholder while the real
  // image is available. Kept as plain values so the notification callback can
  // depend on them and refresh once the astrologer query resolves.
  const notificationAstroImage = getAstrologerImageUrl(astroForImage, "small");
  const notificationAstroGender = astroForImage.gender || null;

  // Review avatar (FeedbackModal renders at 44px). `currentCall` is read from
  // activeCallRef at end-of-call, which is the same astrologer, so the fetched
  // derivatives still apply.
  const resolveReviewImage = (currentCall) =>
    getAstrologerImageUrl(
      {
        profileImages: astroForImage.profileImages,
        profileImgUrl:
          currentCall?.profileImgUrl ||
          currentCall?.astrologerImage ||
          lastRequestedAstro?.profileImgUrl ||
          chatLastRequestedAstro?.profileImgUrl,
        gender: astroForImage.gender,
      },
      "small"
    );

  // For Agora: use channelName if provided by server, otherwise roomId
  const agoraChannelName = channelName || roomId;
  // For socket events: use roomId (always the session identifier)
  const socketRoomId = roomId;

  /* ================= REFS ================= */
  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cleanupRef = useRef(false);
  const videoTrackRef = useRef(null);
  const remoteUserRef = useRef(null);
  const userLeftTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const isUpgradingToVideo = useRef(false);
  // Track if this mount is a refresh-resume (activeCall restored from localStorage)
  const isResumeFromRefresh = useRef(!!localStorage.getItem("shubhtalk_active_call"));
  // Ref to always hold the latest activeCall so socket handlers never use stale closures
  const activeCallRef = useRef(activeCall);
  // Ref to hold latest speaker state for Agora event closures
  const speakerOnRef = useRef(isSpeakerOn);

  /* ================= STATE ================= */
  const micOn = isMicOn;
  const setMicOn = setIsMicOn;
  const [joined, setJoined] = useState(false);
  // Use context's isCallMinimized instead of local state
  const isMinimized = isCallMinimized;
  const setIsMinimized = setIsCallMinimized;
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const speakerOn = isSpeakerOn;
  const setSpeakerOn = setIsSpeakerOn;
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  // Agora network/signal quality of the weakest link (uplink/downlink)
  const [networkQuality, setNetworkQuality] = useState({ label: "Connecting…", level: "unknown", quality: 0 });
  // True when the signal drops to "Connecting…" (quality 0) after being connected
  const [isNetworkLost, setIsNetworkLost] = useState(false);
  const hadNetworkRef = useRef(false);

  // Auto-minimize when call originated from live and user is not on live page
  useEffect(() => {
    if (activeCall?.origin === "live" && !isOnLivePage && !isMinimized) {
      setIsMinimized(true);
    }
  }, [activeCall?.origin, isOnLivePage, isMinimized, setIsMinimized]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Restore pending switch state after reconnect
  useEffect(() => {
    if (activeCall?.pendingSwitch?.isPending) {
      setIsSwitching(true);
      // Clear from activeCall to avoid re-triggering
      setActiveCall((prev) => prev ? { ...prev, pendingSwitch: null } : prev);
    }
  }, [activeCall?.pendingSwitch, setActiveCall]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showRechargeButton, setShowRechargeButton] = useState(false);
  const [isRemedyPanelOpen, setIsRemedyPanelOpen] = useState(false);
  const [suggestedRemedyData, setSuggestedRemedyData] = useState({ entries: [], suggestedProducts: [], messages: [] });
  const [hasNewRemedy, setHasNewRemedy] = useState(false);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);

  /* ================= FREE FIRST SESSION (audio only) ================= */
  /*
    Same journey as the chat (Figma "Web Free chat user journey"): badge +
    countdown, the low-balance popup and "ending soon" banner in the last
    FREE_SESSION_WARNING_SECONDS, and a locked end state offering to continue at
    the discounted audio rate.

    "Is this the free call" cannot be read from isFirstSessionFree here — it is
    already false by the time this mounts (useFreeSessionWatcher marks the offer
    consumed at call:accepted). The watcher records this call's roomId just
    before doing so (utils/auth/freeSessionRoom). An explicit free flag on the
    call data is honoured too. This component only renders audio calls, and the
    watcher never records video, so video calls never get any of this.
  */
  /*
    `isFreeCall` = the FREE UI is showing: this is the free call and it has not
    carried on as a paid one. Once it has (wallet covered the rate when the
    free time ran out), the regular call layout below takes over — Virtual
    Assistant, View History and Send Gift come back.
  */
  const isFreeCall = isFreeCallSession && freeCallPhase.isFreePhase;
  // Free part of the countdown (equals callSeconds unless the backend sends a
  // separate free allowance — see freeSessionUtils.getFreeSecondsLeft).
  const freeSecondsLeft = freeCallPhase.freeSecondsLeft;
  // Latched once the countdown has really run (callSeconds starts at 0 until
  // remainingTime arrives), so "00:00 End" only shows when the time ran out.
  if (isFreeCall && freeSecondsLeft > 0) freeTimerStartedRef.current = true;
  const isFreeCallEndingSoon = joined && freeCallPhase.isEndingSoon;
  // Free time over and the wallet could not carry the call on.
  const isFreeCallTimeUp = freeCallPhase.isFreeTimeUp;
  // Only the free UI speaks about the wallet during the free part: the paid
  // "Low balance alert" toast (and its Recharge button) would double up on the
  // popup, and is wrong when the wallet can continue.
  freeCallSuppressWarningRef.current = (msg) => isFreeCall && isLowBalanceWarning(msg);

  /*
    "Call duration" (Figma 4886:78101): real connected time, from the moment
    the audio joined, on the wall clock.

    It used to be derived as "free allowance seen − seconds left", which tied it
    to the countdown: that countdown ticks one setInterval step at a time (so it
    lags when the tab is throttled) and is periodically re-synced to the
    server's remainingTime by `activity` events — every re-sync made the
    duration jump, and it ended short whenever the server's clock ran ahead of
    ours (e.g. "02:50" when the free time was up). Wall-clock time from join is
    what the user actually talked for, and it counts up one second at a time.

    The join time is kept per room in sessionStorage so a refresh-resume keeps
    counting instead of restarting at 0. Frozen once the free time is up.
  */
  if (isFreeCallSession && roomId && joined && !freeJoinedAtRef.current) {
    const joinedKey = `shubhtalk_free_call_joined_${roomId}`;
    let joinedAt = 0;
    try {
      joinedAt = Number(sessionStorage.getItem(joinedKey)) || 0;
    } catch {
      /* storage unavailable — count from this mount */
    }
    if (!joinedAt) {
      joinedAt = Date.now();
      try {
        sessionStorage.setItem(joinedKey, String(joinedAt));
      } catch {
        /* ignore */
      }
    }
    freeJoinedAtRef.current = joinedAt;
  }
  /*
    The free allowance (the largest remaining time seen, e.g. 180s), kept per
    room so a refresh-resume doesn't lose it. The server starts its free clock a
    moment before the audio connects, so wall-clock talk time ends a second or
    two short of it ("02:58"). Duration is therefore capped at the allowance,
    and when the free time actually runs out it shows the full allowance
    ("03:00") — what the free session promised. A call ended early by the user
    still shows the real time talked.
  */
  // Only while the free UI is up: after a paid switch callSeconds is the
  // wallet's time, not the free allowance.
  if (isFreeCall && roomId) {
    const allowanceKey = `shubhtalk_free_call_allowance_${roomId}`;
    if (!freeAllowanceRef.current) {
      try {
        freeAllowanceRef.current = Number(sessionStorage.getItem(allowanceKey)) || 0;
      } catch {
        /* storage unavailable */
      }
    }
    if (freeSecondsLeft > freeAllowanceRef.current) {
      freeAllowanceRef.current = freeSecondsLeft;
      try {
        sessionStorage.setItem(allowanceKey, String(freeSecondsLeft));
      } catch {
        /* ignore */
      }
    }
  }
  if (isFreeCall && !isFreeCallTimeUp && freeJoinedAtRef.current) {
    const elapsed = Math.max(0, Math.floor((Date.now() - freeJoinedAtRef.current) / 1000));
    freeDurationRef.current = freeAllowanceRef.current
      ? Math.min(elapsed, freeAllowanceRef.current)
      : elapsed;
  }
  // "Ran out" = the countdown reached (or is within a few seconds of) zero —
  // the server's clock is slightly ahead of ours, so it usually ends the call
  // with 1–3s still showing here.
  const FREE_CALL_END_SLACK_SECONDS = 5;
  const freeTimeRanOut =
    isFreeCall && freeTimerStartedRef.current && freeSecondsLeft <= FREE_CALL_END_SLACK_SECONDS;
  const freeCallDuration = !isFreeCallSession
    ? 0
    : isFreeCallTimeUp && freeAllowanceRef.current
      ? freeAllowanceRef.current
      : freeDurationRef.current;
  // Final value handed to the ended screen when the call is torn down.
  const freeCallFinalDuration =
    freeTimeRanOut && freeAllowanceRef.current
      ? Math.max(freeDurationRef.current, freeAllowanceRef.current)
      : freeCallDuration;

  // Read by cleanup(), which may be the closure from the first render (it runs
  // from the mount effect's teardown), so keep the latest values in a ref.
  //
  // No snapshot (so no locked "free call ended" screen) once the call is a
  // confirmed paid call — it ends like any paid call. A call that switched to
  // paid but ended before the server billed it is still the free call ending
  // (flagged `switchedToPaid`, so a user-pressed End Call skips it).
  const keepFreeCallEndSnapshot =
    isFreeCallSession && !freeCallPhase.isPaidConfirmed;
  freeCallEndRef.current = keepFreeCallEndSnapshot
    ? {
        roomId,
        astrologerId: activeCall?.astrologerId,
        callerName,
        profileImage: getAstrologerImageUrl(astroForImage, "large"),
        thumbImage: getAstrologerImageUrl(astroForImage, "small"),
        gender: astroForImage.gender,
        role: lastRequestedAstro?.role || chatLastRequestedAstro?.role,
        experience: experience || lastRequestedAstro?.experience || chatLastRequestedAstro?.experience,
        offer: freeCallRateOffer,
        durationSeconds: freeCallFinalDuration,
        switchedToPaid: freeCallPhase.hasSwitchedToPaid,
      }
    : null;

  // Popup / banner: recharge in place — the call keeps running underneath.
  const handleFreeCallRecharge = () => {
    setFreeLowBalanceDismissed(true);
    setIsRechargeModalOpen(true);
  };

  /* ================= CHAT NOTIFICATION ================= */
  // Keep activeCallRef in sync so socket handlers always have current values
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    speakerOnRef.current = speakerOn;
  }, [speakerOn]);

  // Signal active call to suppress duplicate notifications from ChatContext & FCM
  useEffect(() => {
    window.__shubhtalk_call_active = true;
    return () => { window.__shubhtalk_call_active = false; };
  }, []);

  const [chatNotification, setChatNotification] = useState(null);
  const notificationTimerRef = useRef(null);

  const showChatNotification = useCallback((data) => {
    if (data.sender === "user") return;
    // A Pandit AI reply is not a message from this call's astrologer.
    if (isPanditAIEvent(data)) return;
    // Hide product notifications when mall is disabled
    if (data.type === "products" && !isShubhMallEnabled()) return;
    
    let messageText;
    if (data.type === "gift") {
      messageText = "🎁 Sent a gift";
    } else if (data.type === "products") {
      messageText = "💊 Suggested a remedy";
    } else if (data.type === "attachment") {
      messageText = "📎 " + getAttachmentDisplayName(data.message || data.response || "");
    } else if (data.type === "image") {
      messageText = "📷 Image";
    } else if (data.type === "audio") {
      messageText = "🎵 Audio";
    } else if (data.type === "video") {
      messageText = "🎬 Video";
    } else {
      messageText = data.message || data.response || "New message";
    }
    // Use the same resolved avatar the call UI uses. The old chain missed
    // `profileImgUrl` / `profileImages` (the fields the astrologer API actually
    // returns), so the toast fell back to a placeholder.
    const astroImage = notificationAstroImage;
    const astroGender = notificationAstroGender;
    setChatNotification({
      senderName: callerName || "Astrologer",
      message: messageText,
      image: astroImage,
      gender: astroGender,
      astrologerId: activeCall?.astrologerId,
      type: data.type,
    });

    // Auto-dismiss after 4 seconds
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => {
      setChatNotification(null);
    }, 4000);
  }, [callerName, notificationAstroImage, notificationAstroGender]);

  useEffect(() => {
    voiceSocket.on("message:recieved", showChatNotification);
    
    const handleProductMessage = (data) => {
      if (!isShubhMallEnabled()) return;
      if (data?.type === "products" && data?.suggestedProducts?.length > 0) {
        setSuggestedRemedyData((prev) => ({
          entries: [...prev.entries, { message: data.message || null, products: data.suggestedProducts }],
          suggestedProducts: [...prev.suggestedProducts, ...data.suggestedProducts],
          messages: data.message ? [...prev.messages, data.message] : prev.messages,
        }));
        setHasNewRemedy(true);
      }
    };
    voiceSocket.on("message:recieved", handleProductMessage);

    return () => {
      voiceSocket.off("message:recieved", showChatNotification);
      voiceSocket.off("message:recieved", handleProductMessage);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, [showChatNotification]);

  /* ================= WALLET BALANCE ================= */
  const { balance, isFetching, refreshWallet } = useWalletBalance();
  const [getBalance, { isLoading: isCheckingBalance }] = useGetBalanceMutation();
  const { checkPermission } = useMediaPermission();

  /* ================= MINI CALL OVERLAY BRIDGE ================= */
  // No longer needed — mic/speaker state is shared via CallContext

  // Fetch kundli profiles
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  // Ref to store sendMessage function from VideoCallChat
  const sendChatMessageRef = useRef(null);

  /* ================= CHAT & PROFILE HANDLERS ================= */
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleProfileSelect = (profile) => {
    if (!profile?._id) {
      console.error("Invalid profile selected");
      return;
    }

    setSelectedProfile(profile);

    // Send the bare kundliId (origin-independent) and pass it as the kundliId
    // override so the payload references the picked profile, not the session
    // default. Renderers rebuild the link from the current origin.
    if (sendChatMessageRef.current) {
      sendChatMessageRef.current(profile._id, "kundli", profile._id);
    }

    setShowProfileModal(false);
    setIsChatOpen(true);
  };

  const hasOngoingChat = () => {
    if (activeChat?.roomId) return true;

    try {
      return !!JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "null")?.roomId;
    } catch (err) {
      console.warn("[VoiceCall] Failed to read persisted chat state:", err);
      return false;
    }
  };

  /* ================= PREVENT ACCIDENTAL REFRESH & DETECT REFRESH ================= */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      isRefreshingRef.current = true;
      console.log("[VoiceCall] 🔄 beforeunload fired — isRefreshing=true, roomId:", roomId);
      // Show browser confirmation to prevent accidental refresh
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;

    const savedCall = localStorage.getItem("shubhtalk_active_call");
    const savedSecs = sessionStorage.getItem("shubhtalk_call_seconds");
    console.log("[VoiceCall] 🚀 Mount — roomId:", roomId, "isUserSide:", isUserSide);
    console.log("[VoiceCall] 📦 localStorage activeCall:", savedCall ? "exists" : "null", "| sessionStorage seconds:", savedSecs);

    const startCall = async () => {
      console.log("[VoiceCall] ⏳ Creating Agora client & joining channel");
      console.log("[VoiceCall]   → roomId:", roomId);
      console.log("[VoiceCall]   → channelName:", channelName);
      console.log("[VoiceCall]   → agoraChannelName (used for join):", agoraChannelName);
      console.log("[VoiceCall]   → agoraToken:", agoraToken ? agoraToken.substring(0, 20) + "..." : "MISSING");
      console.log("[VoiceCall]   → callData keys:", Object.keys(callData));
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Signal/network quality — fires ~every 2s with uplink/downlink ratings
      client.on("network-quality", (stats) => {
        const info = getWorstNetworkQuality(stats);
        setNetworkQuality(info);
        // Once we've had a real reading, a drop back to 0 means the signal
        // was lost — surface the reconnecting banner.
        if (info.quality > 0) {
          hadNetworkRef.current = true;
          setIsNetworkLost(false);
        } else if (hadNetworkRef.current) {
          setIsNetworkLost(true);
        }
      });

      client.on("user-published", async (user, mediaType) => {
        console.log("[VoiceCall] 📡 user-published — uid:", user.uid, "mediaType:", mediaType, "pendingTimer:", !!userLeftTimerRef.current);
        // Cancel any pending end-call grace timer — remote user is back
        if (userLeftTimerRef.current) {
          clearTimeout(userLeftTimerRef.current);
          userLeftTimerRef.current = null;
          console.log("[VoiceCall] ✅ user-published: cancelled pending endCall grace timer");
        }

        try {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            if (speakerOnRef.current) {
              user.audioTrack?.setVolume(100);
              user.audioTrack?.play();
            } else {
              user.audioTrack?.setVolume(0);
            }
          }
        } catch (err) {
          console.warn("[VoiceCall] ⚠️ Subscribe failed (will retry on next publish):", err.message);
        }
      });

      client.on("user-unpublished", async (user, mediaType) => {
        console.log("[VoiceCall] 📴 user-unpublished — uid:", user.uid, "mediaType:", mediaType);
        if (mediaType === "video") {
          user.videoTrack?.stop();
        }
      });

      // Grace period so a page refresh doesn't kill the call
      client.on("user-left", (user) => {
        // Don't end call if we're upgrading to video
        if (isUpgradingToVideo.current) return;

        console.log("[VoiceCall] 👋 user-left — uid:", user.uid, "— backend will handle session end");
        // No client-side endCall timer — backend owns session lifecycle
      });

      client.on("user-joined", (user) => {
        console.log("[VoiceCall] 🤝 user-joined — uid:", user.uid, "pendingTimer:", !!userLeftTimerRef.current);
        // User reconnected — cancel the pending end-call
        if (userLeftTimerRef.current) {
          clearTimeout(userLeftTimerRef.current);
          userLeftTimerRef.current = null;
          console.log("[VoiceCall] ✅ user-joined: cancelled pending endCall grace timer");
        }
      });

      // Retry join with exponential backoff — Agora channel may not be ready immediately
      // after two-way accept (astrologer may still be joining the channel)
      const MAX_JOIN_RETRIES = 5;
      const RETRY_DELAY_BASE = 2000; // ms
      let joinSuccess = false;

      for (let attempt = 0; attempt < MAX_JOIN_RETRIES; attempt++) {
        if (cleanupRef.current) return; // Component unmounted during retry
        try {
          console.log("[VoiceCall] 🔌 Agora join attempt", attempt + 1, "of", MAX_JOIN_RETRIES);
          await client.join(APP_ID, agoraChannelName, agoraToken, "");
          console.log("[VoiceCall] ✅ Agora joined — channel:", agoraChannelName, "remoteUsers:", client.remoteUsers.length);
          joinSuccess = true;
          break;
        } catch (joinErr) {
          const isGatewayError = joinErr?.code === "CAN_NOT_GET_GATEWAY_SERVER" ||
            joinErr?.message?.includes("CAN_NOT_GET_GATEWAY_SERVER") ||
            joinErr?.message?.includes("no active status");

          if (isGatewayError && attempt < MAX_JOIN_RETRIES - 1) {
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
            console.warn(`[VoiceCall] ⚠️ Agora gateway not ready (attempt ${attempt + 1}), retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            // Leave in case partial join happened
            try { await client.leave(); } catch { /* ignore */ }
          } else {
            throw joinErr;
          }
        }
      }

      if (!joinSuccess) return;

      // Clear the resume flag now that we've successfully rejoined
      if (isResumeFromRefresh.current) {
        console.log("[VoiceCall] 🔄 Clearing isResumeFromRefresh flag (Agora joined successfully)");
        setTimeout(() => {
          isResumeFromRefresh.current = false;
          console.log("[VoiceCall] ✅ isResumeFromRefresh cleared");
        }, 5000);
      }

      // During video→audio downgrades the old VideoCall component is unmounting
      // concurrently and releasing its mic/camera tracks. If the browser hasn't
      // fully freed the mic yet, createMicrophoneAudioTrack can fail. Retry a
      // few times with a short delay to give the old tracks time to close.
      const MAX_TRACK_RETRIES = 3;
      const TRACK_RETRY_DELAY = 800; // ms
      for (let attempt = 1; attempt <= MAX_TRACK_RETRIES; attempt++) {
        try {
          micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: {
              sampleRate: AUDIO_ENCODER_CONFIG.sampleRate,
              stereo: AUDIO_ENCODER_CONFIG.stereo,
              bitrate: AUDIO_ENCODER_CONFIG.bitrate,
            },
          });
          break; // success
        } catch (trackErr) {
          console.warn(`[VoiceCall] ⚠️ Mic track creation attempt ${attempt}/${MAX_TRACK_RETRIES} failed:`, trackErr.message);
          if (attempt === MAX_TRACK_RETRIES) throw trackErr;
          await new Promise((r) => setTimeout(r, TRACK_RETRY_DELAY));
        }
      }
      // Publish track while it is still enabled — Agora SDK rejects
      // publishing disabled tracks with TRACK_IS_DISABLED. We apply the
      // mute state (isMicOn) AFTER publishing so the track is accepted
      // by the server and then silenced locally.
      await client.publish([micTrackRef.current]);
      // Now sync mic track with context mute state (persists across remounts)
      micTrackRef.current.setEnabled(isMicOn);
      console.log("[VoiceCall] 🎙️ Mic track published, micOn:", isMicOn);

      setJoined(true);
      
      // Only set initial call seconds if not resuming from a refresh
      const savedSeconds = sessionStorage.getItem("shubhtalk_call_seconds");
      if (savedSeconds && Number(savedSeconds) > 0) {
        console.log("[VoiceCall] 🔄 Resuming from refresh, seconds:", savedSeconds);
        setCallSeconds(Number(savedSeconds));
        sessionStorage.removeItem("shubhtalk_call_seconds");
      } else {
        const raw = callData.remainingTime || activeCall?.remainingTime || 0;
        const rawNum = Number(raw) || 0;
        // Backend may send remainingTime in minutes — convert to seconds
        const seconds = rawNum > 0 ? Math.floor(rawNum * 60) : 0;
        console.log("[VoiceCall] 🆕 Fresh call — raw remainingTime:", raw, "→ seconds:", seconds);
        if (seconds > 0) {
          setCallSeconds(seconds);
        } else {
          // remainingTime not available yet — timer will update when 'activity' event arrives
          console.log("[VoiceCall] ⚠️ remainingTime is 0 — waiting for activity event");
        }
      }
      
      startTimer();

      // Track Consultation Started event
      BranchEvents.trackConsultationStarted({
        page_name: "Voice Call",
        route_name: "voice-call",
        route_path: window.location.pathname,
        user_type: "logged_in",
        user_id: localStorage.getItem("shubhtalk_customer_id"),
        astrologer_id: activeCall?.astrologerId,
        astrologer_name: callerName || getAstrologerDisplayName(lastRequestedAstro),
        consultation_id: roomId,
        consultation_type: "audio",
        source: "listing",
      });
    };

    startCall().catch((err) => {
      console.error("[VoiceCall] ❌ startCall error:", err);
      // Don't crash the call UI — Agora connection failed but socket session is still alive
      // The call will continue without local audio until reconnection
      Toast.error("Audio connection failed. Please check your network.");
    });

    // On unmount: only release Agora resources
    // Do NOT clear activeCall — if this is a refresh, we need it to persist
    return () => {
      console.log("[VoiceCall] 🧹 useEffect cleanup (unmount) — isRefreshing:", isRefreshingRef.current);
      // Check if we're upgrading to video - if so, skip emitting call:end
      cleanup(isUpgradingToVideo.current);
    };
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= MIC TOGGLE ================= */
  useEffect(() => {
    try {
      micTrackRef.current?.setEnabled(micOn);
    } catch (e) {
      console.warn("[VoiceCall] Mic setEnabled failed (connection not ready):", e.message);
    }
  }, [micOn]);

  /* ================= SPEAKER TOGGLE ================= */
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // On iOS Safari, setVolume(0) is unreliable. Use stop/play instead.
    client.remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        if (speakerOn) {
          user.audioTrack.setVolume(100);
          try { user.audioTrack.play(); } catch (e) { /* already playing */ }
        } else {
          user.audioTrack.setVolume(0);
          try { user.audioTrack.stop(); } catch (e) { /* already stopped */ }
        }
      }
    });
  }, [speakerOn]);

  /* ================= CLEANUP ================= */
  const cleanup = async (skipEmit = false) => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;
    console.log("[VoiceCall] 🧹 cleanup() — releasing all resources");

    if (userLeftTimerRef.current) {
      clearTimeout(userLeftTimerRef.current);
      userLeftTimerRef.current = null;
    }

    try {
      await micTrackRef.current?.stop();
      await micTrackRef.current?.close();
      await clientRef.current?.leave();
    } catch (e) {
      console.warn("Voice cleanup error:", e);
    } finally {
      micTrackRef.current = null;
      clientRef.current = null;

      let persistedCallType = null;
      try {
        persistedCallType = JSON.parse(localStorage.getItem("shubhtalk_active_call") || "null")?.callType || null;
      } catch (err) {
        console.warn("[VoiceCall] Failed to read persisted call state during cleanup:", err);
      }

      // Preserve activeCall during audio -> video switches even if this component
      // unmounts before the upgrade flag or ref has fully propagated.
      if (!skipEmit && activeCallRef.current?.callType !== "video" && persistedCallType !== "video") {
        /*
          Free call over: keep its locked end state on screen (rendered by
          VideoCallContainer once activeCall is cleared) instead of the call UI
          simply vanishing. The review modal still opens on top of it as usual.
          Not when a chat is still running — that chat is the live session.
        */
        const freeEnd = freeCallEndRef.current;
        if (freeEnd && !(freeEnd.switchedToPaid && userEndedCallRef.current) && !hasOngoingChat()) {
          setEndedFreeCall(freeEnd);
        }
        setActiveCall(null);
      }
      
      stopTimer();
    }
  };

  /* ================= END CALL ================= */
  const endCall = async () => {
    // Don't emit call:end if we're upgrading to video
    if (!isUpgradingToVideo.current) {
      const currentCall = activeCallRef.current;
      userEndedCallRef.current = true;
      
      // Track Consultation Completed event
      BranchEvents.trackConsultationCompleted({
        page_name: "Call Ended",
        route_name: "voice-call",
        route_path: window.location.pathname,
        user_type: "logged_in",
        user_id: localStorage.getItem("shubhtalk_customer_id"),
        astrologer_id: currentCall?.astrologerId,
        astrologer_name: currentCall?.callerName || callerName,
        consultation_id: roomId,
        consultation_type: "audio",
        actual_duration_minutes: Math.round(callSeconds / 60),
        scheduled_duration_minutes: 0,
        completion_status: "completed",
      });
      
      setReviewData({
        astrologerID: currentCall?.astrologerID || currentCall?.astrologerId,
        fullName: currentCall?.callerName || callerName,
        profileImage: resolveReviewImage(currentCall),
        roomId,
        gender: lastRequestedAstro?.gender || chatLastRequestedAstro?.gender || activeCall?.gender,
      });

      voiceSocket.emit("call:end", {
        roomId: socketRoomId,
        endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
      });
      
      // Refresh wallet balance after call ends
      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));
      
      // Clear waiting list to prevent waiting popup from showing
      setWaitingList(null);
      
      // Don't show review when this call was started from an ongoing chat.
      if (!hasOngoingChat()) {
        setOpenReview(true);
      }
    }
    
    await cleanup(isUpgradingToVideo.current);
  };

  // Gated end call — show confirmation only when this is the last active session
  const requestEndCall = () => {
    if (hasOngoingChat()) {
      // Chat is still active, just end the call directly (no confirmation needed)
      endCall();
    } else {
      setShowEndCallConfirm(true);
    }
  };

  const confirmEndCall = () => {
    setShowEndCallConfirm(false);
    endCall();
  };

  // const handleCallCanceled = async () => {
  //   await cleanup();
  // };

  /* ================= NETWORK RECONNECTION STATE ================= */
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds to reconnect

  /* ================= DETECT CALL TYPE CHANGE (AUDIO -> VIDEO) ================= */
  useEffect(() => {
    // Listen for upgrade event from CallContext
    const handleUpgradeEvent = (event) => {
      if (event.detail.roomId === roomId) {
        console.log("🔄 Received upgrade event, setting flag...");
        isUpgradingToVideo.current = true;
      }
    };

    const handleWarning = (msg) => {
      // Pandit AI's own low-balance warning is shown inside Pandit AI.
      if (isPanditAIEvent(msg)) return;
      if (freeCallSuppressWarningRef.current?.(msg)) return;
      if (msg?.message?.includes("Low balance alert")) {
        setShowRechargeButton(true);
      }
      Toast.warning(msg.message);
    };

    // Handle socket disconnect - don't end call immediately, wait for reconnection
    const handleSocketDisconnect = (reason) => {
      console.log("[VoiceCall] 🔴 Socket disconnected — reason:", reason);
      
      // Don't start reconnection if we're upgrading to video or intentionally ending
      if (isUpgradingToVideo.current || cleanupRef.current) {
        console.log("[VoiceCall] Skipping reconnection (upgrading or cleanup in progress)");
        return;
      }
      
      // Show reconnecting state to user
      setIsReconnecting(true);
      // Toast.info("Connection lost. Attempting to reconnect...");
      
      // Start grace period timer - only end call if we can't reconnect in time
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[VoiceCall] ⏰ Reconnection grace period expired — ending call");
        Toast.error("Unable to reconnect. Call ended.");
        setIsReconnecting(false);
        endCall();
      }, RECONNECT_GRACE_PERIOD);
    };

    // Handle socket reconnect - cancel the grace period timer
    const handleSocketReconnect = () => {
      console.log("[VoiceCall] ✅ Socket reconnected");
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsReconnecting(false);
    };

    window.addEventListener('call:upgrading-to-video', handleUpgradeEvent);
    voiceSocket.on("disconnect", handleSocketDisconnect);
    voiceSocket.on("connect", handleSocketReconnect);
    voiceSocket.on("warning", handleWarning);

    return () => {
      window.removeEventListener('call:upgrading-to-video', handleUpgradeEvent);
      voiceSocket.off("disconnect", handleSocketDisconnect);
      voiceSocket.off("connect", handleSocketReconnect);
      voiceSocket.off("warning", handleWarning);
      
      // Clear reconnect timer on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [roomId]);

  // Detect via activeCall change - this catches any case where callType changes
  useEffect(() => {
    // If we're currently in an audio call and activeCall exists with video type
    if (activeCall && activeCall.callType === "video" && activeCall.roomId === roomId) {
      console.log("🔄 Detected activeCall changed to video, setting upgrade flag...");
      isUpgradingToVideo.current = true;
      setIsSwitching(false);
      setWaitingList(null);
    }
  }, [activeCall, roomId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    /*
      call:ended / call:rejected / call:reconnected are socket-wide, and this
      effect is registered once ([] deps). Nothing here checked the room, so an
      event about ANOTHER room — a withdrawn or timed-out request to a second
      astrologer, a previous session, the chat running alongside — was taken as
      this call ending: "Call ended." toast + local teardown, while the server
      kept the real call running (a refresh restored it via session:active_list).
      VideoCall already guards call:ended this way. Read the live roomId from the
      ref: the closure's `socketRoomId` is the first render's.

      Only ignored when the payload names a different room, so a payload without
      roomId behaves exactly as before.
    */
    const isOtherRoom = (data) => {
      const ownRoomId = activeCallRef.current?.roomId || socketRoomId;
      return !!(data?.roomId && ownRoomId && data.roomId !== ownRoomId);
    };

    const handleCallEnded = (data) => {
      if (isOtherRoom(data)) {
        console.log("[VoiceCall] Ignoring call:ended for another room —", data.roomId);
        return;
      }
      if (data?.endedBy === "SYSTEM") {
        if (isUpgradingToVideo.current || cleanupRef.current) {
          return;
        }

        setIsReconnecting(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[VoiceCall] ⏰ SYSTEM reconnect grace period expired — ending call");
          Toast.error("Unable to reconnect. Call ended.");
          setIsReconnecting(false);
          endCall();
        }, RECONNECT_GRACE_PERIOD);

        reconnectToCall?.(activeCallRef.current);
        return;
      }

      // Server already ended the call, don't emit call:end again
      if (!isUpgradingToVideo.current) {
        const currentCall = activeCallRef.current;
        setReviewData({
          astrologerID: currentCall?.astrologerID || currentCall?.astrologerId,
          fullName: currentCall?.callerName || callerName,
          profileImage: resolveReviewImage(currentCall),
          roomId,
          gender: lastRequestedAstro?.gender || chatLastRequestedAstro?.gender || activeCall?.gender,
        });

        // Refresh wallet balance after call ends
        refreshWallet();
        window.dispatchEvent(new Event("walletBalanceUpdated"));
        
        // Clear waiting list to prevent waiting popup from showing
        setWaitingList(null);

        Toast.success("Call ended.");
        
        // Show review only when there's no ongoing chat session.
        // If chat is still active (e.g. voice was upgraded from chat), skip review.
        if (!hasOngoingChat()) {
          setOpenReview(true);
        }
      }
      
      cleanup(isUpgradingToVideo.current);
    };

    const handleCallReconnected = (data) => {
      if (isOtherRoom(data)) return;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsReconnecting(false);
    };

    const handleCallRejected = (data) => {
      // Check if this is a video switch rejection
      if (data?.switchRejected && data?.type === "audio") {
        console.log("🔄 Video switch rejected - resuming audio call");
        
        // Reset the upgrade flag since we're staying in audio mode
        isUpgradingToVideo.current = false;
        setIsSwitching(false);
        setWaitingList(null);
        
        // Show toast notification
        Toast.info(data?.message || "Video call request rejected. Continuing with audio call.");
        
        // Don't end the call - just continue with audio
        return;
      }
      
      // A rejection of some other request must not end (and call:end) this call.
      if (isOtherRoom(data)) {
        console.log("[VoiceCall] Ignoring call:rejected for another room —", data.roomId);
        return;
      }

      // If it's a regular call rejection (not a switch), end the call
      console.log("📞 Regular call rejection - ending call");
      setIsSwitching(false);
      endCall();
    };

    // CallContext fires this when a SYSTEM-ended call's reconnect fails/times out.
    // Cancel our grace-period timer (so no stray "Unable to reconnect" toast) and
    // tear the call down cleanly. CallContext already showed the "Call ended."
    // toast and opened the review.
    const handleGlobalCallEnded = (e) => {
      if (isOtherRoom(e?.detail)) return;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsReconnecting(false);
      endCall();
    };
    window.addEventListener("global:call:ended", handleGlobalCallEnded);

    voiceSocket.on("call:ended", handleCallEnded);
    // voiceSocket.on("call:canceled", handleCallCanceled);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:reconnected", handleCallReconnected);

    const handleSwitchRejected = (data) => {
      console.log("🔄 call:switch_rejected in VoiceCall", data);
      trackEvent("session_ladder_upgrade_rejected", { astrologer_id: activeCall?.astrologerId, session_id: socketRoomId, requested_channel: "video" });
      isUpgradingToVideo.current = false;
      setIsSwitching(false);
      setWaitingList(null);
      Toast.info(data?.message || "Switch request rejected, continuing current call.");
    };

    const handleSwitchCanceled = (data) => {
      console.log("🔄 call:switch_canceled in VoiceCall", data);
      isUpgradingToVideo.current = false;
      setIsSwitching(false);
      setWaitingList(null);
      Toast.info(data?.message || "Switch request canceled, continuing current call.");
    };

    voiceSocket.on("call:switch_rejected", handleSwitchRejected);
    voiceSocket.on("call:switch_canceled", handleSwitchCanceled);

    return () => {
      window.removeEventListener("global:call:ended", handleGlobalCallEnded);
      voiceSocket.off("call:ended", handleCallEnded);
      // voiceSocket.off("call:canceled", handleCallCanceled);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("call:reconnected", handleCallReconnected);
      voiceSocket.off("call:switch_rejected", handleSwitchRejected);
      voiceSocket.off("call:switch_canceled", handleSwitchCanceled);
    };
    // eslint-disable-next-line
  }, []);

  /* ================= DRAG ================= */
  const dragOffset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: x - position.x, y: y - position.y };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  const formatTime = (sec) => {
    const totalSec = Math.max(0, Math.floor(Number(sec) || 0));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatAmount = (amount) => {
    if (typeof amount !== "number") return `₹${amount}`;
    if (amount >= 1000) {
      const kValue = Math.floor(amount / 100) / 10;
      return kValue % 1 === 0 ? `₹${kValue}k` : `₹${kValue}k`;
    }
    return amount % 1 === 0 ? `₹${amount}` : `₹${amount.toFixed(2)}`;
  };

  // Get kundliId with fallback logic
  const effectiveKundliId = useMemo(() => {
    if (selectedKundli?._id) return selectedKundli._id;
    if (activeCall?.kundliId) return activeCall.kundliId;
    if (lastSelectedKundli?._id) return lastSelectedKundli._id;
    if (profiles && profiles.length > 0) return profiles[0]._id;
    return null;
  }, [selectedKundli, activeCall?.kundliId, lastSelectedKundli, profiles]);

  // userName-first — used by the in-call chat greeting/header.
  const astrologerName = useMemo(() => {
    if (!lastRequestedAstro) return callerName || "";
    return getAstrologerDisplayName(lastRequestedAstro) || callerName || "";
  }, [lastRequestedAstro, callerName]);

  /*
    The full profile behind effectiveKundliId. The in-call chat opens with the
    customer's birth details (Name / Gender / DOB / TOB / POB), which needs the
    profile object, not just its id.
  */
  // Plain expression, not a hook: this component returns early above, so every
  // hook added here compounds the existing conditional-hook problem. A find over
  // a handful of profiles costs nothing per render.
  const kundliProfile = resolveKundliProfile({
    selectedKundli,
    lastSelectedKundli,
    profiles,
    kundliId: effectiveKundliId,
  });

  const chatData = useMemo(() => ({
    userId: activeCall?.userId,
    astrologerId: activeCall?.astrologerId,
    chatRoomId: activeCall?.roomId,
    kundliId: effectiveKundliId,
    kundliProfile,
    isUserSide: activeCall?.isUserSide,
    astrologerName: astrologerName,
    // Keyed on the profile's id rather than the object so chatData keeps a stable
    // identity across renders (kundliProfile is recomputed each time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeCall?.userId, activeCall?.astrologerId, activeCall?.roomId, effectiveKundliId, kundliProfile?._id, activeCall?.isUserSide, astrologerName]);

  const toggleCamera = async () => {

    // Check camera + mic permission before switching to video
    const hasPermission = await checkPermission("both");
    if (!hasPermission) return;

    try {
      // Check balance before switching to video
      const balanceResponse = await getBalance({
        astrologerId: activeCall.astrologerId,
        type: "video"
      }).unwrap();

      // Check if balance is sufficient - look at data.status
      if (!balanceResponse?.data?.status) {
        const { availableAmount = 0, requiredAmount = 0, pricePerMinute = 0 } = balanceResponse.data || {};
        
        const shortfall = requiredAmount - availableAmount;
        const errorMessage = `Insufficient balance for video call. You need ₹${shortfall.toFixed(2)} more. (Available: ₹${availableAmount}, Required: ₹${requiredAmount})`;
        
        Toast.error(errorMessage);
        
        // Show recharge modal
        setIsMinimized(true);
        setIsRechargeModalOpen(true);
        return;
      }

      // Balance is sufficient, proceed with video call
      Toast.success("Switching to video call...");
      setIsSwitching(true);

      trackEvent("session_ladder_upgrade_requested", { astrologer_id: activeCall.astrologerId, session_id: socketRoomId, from_channel: "audio", to_channel: "video" });
      voiceSocket.emit("call:initiate", {
        userId: activeCall.userId,
        astrologerId: activeCall.astrologerId,
        type: "video",
        isSwitch: true,
        roomId: socketRoomId,
        ...(activeCall?.isEmergency && { isEmergency: true }),
      });

    } catch (error) {
      console.error("❌ Balance check error:", error);
      
      // Handle different error scenarios
      if (error?.data?.message) {
        Toast.error(error.data.message);
      } else if (error?.message) {
        Toast.error(error.message);
      } else {
        Toast.error("Failed to check balance. Please try again.");
      }

      // Show recharge modal on error
      setIsMinimized(true);
      setIsRechargeModalOpen(true);
    }
  };

  /* ================= NAVIGATE TO CHAT ================= */
  const handleNavigateToChat = () => {
    if (!activeCall?.astrologerId || !activeCall?.roomId) {
      console.error("Missing required chat data");
      return;
    }

    setIsMinimized(true);
    navigate(`/chat-to-astrologer/${activeCall.astrologerId}`, {
      state: {
        userId: activeCall.userId,
        astrologerId: activeCall.astrologerId,
        roomId: activeCall.roomId,
        fullName: callerName,
        isUserSide: activeCall.isUserSide,
        kundliId: activeCall.kundliId,
        astrologerName: callerName,
        astroID: activeCall.astrologerID,
        experience: activeCall.experience || lastRequestedAstro?.experience,
        profileImgUrl: activeCall?.profileImgUrl || lastRequestedAstro?.profileImgUrl || lastRequestedAstro?.imageUrl,
      }
    });
  };

  /* ================= UI ================= */
  const handleCancelSwitch = () => {
    setIsSwitching(false);
    isUpgradingToVideo.current = false;
    voiceSocket.emit("call:cancel", { roomId: socketRoomId, canceledBy: "CUSTOMER", isSwitch: true });
    setWaitingList(null);
  };

  // Rendered inside whichever full view is showing (paid or free), so it is
  // always visible.
  const chatNotificationBanner = chatNotification && (
    <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, width: 'fit-content', maxWidth: '90vw' }}>
      <ChatNotificationBanner
        senderName={chatNotification.senderName}
        message={chatNotification.message}
        imageUrl={chatNotification.image}
        gender={chatNotification.gender}
        onClose={() => setChatNotification(null)}
        onClick={() => {
          setChatNotification(null);
          if (chatNotification.type === "products") {
            setIsRemedyPanelOpen(true);
            setHasNewRemedy(false);
          } else {
            setIsMinimized(true);
            navigate(`/chat-to-astrologer/${chatNotification.astrologerId}`, {
              state: {
                userId: activeCall?.userId,
                astrologerId: activeCall?.astrologerId,
                roomId: activeCall?.roomId,
                fullName: callerName,
                isUserSide: activeCall?.isUserSide,
                kundliId: activeCall?.kundliId,
                astrologerName: callerName,
                astroID: activeCall?.astrologerID,
                experience: activeCall?.experience || lastRequestedAstro?.experience,
                profileImgUrl: activeCall?.profileImgUrl || lastRequestedAstro?.profileImgUrl || lastRequestedAstro?.imageUrl,
              }
            });
          }
        }}
      />
    </div>
  );

  return (
    <>
      {/* Switch Waiting Popup */}
      <SwitchWaitingPopup
        isVisible={isSwitching}
        switchType="video"
        onCancel={handleCancelSwitch}
      />

      {/* MINI VIEW */}
      {isMinimized && !isOnLivePage && (
        <div
          className={styles.miniCall}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className={styles.miniHeader}>
            <span>
              {capitalizeWords(callerName)} • {joined ? formatTime(isFreeCall ? freeSecondsLeft : callSeconds) : "Calling…"}
            </span>
            <button onClick={() => {
              if (activeCall?.origin === "live") {
                const channel = activeCall.liveChannel;
                setIsMinimized(true);
                navigate(channel ? `/live/${channel}` : "/live");
              } else {
                setIsMinimized(false);
              }
            }}>⤢</button>
          </div>

          <div className={styles.miniControls}>
            <button onClick={() => setMicOn((m) => !m)}>
              {micOn ? <IoMic size={18} /> : <IoMicOff size={18} />}
            </button>

            <button className={styles.endBtnMini} onClick={requestEndCall}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* FULL VIEW — free first-session call (Figma 4886:78101 / 4886:77924).
          The paid layout below is unchanged; the panels that the free layout
          has no buttons for stay mounted so a notification can still open them. */}
      {!isMinimized && isFreeCall && (
        <FreeCallScreen
          callerName={callerName}
          experience={experience || lastRequestedAstro?.experience || chatLastRequestedAstro?.experience}
          thumbImage={getAstrologerImageUrl(astroForImage, "small")}
          profileImage={getAstrologerImageUrl(astroForImage, "large")}
          gender={astroForImage.gender}
          remainingSeconds={freeSecondsLeft}
          isEnded={isFreeCallTimeUp}
          status={
            isReconnecting || isNetworkLost ? "Reconnecting..." : joined ? "Connected" : "Connecting…"
          }
          statusTone={joined && !isReconnecting && !isNetworkLost ? "connected" : "pending"}
          durationSeconds={freeCallDuration}
          onBack={() => setIsMinimized(true)}
          // No Virtual Assistant / View History / Send Gift during the free
          // session (on request): they come back on the regular call screen
          // once the free time is over. FreeCallScreen still supports them via
          // `actions` and `controls.onSendGift` if they are wanted again.
          controls={{
            micOn,
            speakerOn,
            onToggleMic: () => setMicOn((m) => !m),
            onToggleSpeaker: () => setSpeakerOn((s) => !s),
            onEndCall: requestEndCall,
          }}
          bottom={
            !isFreeCallEndingSoon ? null : freeCallPhase.canContinue ? (
              <FreeCallContinueNotice remainingSeconds={freeSecondsLeft} ratePerMinute={freeCallRatePerMinute} />
            ) : (
              <FreeCallEndingBanner onRecharge={handleFreeCallRecharge} />
            )
          }
        >
          {chatNotificationBanner}
          <VideoCallChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            videoCallData={chatData}
            sendMessageRef={sendChatMessageRef}
          />
          <SuggestedRemedyPanel
            isOpen={isRemedyPanelOpen}
            onClose={() => setIsRemedyPanelOpen(false)}
            remedyData={suggestedRemedyData}
            onProductClick={() => {
              setIsRemedyPanelOpen(false);
              setIsMinimized(true);
            }}
          />
          <ProfileManager
            isOpen={showProfileModal}
            onClose={handleCloseProfileModal}
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfile?._id}
            title="Select Profile"
            enabledOperations={{
              list: true,
              add: true,
              edit: true,
              delete: true,
            }}
          />
        </FreeCallScreen>
      )}

      {/* FULL VIEW */}
      {!isMinimized && !isFreeCall && (
        <div className={styles.fullscreenWrapper}>
          {/* Chat Notification Banner - rendered INSIDE fullscreen so it's always visible */}
          {chatNotificationBanner}
          {/* Header */}
          <div className={styles.headerWrap}>
            <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => setIsMinimized(true)}
            >
              <IoArrowBack size={24} />
            </button>

            {/* 40px header thumbnail — `small` is 100x125, enough for 2-3x DPR */}
            <img
              src={getAstrologerImageUrl(astroForImage, "small")}
              alt={callerName}
              width={40}
              height={40}
              onError={(e) => {
                e.currentTarget.src = getAstrologerDefaultImage(astroForImage.gender);
              }}
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", marginLeft: 12, marginRight: 0, flexShrink: 0 }}
            />

            <div className={styles.astrologerInfo}>
              <h3 className={styles.astrologerName}>{capitalizeWords(callerName)}</h3>
              <p className={styles.astrologerExp}>
                {lastRequestedAstro?.role || chatLastRequestedAstro?.role
                  ? (lastRequestedAstro?.role || chatLastRequestedAstro?.role).charAt(0).toUpperCase() + (lastRequestedAstro?.role || chatLastRequestedAstro?.role).slice(1).toLowerCase()
                  : "Astrologer"} • Exp. {experience || lastRequestedAstro?.experience || chatLastRequestedAstro?.experience || "0"} Years
              </p>
            </div>

            <div className={styles.groupBtns}>
              {/* Chat switch — always available */}
              <button 
                className={styles.chateM}
                onClick={handleNavigateToChat}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M15 0H1.66667C0.75 0 0.00833333 0.75 0.00833333 1.66667L0 16.6667L3.33333 13.3333H15C15.9167 13.3333 16.6667 12.5833 16.6667 11.6667V1.66667C16.6667 0.75 15.9167 0 15 0ZM4.16667 5.83333H12.5C12.9583 5.83333 13.3333 6.20833 13.3333 6.66667C13.3333 7.125 12.9583 7.5 12.5 7.5H4.16667C3.70833 7.5 3.33333 7.125 3.33333 6.66667C3.33333 6.20833 3.70833 5.83333 4.16667 5.83333ZM9.16667 10H4.16667C3.70833 10 3.33333 9.625 3.33333 9.16667C3.33333 8.70833 3.70833 8.33333 4.16667 8.33333H9.16667C9.625 8.33333 10 8.70833 10 9.16667C10 9.625 9.625 10 9.16667 10ZM12.5 5H4.16667C3.70833 5 3.33333 4.625 3.33333 4.16667C3.33333 3.70833 3.70833 3.33333 4.16667 3.33333H12.5C12.9583 3.33333 13.3333 3.70833 13.3333 4.16667C13.3333 4.625 12.9583 5 12.5 5Z" fill="url(#paint0_linear_8989_297)"/>
                  <defs>
                    <linearGradient id="paint0_linear_8989_297" x1="0" y1="8.33333" x2="16.6667" y2="8.33333" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
                Chat
              </button>

              {astroAvailability.video && (
              <button className={styles.chateM} onClick={toggleCamera} disabled={isCheckingBalance}>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="11" viewBox="0 0 17 11" fill="none">
                  <path d="M12.8333 4.125V0.916667C12.8333 0.4125 12.4208 0 11.9167 0H0.916667C0.4125 0 0 0.4125 0 0.916667V10.0833C0 10.5875 0.4125 11 0.916667 11H11.9167C12.4208 11 12.8333 10.5875 12.8333 10.0833V6.875L14.9325 8.97417C15.51 9.55167 16.5 9.13917 16.5 8.32333V2.6675C16.5 1.85167 15.51 1.43917 14.9325 2.01667L12.8333 4.125Z" fill="url(#paint0_linear_8989_303)"/>
                  <defs>
                    <linearGradient id="paint0_linear_8989_303" x1="0" y1="5.5" x2="16.5" y2="5.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
                {isCheckingBalance ? "Checking..." : "Video"}
              </button>
              )}

              <span className={styles.dividerLine}></span>
            </div>

            <div className={styles.groupBtnsRight}>

              {/* <button className={styles.chateEnd} onClick={requestEndCall}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <g clipPath="url(#clip0_8989_310)">
                    <path d="M7.11979 8.87333C7.79636 9.5505 8.56101 10.1335 9.39313 10.6067L10.2398 9.76C10.4211 9.58076 10.6499 9.45723 10.8992 9.40406C11.1485 9.35089 11.4078 9.3703 11.6465 9.46C12.2513 9.6857 12.8797 9.84225 13.5198 9.92667C13.8402 9.97195 14.1331 10.1322 14.3441 10.3775C14.5551 10.6228 14.6696 10.9365 14.6665 11.26V13.26C14.6672 13.4457 14.6292 13.6294 14.5548 13.7996C14.4804 13.9697 14.3713 14.1224 14.2345 14.2479C14.0977 14.3734 13.9362 14.469 13.7603 14.5285C13.5844 14.588 13.398 14.61 13.2131 14.5933C11.1617 14.3704 9.19113 13.6694 7.45979 12.5467C6.65664 12.0367 5.91214 11.4398 5.23979 10.7667M3.45979 8.54C2.33703 6.80867 1.63603 4.83811 1.41313 2.78667C1.39647 2.60231 1.41838 2.41651 1.47746 2.24108C1.53654 2.06566 1.63151 1.90446 1.7563 1.76775C1.8811 1.63103 2.033 1.5218 2.20232 1.44701C2.37164 1.37222 2.55469 1.33351 2.73979 1.33333H4.73979C5.06333 1.33015 5.37699 1.44472 5.6223 1.65569C5.86761 1.86666 6.02784 2.15963 6.07313 2.48C6.15754 3.12004 6.31409 3.74848 6.53979 4.35333C6.62949 4.59195 6.6489 4.85127 6.59573 5.10059C6.54256 5.3499 6.41903 5.57874 6.23979 5.76L5.39313 6.60667" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6668 1.33333L1.3335 14.6667" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_8989_310">
                      <rect width="16" height="16" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                End
              </button>

              <span className={styles.dividerLine}></span> */}

              {/* Wallet Balance Badge */}
              <div className={styles.walletBadge} onClick={() => { setIsMinimized(true); navigate("/recharge"); }} style={{ cursor: 'pointer' }}>
                <img src={headerCoin} className={styles.coinImg} alt="coin" />
                <span className={styles.walletAmount}>
                  {formatAmount(isFetching ? "..." : balance || 0)}
                </span>
              </div>

              {/* Recharge Button */}
              <button 
                className={styles.rechargeButton}
                onClick={() => setIsRechargeModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 34 34" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M5 0C2.23858 0 0 2.23858 0 5V28.3333C0 31.0948 2.23858 33.3333 5 33.3333H28.3333C31.0948 33.3333 33.3333 31.0948 33.3333 28.3333V11.6667C33.3333 9.48964 31.942 7.63757 30 6.95118V5C30 2.23858 27.7614 0 25 0H5ZM5 3.33333C4.07953 3.33333 3.33333 4.07953 3.33333 5C3.33333 5.92048 4.07953 6.66667 5 6.66667H26.6667V5C26.6667 4.07953 25.9205 3.33333 25 3.33333H5ZM25 16.6667C23.1591 16.6667 21.6667 18.1591 21.6667 20C21.6667 21.841 23.1591 23.3333 25 23.3333H28.3333C29.2538 23.3333 30 22.5871 30 21.6667V18.3333C30 17.4129 29.2538 16.6667 28.3333 16.6667H25Z" fill="url(#paint0_linear_wallet_vc)"/>
                  <defs>
                    <linearGradient id="paint0_linear_wallet_vc" x1="0" y1="16.6667" x2="33.3333" y2="16.6667" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
              </button>

            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className={`${styles.actionButtons}`}>
            <button className={styles.actionBtn} onClick={toggleChat}>
              <span>Virtual Assistant</span>
            </button>
            {isShubhMallEnabled() && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setIsRemedyPanelOpen(true);
                  setHasNewRemedy(false);
                }}
                style={{ position: 'relative' }}
              >
                <span>Suggested Remedy</span>
                {hasNewRemedy && <span className={styles.notificationDot} />}
              </button>
            )}
            <button
              className={styles.actionBtn}
              onClick={() => {
                setIsMinimized(true);
                navigate("/profile", { state: { activeTab: "Order History", orderHistoryTab: "call" } });
              }}
            >
              <span>View History</span>
            </button>
          </div>

          {/* Network / signal quality indicator */}
          {joined && (
            <span
              className={styles.networkStatus}
              style={{ color: networkQuality.color }}
            >
              <IoCellular className={styles.networkIcon} size={14} />
              {networkQuality.label}
            </span>
          )}

          {/* Voice Center (Avatar & Timer) */}
          <div className={styles.voiceCenter}>
              <div className={styles.voiceCenterWrap}>
                <div className={styles.avatarContainer}>
                  <span className={styles.ripple}></span>
                  <span className={styles.ripple}></span>
                  <span className={styles.ripple}></span>
                  <span className={styles.ripple}></span>
                  {/* .avatarContainer is 220px, so ask for `large` (500x624)
                      rather than `medium` (250x312) — medium would be soft on a
                      2-3x phone. Still a fraction of the unresized original. */}
                  <img
                    className={styles.avatar}
                    src={getAstrologerImageUrl(astroForImage, "large")}
                    alt={callerName}
                    onError={(e) => {
                      e.currentTarget.src = getAstrologerDefaultImage(astroForImage.gender);
                    }}
                  />
                </div>
                <h1 className={styles.callerNameTitle}>{capitalizeWords(callerName)}</h1>
                <span className={styles.totalTime}>{formatTime(callSeconds)}</span>
              </div>

              {showRechargeButton && (
                <button 
                  className={styles.rechargeNowBtn}
                  onClick={() => setIsRechargeModalOpen(true)}
                >
                  Recharge Now
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="15" viewBox="0 0 8 15" fill="none">
                    <path d="M0.75 13.95L6.18333 8.51667C6.825 7.875 6.825 6.825 6.18333 6.18333L0.75 0.75" stroke="#FEFEFE" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}

              <div className={styles.callTimer}>
                {isReconnecting || isNetworkLost ? (
                  <span className={styles.reconnecting}>Reconnecting...</span>
                ) : joined ? (
                  formatTime(callSeconds)
                ) : (
                  "Connecting…"
                )}
              </div>
            </div>

          {/* Bottom Controls */}
          <div className={styles.bottomControls}>
            <div className={styles.controlGrid}>
              <div className={`${styles.controlItem} ${styles.giftWrapMain}`}>
                <button
                  className={`${styles.controlBtn} ${styles.sendGiftBg}`}
                  onClick={() => setIsGiftModalOpen(true)}
                >
                  <IoGift size={24} />
                </button>
                <span className={styles.controlLabel}>Send Gift</span>
              </div>
            </div>

            <div className={styles.controlGrid}>
              <div className={styles.controlItem}>
                <button
                  className={`${styles.controlBtn} ${!micOn ? styles.muted : styles.active}`}
                  onClick={() => setMicOn((m) => !m)}
                >
                  {micOn ? <IoMic size={24} /> : <IoMicOff size={24} />}
                </button>
                <span className={styles.controlLabel}>
                  {micOn ? "Mute Audio" : "Unmute Audio"}
                </span>
              </div>

              <div className={styles.controlItem}>
                <button
                  className={`${styles.controlBtn} ${styles.endCallBtn}`}
                  onClick={requestEndCall}
                >
                  <IoCallSharp size={24} style={{ transform: "rotate(135deg)" }} />
                </button>
                <span className={styles.controlLabel}>End Call</span>
              </div>

              <div className={styles.controlItem}>
                <button 
                  className={`${styles.controlBtn} ${!speakerOn ? styles.muted : styles.active}`}
                  onClick={() => setSpeakerOn((s) => !s)}
                >
                  {speakerOn ? <IoVolumeHigh size={24} /> : <IoVolumeMute size={24} />}
                </button>
                <span className={styles.controlLabel}>
                  {speakerOn ? "Speaker Off" : "Speaker On"}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <VideoCallChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            videoCallData={chatData}
            sendMessageRef={sendChatMessageRef}
          />

          {/* Suggested Remedy Panel */}
          <SuggestedRemedyPanel
            isOpen={isRemedyPanelOpen}
            onClose={() => setIsRemedyPanelOpen(false)}
            remedyData={suggestedRemedyData}
            onProductClick={() => {
              setIsRemedyPanelOpen(false);
              setIsMinimized(true);
            }}
          />

          {/* Profile Listing Modal */}
          <ProfileManager
            isOpen={showProfileModal}
            onClose={handleCloseProfileModal}
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfile?._id}
            title="Select Profile"
            enabledOperations={{
              list: true,
              add: true,
              edit: true,
              delete: true,
            }}
          />

        </div>
      )}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        astrologerId={activeCall?.astrologerId}
        astrologerName={callerName}
        roomId={activeCall?.roomId}
        userId={activeCall?.userId}
        socketSendFn={(message, type) => {
          if (!voiceSocket.connected) {
            return { error: "Socket not connected" };
          }
          voiceSocket.emit("chat:message", {
            sender: "user",
            kundliId: effectiveKundliId,
            roomId: activeCall?.roomId,
            userId: activeCall?.userId,
            astrologerId: activeCall?.astrologerId,
            message,
            type
          });
          return { success: true };
        }}
      />

      {/* Free first session: low wallet balance popup, once (Figma 4886:77824) */}
      <FreeCallLowBalancePopup
        isOpen={isFreeCallEndingSoon && !freeCallPhase.canContinue && !freeLowBalanceDismissed && !isRechargeModalOpen}
        remainingSeconds={freeSecondsLeft}
        onClose={() => setFreeLowBalanceDismissed(true)}
        onRemindLater={() => setFreeLowBalanceDismissed(true)}
        onRecharge={handleFreeCallRecharge}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={(paymentData) => {
          console.log('Payment successful in voice call:', paymentData);
          refreshWallet();
        }}
        title="Recharge to Continue Call"
      />

      {/* Reconnection Overlay */}
      {(isReconnecting || isNetworkLost) && (
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
                  stroke="url(#reconnectGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="80, 200"
                  className={styles.spinnerCircle}
                />
                <defs>
                  <linearGradient id="reconnectGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F75801" />
                    <stop offset="100%" stopColor="#D43400" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className={styles.reconnectTitle}>Connection lost...</h3>
            <p className={styles.reconnectText}>
              Please wait while we restore your connection...
            </p>
          </div>
        </div>
      )}

      {/* End Call Confirmation Modal */}
      {showEndCallConfirm && (
        <div className={styles.endCallConfirmOverlay} onClick={() => setShowEndCallConfirm(false)}>
          <div className={styles.endCallConfirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.endCallConfirmTitle}>End Voice Call?</h3>
            <p className={styles.endCallConfirmText}>
              Are you sure you want to end this call with {callerName || "the astrologer"}?
            </p>
            <div className={styles.endCallConfirmActions}>
              <button className={styles.endCallBtnCancel} onClick={() => setShowEndCallConfirm(false)}>
                Continue
              </button>
              <button className={styles.endCallBtnConfirm} onClick={confirmEndCall}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgoraVoiceCalling;
