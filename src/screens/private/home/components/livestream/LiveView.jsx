import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import { IoMic, IoMicOff, IoCallSharp, IoHourglass } from "react-icons/io5";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import "./styles/videoBox.scss";
import { useLiveViewLogic } from "./useLiveViewLogic";
import GiftPopup from "./GiftPopup";
import CallRequestPopup from "./CallRequestPopup";
import SharePopup from "./SharePopup";
import LiveListModal from "./LiveListModal";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { useReelScroll } from "./useReelScroll";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";
import { getAstrologerDisplayName, getAstrologerProfilePath } from "../../../../../utils/helper/string.utils";

import { useNavigate, useLocation } from "react-router-dom";

import { useGetAllGiftsQuery } from "../../../../../redux/api/gift/giftApi";
import { useLiveList } from "../../../../../context/LiveListContext";
import { useCall } from "../../../../../context/CallContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { ownsRoom } from "../../../../../utils/tabSession";
import WaitingModal from "../../../../../component/UI/modal/waitingModal/WaitingModal";
import WaitlistModal from "../../../../../component/UI/modal/waitlistModal/WaitlistModal";
import Toast from "../../../../../component/toast";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useMediaPermission } from "../../../../../utils/hooks/useMediaPermission";
import { GuestKundliAuthModal } from "../../../../../component/UI/Profile";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { PATH } from "../../../../../utils/routes/Paths";

import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";
import { AppImages, getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../../../utils/appImages";
import astrologerOfflineBg from "../../../../../assets/images/live-streaming-no-astro-background.webp";
import {
  useCheckFollowingStatusQuery,
  useFollowAstrologerByIdMutation,
  useUnfollowAstrologerByIdMutation,
} from "../../../../../redux/api/astrologer/followAstrologerApi";
import { useGetAstrologerByIdQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import KundliSelectModal from "../../../../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";
import SuggestedRemedyPanel from "../../../../../component/call/SuggestedRemedyPanel";
import { addRemedy, clearNewRemedy, clearAllRemedy } from "../../../../../redux/remedy/remedySlice";
import RechargeModal from "../../../../../component/recharge-modal/RechargeModal";
import InsufficientBalanceModal from "../../../../../component/UI/modal/InsufficientBalanceModal/InsufficientBalanceModal";
import { useWalletBalance } from "../../../../private/wallet/useWalletBalance";

const FixedLayer = ({ children }) => {
  return createPortal(children, document.body);
};

const PENDING_LIVE_CALL_STORAGE_KEY = "shubhtalk_pending_live_call";

const LiveView = (props) => {
  console.log("propssssss", props);
  const {
    ROLE,
    isConnected,
    localMicrophoneTrack,
    localCameraTrack,
    remoteUsers,
    micOn,
    setMic,
    cameraOn,
    setCamera,
    setCalling,
    messages,
    chatInput,
    setChatInput,
    participantCount,
    hostLeft,
    astrologer,
    handleLeave,
    roomReady,
    liveStartedAt,
    isHostMuted,
    privateCallInfo,
    isOnPrivateCall,
  } = props;

  const [showGifts, _setShowGifts] = useState(false);
  const [showLiveList, setShowLiveList] = useState(false);
  const [liveListData, setLiveListData] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-refresh live list when socket events fire while modal is open
  useEffect(() => {
    if (!showLiveList) return;
    getAstrologerLiveList()
      .then((res) => {
        const all = res.data?.data || [];
        // Keep any live entry that has a resolvable name — previously this
        // required `firstName`, which dropped astrologers that only have a
        // userName.
        setLiveListData(all.filter((l) => l.astrologer && getAstrologerDisplayName(l.astrologer)));
      })
      .catch(() => {});
  }, [props.liveListRefreshKey]);
  const setShowGifts = (val) => {
    _setShowGifts(val);
    if (props.giftPopupOpenRef) props.giftPopupOpenRef.current = val;
    scrollDisabledRef.current = val || showLiveList;
  };
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [showWaitingToast, setShowWaitingToast] = useState(false);
  const [pendingCallType, setPendingCallType] = useState("audio");
  const [roomEnded, setRoomEnded] = useState(false);
  const [wasRoomReady, setWasRoomReady] = useState(false);
  const [connectingTimedOut, setConnectingTimedOut] = useState(false);

  const [isCallExpanded, setIsCallExpanded] = useState(false);
  const liveListCtx = useLiveList();
  const [showKundliModal, setShowKundliModal] = useState(false);
  const [isRemedyPanelOpen, setIsRemedyPanelOpen] = useState(false);
  const [showRechargeButton, setShowRechargeButton] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  // Insufficient balance popup (shown when preSessionBalanceCheck returns status:false)
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState(null);
  // Low-balance details for the active-call recharge popup
  const [lowBalanceInfo, setLowBalanceInfo] = useState(null);
  const dispatch = useDispatch();
  const suggestedRemedyData = useSelector((s) => s.remedy);
  const hasNewRemedy = suggestedRemedyData.hasNewRemedy;

  // Private call state — comes from useLiveChat via props spread
  // Also listen via window event as backup since props chain can be unreliable
  const [localPrivateCall, setLocalPrivateCall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Only update if the event is for the current astrologer or no hostId specified
      const eventHostId = e.detail?.hostId;
      const currentAstroId = astrologer?._id || astrologer?.astrologerId;
      if (eventHostId && currentAstroId && eventHostId !== currentAstroId) return;
      setLocalPrivateCall(e.detail?.isOnPrivateCall ?? false);
    };
    window.addEventListener("live:private_call_status", handler);
    return () => window.removeEventListener("live:private_call_status", handler);
  }, [astrologer]);

  // Reset when channel changes — initialize from API data
  useEffect(() => {
    setLocalPrivateCall(!!props.astrologer?.isOnPrivateCall);
  }, [props.channel]);

  // Reset ended state when switching to a new channel
  // Use a counter to invalidate stale roomReady changes from old channels
  const [channelGeneration, setChannelGeneration] = useState(0);
  const channelGenRef = useRef(0);

  useEffect(() => {
    if (!props.channel) return;
    setRoomEnded(false);
    setWasRoomReady(false);
    setConnectingTimedOut(false);
    const gen = channelGenRef.current + 1;
    channelGenRef.current = gen;
    setChannelGeneration(gen);
  }, [props.channel]);

  /*
    If no remote users appear, switch the copy from "connecting" to "waiting" —
    and, more importantly, reveal the waiting screen's action buttons, which are
    gated on this flag further down.

    Was 10s. That is the entire lifetime of some sessions arriving on this ad
    landing page: one Clarity session loaded at 00:06, tapped once at 00:14 with
    nothing on screen but the 32px back chevron, and left at 00:15 — the actions
    were still 6s away. Until this flips, the waiting screen has exactly one
    interactive element, because the top bar, chat and action rail are all gated
    behind `isAstrologerLive`.

    5s still avoids the flash-up the gate exists to prevent (a successful join
    lands in 1–3s, and the flag is cleared the moment a remote user appears).

    Deliberately NOT the same as LOADING_ESCAPE_MS in LivePlayerPage, which is
    now 2.5s. That one covers a *download* — the live-list request and the Agora
    chunk — where there is no lower bound worth protecting, so it can afford to
    be impatient. This one covers the Agora join itself, which normally completes
    in 1–3s, so dropping it to 2.5s would flash the waiting actions up during a
    perfectly healthy connect. The two waits are sequential, so the visitor sees
    an escape route by 2.5s regardless; this timeout only governs the second leg.
  */
  useEffect(() => {
    if (remoteUsers?.length > 0 || hostLeft || roomEnded) {
      setConnectingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setConnectingTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [remoteUsers?.length, hostLeft, roomEnded, props.channel]);

  const { 
    activeCall, 
    lastRequestedAstro,
    setLastRequestedAstro, 
    setActiveCall, 
    setCallSeconds,
    callSeconds,
    resetCallFlow, 
    setActiveCallRoomId,
    setLastSelectedKundli,
    setLastCallType,
    isCallMinimized,
    setIsCallMinimized,
    pendingLiveCall,
    setPendingLiveCall,
    isMicOn,
    setIsMicOn,
    isSpeakerOn,
    setIsSpeakerOn,
    setOpenReview,
    setReviewData,
    setWaitingList,
  } = useCall();

  const { pendingConnections, addPendingConnection, assignRoomId, removePendingConnection, removePendingByAstrologer, cancelAllExcept, cancelPendingConnection, isInQueue, isCancelling, getConnectionByRoomId } = useWaitingQueue();

  // Auto-minimize call if user is on live stream (handles page refresh)
  useEffect(() => {
    if (activeCall) {
      setIsCallMinimized(true);
    }
  }, [activeCall, setIsCallMinimized]);
  
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = localStorage.getItem("shubhtalk_customer_token");

  // Ensure voiceSocket is connected for call features
  useEffect(() => {
    if (!userIdLocal || !token) return;
    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
      voiceSocket.connect();
    }
  }, [userIdLocal, token]);

  const [callRoomId, setCallRoomId] = useState(null);
  const [callWaitingList, setCallWaitingList] = useState(null);
  const astrologerRef = useRef(null);
  const scrollDisabledRef = useRef(false);
  const callingChannelRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const getStoredPendingLiveCall = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_LIVE_CALL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const persistPendingLiveCall = useCallback((pendingData) => {
    setPendingLiveCall(pendingData);
    try {
      sessionStorage.setItem(
        PENDING_LIVE_CALL_STORAGE_KEY,
        JSON.stringify(pendingData)
      );
    } catch {
      // Ignore storage failures; context state still preserves the request.
    }
  }, [setPendingLiveCall]);

  const clearPendingLiveCallState = useCallback(() => {
    setPendingLiveCall(null);
    try {
      sessionStorage.removeItem(PENDING_LIVE_CALL_STORAGE_KEY);
    } catch {
      // Ignore storage failures; context state is the primary source.
    }
  }, [setPendingLiveCall]);

  const resolvePendingLiveCall = useCallback(() => {
    return pendingLiveCall || getStoredPendingLiveCall();
  }, [pendingLiveCall, getStoredPendingLiveCall]);

  const restorePendingCallState = useCallback((pendingData) => {
    if (!pendingData) return;

    astrologerRef.current = pendingData.astrologer || null;
    callingChannelRef.current = pendingData.liveChannel || props.channel || null;
    setCallRoomId(pendingData.callRoomId || null);
    setPendingCallType(pendingData.pendingCallType || "audio");
    setShowWaitingModal(true);
    setShowWaitingToast(true);
  }, [props.channel]);
  
  const [createChatRoom] = useCreateChatRoomMutation();
  const [getBalance] = useGetBalanceMutation();
  const { checkPermission } = useMediaPermission();
  const { balance: walletBalance, refreshWallet } = useWalletBalance();

  // Follow/unfollow astrologer
  const astrologerId = astrologer?._id || astrologer?.astrologerId;

  // Check if the active call belongs to the current live stream astrologer
  const isCallForCurrentAstrologer = activeCall && isCallMinimized && activeCall.astrologerId === astrologerId;

  // Fetch full astrologer details (profile pic, call rates)
  const { data: astrologerFullData } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId }
  );
  const fullAstro = astrologerFullData?.data;

  // Astrologer-shaped object for getAstrologerImageUrl, shared by the host
  // avatar and the end-of-call review payload.
  //
  // `fullAstro` is the only guaranteed source of the pre-resized `profileImages`
  // map. The live-list `astrologer` object may carry it too depending on the
  // endpoint's projection, so it is read as well and covers the window before
  // the query resolves. profileImgUrl/imageUrl keep the precedence the avatar
  // used before, so nothing regresses when derivatives are absent.
  const hostImageSource = {
    profileImages: fullAstro?.profileImages || astrologer?.profileImages,
    profileImgUrl: fullAstro?.profileImgUrl || astrologer?.profileImgUrl,
    imageUrl: astrologer?.imageUrl,
    gender: fullAstro?.gender || astrologer?.gender,
  };

  const { data: followingData } = useCheckFollowingStatusQuery(
    { astrologerId },
    { skip: !astrologerId || props.isGuest }
  );
  const isFollowing = followingData?.data?.isFollowing || false;
  const [followAstrologer, { isLoading: followLoading }] = useFollowAstrologerByIdMutation();
  const [unfollowAstrologer, { isLoading: unfollowLoading }] = useUnfollowAstrologerByIdMutation();

  useEffect(() => {
    const pending = resolvePendingLiveCall();
    if (!pending) return;

    console.log("LiveView restore effect — pending:", pending);
    restorePendingCallState(pending);
  }, [resolvePendingLiveCall, restorePendingCallState]);

  // Auto-dismiss the old waiting toast after 3 seconds
  useEffect(() => {
    if (!showWaitingToast) return;
    const timer = setTimeout(() => setShowWaitingToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showWaitingToast]);

  const handleFollow = async () => {
    // The old guard was a bare `if (!astrologerId) return;`. That path is not
    // hypothetical: when LivePlayerPage is opened on a channel it has no live
    // entry for, it injects a placeholder `[{ channel: channelId }]` with no
    // astrologer attached, so `astrologerId` is undefined for the whole
    // session — the Follow button rendered, looked normal, and did nothing on
    // every tap. Name the blocker instead of returning silently, matching the
    // copy the call/chat guards further down already use.
    if (!astrologerId) {
      Toast.error("Astrologer information not available");
      return;
    }
    // The button is `aria-disabled` rather than `disabled` while a request is
    // in flight (a `disabled` button fires no click at all, so the tap is
    // swallowed and Clarity records it as dead). Re-entry is therefore blocked
    // here instead of by the DOM.
    if (followLoading || unfollowLoading) return;
    try {
      if (!isFollowing) {
        await followAstrologer({ astrologerId }).unwrap();
        Toast.success(`You are now following ${getAstrologerDisplayName(fullAstro) || astrologer?.astrologerName || "this astrologer"}`);

        // Emit follow message to live stream chat
        if (props.socketRef?.current?.connected && props.channel && userIdLocal) {
          const userData = JSON.parse(localStorage.getItem("shubhtalk_user") || "{}");
          const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";

          const followMessage = JSON.stringify({
            text: `${userName} started following`,
          });

          props.socketRef.current.emit("live:send_message", {
            roomId: props.channel,
            userId: userIdLocal,
            userName,
            message: followMessage,
            userType: "audience",
            type: "follow",
          });
        }
      } else {
        await unfollowAstrologer({ astrologerId }).unwrap();
        Toast.success(`Unfollowed ${getAstrologerDisplayName(fullAstro) || astrologer?.astrologerName || "this astrologer"}`);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      // "Something went wrong" told the visitor nothing about what to do next.
      // A 401 here is common in this flow: the live page is often reached from
      // an ad with a long dwell time, so the token can expire mid-session while
      // the Follow button still renders as if it will work.
      const status = err?.status || err?.originalStatus;
      if (status === 401) {
        Toast.error("Your session expired. Please log in again to follow.");
        navigate(PATH.publicRoutes.LOGIN.path);
        return;
      }
      Toast.error(
        err?.data?.message ||
          (isFollowing ? "Could not unfollow. Please try again." : "Could not follow. Please try again.")
      );
    }
  };

  // Fetch user's kundli profiles for validation
  const { data: kundliData } = useGetAllKundlisQuery(undefined, {
    skip: !token || !userIdLocal,
  });
  const profiles = kundliData?.data || [];

  // Normalize socket messages (message → text, userType → role, userName → sender)
  const normalizedMessages = messages
    ?.map((m) => {
      // Handle gift messages
      if (m.type === "gift") {
        let giftData = null;
        let giftText = "";
        const senderName = m.sender || m.userName || "Someone";
        
        // Parse gift data from message
        if (typeof m.message === "string") {
          try {
            const parsed = JSON.parse(m.message);
            giftText = parsed.text || "";
            giftData = parsed.giftData;
          } catch {
            giftText = m.message;
          }
        } else if (typeof m.message === "object") {
          giftData = m.message?.giftData || m.message;
          giftText = m.message?.text || "";
        }

        return {
          ...m,
          text: giftText || `${senderName} sent a gift`,
          role: m.role || m.userType,
          sender: senderName,
          isGift: true,
          giftData: giftData,
        };
      }
      // Handle follow messages
      if (m.type === "follow") {
        let followText;
        try {
          const parsed = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
          followText = parsed?.text;
        } catch { /* ignore */ }
        const senderName = m.sender || m.userName || "Someone";
        return {
          ...m,
          text: followText || `${senderName} started following`,
          role: m.role || m.userType,
          sender: senderName,
          isFollow: true,
        };
      }
      // Handle system messages (join/leave)
      if (m.type === "system") {
        return {
          ...m,
          role: "system",
          sender: null,
          isSystem: true,
        };
      }
      return {
        ...m,
        text: m.text || (typeof m.message === "string" ? m.message : m.message?.text || ""),
        role: m.role || m.userType,
        sender: m.sender || m.userName,
      };
    }) || [];
  const displayMessages = normalizedMessages;

  const reelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useReelScroll({
    enabled: !!liveListCtx && ROLE !== "host" && !activeCall,
    containerRef: reelRef,
    onNext: liveListCtx?.goNextLive,
    onPrev: liveListCtx?.goPrevLive,
    disabledRef: scrollDisabledRef,
  });

  console.log("liveListCtx", JSON.stringify(liveListCtx));

  const hostData = {
    name: "Anaisha",
    image: "/host-profile.jpg",
    rate: 32,
  };

  const { data: giftList } = useGetAllGiftsQuery();

  useEffect(() => {
    if (!hostLeft || ROLE === "host") return;

    // Close popups when astrologer ends the live
    setShowGifts(false);
    setShowCallPopup(false);
  }, [hostLeft, ROLE]);

  // Track when socket room ends / starts
  // Use channelGeneration to ignore stale roomReady=false from old channels
  // that arrive after we've already switched to a new channel.
  const roomReadyGenRef = useRef(0);

  useEffect(() => {
    if (roomReady === true) {
      roomReadyGenRef.current = channelGeneration;
      setWasRoomReady(true);
      setRoomEnded(false);
    } else if (roomReady === false && wasRoomReady && ROLE !== "host") {
      // Only mark as ended if this roomReady=false belongs to the current channel
      if (roomReadyGenRef.current === channelGeneration) {
        setRoomEnded(true);
        setShowGifts(false);
        setShowCallPopup(false);
      }
    }
  }, [roomReady, ROLE, wasRoomReady, channelGeneration]);

  // Track previous message count
  useEffect(() => {
    prevMessageCountRef.current = displayMessages.length;
  }, [displayMessages.length]);

  const messagesOverlayRef = useRef(null);
  const prevScrollLenRef = useRef(0);

  // Pin the comments list to the bottom whenever it (re)mounts — e.g. joining a
  // call re-renders/remounts the chat panel, which would otherwise reset the
  // scroll position to the top. Landing at the bottom keeps the newest comments
  // in view instead.
  const setMessagesOverlayRef = useCallback((node) => {
    messagesOverlayRef.current = node;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  // Keep pinned to the newest messages on fresh load (list was empty) or when
  // the user is already at the bottom. Don't yank them if they've scrolled up.
  useEffect(() => {
    const container = messagesOverlayRef.current;
    if (!container) {
      prevScrollLenRef.current = displayMessages.length;
      return;
    }
    const wasEmpty = prevScrollLenRef.current === 0;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    if (wasEmpty || isAtBottom) {
      container.scrollTop = container.scrollHeight;
    }
    prevScrollLenRef.current = displayMessages.length;
  }, [displayMessages.length]);

  const isHost = ROLE === "host";

  // Host display name — userName-first. `fullAstro` (fetched by id) carries
  // `userName`; the live-list entry and socket payloads only have the real
  // first + last name, so they're just fallbacks.
  const hostDisplayName =
    getAstrologerDisplayName(fullAstro) || astrologer?.astrologerName || "Astrologer";

  // Same value but without the "Astrologer" placeholder — used when seeding the
  // `userName` field of objects we hand to the waiting-queue / waitlist popups.
  const resolvedHostUserName =
    getAstrologerDisplayName(fullAstro) ||
    astrologer?.userName ||
    astrologer?.astrologerName ||
    astrologer?.hostName ||
    "";

  // Report it up so the parent can use the username in the "has left" modal
  // (that modal's socket payload only provides the real name).
  const onHostNameResolved = props.onHostNameResolved;
  useEffect(() => {
    if (hostDisplayName && hostDisplayName !== "Astrologer") {
      onHostNameResolved?.(hostDisplayName);
    }
  }, [hostDisplayName, onHostNameResolved]);

  // Same idea for the avatar. The "has left" modal's socket payload carries a
  // bare `profileImage` — the unresized original — and it has no access to
  // `fullAstro`, so it can't reach the `profileImages` derivatives itself.
  // Reporting the resolved URL up means the modal renders a sized variant with
  // no extra request, and it's already in the parent's ref before the host
  // leaves. That card is 60px, so `small`.
  const onHostAvatarResolved = props.onHostAvatarResolved;
  const resolvedHostAvatar = hostImageSource.profileImages
    ? getAstrologerImageUrl(hostImageSource, "small")
    : "";
  useEffect(() => {
    if (resolvedHostAvatar) onHostAvatarResolved?.(resolvedHostAvatar);
  }, [resolvedHostAvatar, onHostAvatarResolved]);

  const safeRemoteUsers = remoteUsers.filter((u) => u);
  // Connected to a live channel (joined Agora, room not ended / host not gone).
  // This is independent of whether a publisher (video) is present yet — matches
  // the iOS app, which shows the live UI on join and a placeholder when there's
  // no video.
  const isLiveConnected = !!props.channel && isConnected && !hostLeft && !roomEnded;
  // Whether we actually have a remote publisher to render video for.
  const shouldRenderStream = isLiveConnected && safeRemoteUsers.length > 0;
  // Show the full live UI (astrologer bar, chat, action bar) as soon as we are
  // connected to the live room, even if no video has arrived yet.
  const isAstrologerLive = isLiveConnected;
  const viewerCount = participantCount || (safeRemoteUsers?.length || 0) + 1;

  // Guests can watch the live stream but must sign up before chatting. Opened
  // when a guest tries to send a live-chat message.
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);

  const {
    messagesEndRef,
    showSharePopup,
    setShowSharePopup,
    shareUrl,
    inputRef,
    handleSend,
    handleCopyLink,
    shareToWhatsapp,
    shareToGmail,
  } = useLiveViewLogic({
    ...props,
    onGuestBlocked: () => {
      setShowGuestAuthModal(true);
      return true;
    },
  });

  const handleCloseLive = async () => {
    if (isHost) {
      setCalling(false);
    } else {
      // If waiting for a call response, save pending state to context
      // and navigate without disconnecting socket/Agora so the call isn't lost
      if (showWaitingModal && astrologerRef.current) {
        persistPendingLiveCall({
          astrologer: astrologerRef.current,
          liveChannel: callingChannelRef.current || props.channel,
          callRoomId,
          pendingCallType,
        });
        setShowWaitingModal(false);
        setShowWaitingPopup(false);
        setShowWaitingToast(false);
        // Tell useLiveStreaming to skip Agora/socket cleanup on unmount
        if (props.skipCleanupRef) props.skipCleanupRef.current = true;
        if (props.skipChatCleanupRef) props.skipChatCleanupRef.current = true;
      } else {
        clearViewerSession();
      }
      // Navigate back to where the user came from. Prefer real history back so
      // the live entry is popped off the stack. Using replace here would leave
      // the detail<->live pair in history, so pressing back on the detail page
      // would re-open the live stream after a few join/leave cycles.
      // Fall back to the referrer/home only when there's no in-app history
      // (e.g. the live stream was opened via a direct link or a new tab).
      const canGoBack = (window.history.state?.idx ?? 0) > 0;
      if (canGoBack) {
        navigate(-1);
      } else {
        const backPath = location.state?.from || "/";
        navigate(backPath, { replace: true });
      }
    }
  };

  /*
    Open the streamer's profile from the name/avatar bar.

    That bar was a plain <div>: an avatar, the host's name and the word "Live",
    with no handler on any of it. Tapping a streamer's avatar or name to see who
    they are is the one gesture every live product shares, so it gets tapped
    here too — and did nothing at all. Clarity reports the click as
    "<name>Live", which is this element's two text nodes concatenated.

    Cleanup mirrors the non-pending-call branch of handleCloseLive: drop the
    viewer session and navigate. The Agora/socket teardown then runs from
    useLiveStreaming's unmount cleanup, exactly as it does for the back button —
    skipCleanupRef is deliberately NOT set, because we are leaving the stream
    rather than backgrounding it for a call.

    An active call is the one case that must not navigate: it is a paid
    connection the visitor is in the middle of, and the call pill sits inside
    this same bar. Say so instead of dropping it.
  */
  /*
    Open the "Other Live Astrologers" sheet.

    Extracted from the grid button in the top bar so the waiting screen can offer
    the same thing. That whole top bar is gated behind `isAstrologerLive`, so
    while a viewer is stuck on "Connecting to live stream…" the grid button does
    not exist and there is no way to reach another stream — the nav arrows are
    positioned off-screen (see .live-nav-controls in live.scss) and the swipe
    reel is undiscoverable.
  */
  const handleOpenLiveList = async () => {
    try {
      const res = await getAstrologerLiveList();
      const all = res.data?.data || [];
      const valid = all.filter((l) => l.astrologer && getAstrologerDisplayName(l.astrologer));
      setLiveListData(valid);
      setShowLiveList(true);
      scrollDisabledRef.current = true;
      if (props.giftPopupOpenRef) props.giftPopupOpenRef.current = true;
    } catch (err) {
      console.error("Failed to fetch live list:", err);
      Toast.error("Couldn't load the other live sessions. Please try again.");
    }
  };

  // Leave the stream for the astrologer list. Mirrors handleViewHostProfile's
  // cleanup: drop the viewer session and navigate, letting useLiveStreaming's
  // unmount cleanup tear down Agora and the socket.
  const handleBrowseAstrologers = () => {
    clearViewerSession();
    navigate("/astrologers");
  };

  const handleViewHostProfile = () => {
    if (activeCall) {
      Toast.error(`You're on a call with ${hostDisplayName}. End it to view the profile.`);
      return;
    }

    const profilePath = getAstrologerProfilePath(
      fullAstro || astrologer,
      astrologerId
    );
    clearViewerSession();
    navigate(profilePath);
  };

  // Handle call initiation - uses real call flow (same as homepage astrologer listing)
  const handleDirectVoiceCall = async () => {
    // Check mic permission first
    const hasMic = await checkPermission("microphone");
    if (!hasMic) return;

    // 1. Check login
    if (!token || !userIdLocal) {
      Toast.error("Please login to continue");
      navigate(PATH.publicRoutes.LOGIN.path);
      return;
    }

    // 2. Check kundli profile exists
    if (!profiles || profiles.length === 0) {
      Toast.error("Please create your Kundli before starting a call.");
      navigate(PATH.privateRoutes.PROFILE.path, { state: { requiresCreation: true } });
      return;
    }

    // 3. Check not already on a call
    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    // 4. Check astrologer info available
    // Note: astrologer object from LiveListContext uses astrologerId, not _id
    const astrologerId = astrologer?._id || astrologer?.astrologerId;
    if (!astrologerId) {
      Toast.error("Astrologer information not available");
      return;
    }

    // Check if already in queue for this astrologer
    if (isInQueue(astrologerId, "audio")) {
      // A cancelled-but-not-yet-withdrawn entry still counts as in-queue, so say
      // which of the two it is rather than claiming they're still waiting.
      Toast.error(
        isCancelling(astrologerId, "audio")
          ? "Still cancelling your previous request. One moment."
          : "Already waiting for this astrologer"
      );
      return;
    }

    try {
      // 5. Check wallet balance only — astrologer is already live, no need to check availability
      const result = await getBalance({ astrologerId, type: "call" });

      if (result?.data?.data?.status === false) {
        const bal = result?.data?.data || {};
        setInsufficientBalanceInfo({
          sessionType: bal?.type || "audio",
          availableAmount: bal?.availableAmount,
          requiredAmount: bal?.requiredAmount,
          pricePerMinute: bal?.pricePerMinute,
        });
        return;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      Toast.error("Failed to check wallet balance");
      return;
    }

    // 6. Select kundli (self first, then first profile)
    const selfKundli = profiles.find(
      (p) => p.relation?.toLowerCase() === "self"
    );
    const selectedKundli = selfKundli || profiles[0];
    if (selectedKundli) {
      setLastSelectedKundli(selectedKundli);
    }

    // 7. Store astrologer info and emit call:initiate via socket
    // `profileImages` is forwarded so the call screens can use a sized variant
    // for their avatars — they read it off lastRequestedAstro and otherwise fall
    // back to the unresized original.
    setLastRequestedAstro({ ...astrologer, userName: resolvedHostUserName, profileImages: hostImageSource.profileImages, profileImgUrl: hostImageSource.profileImgUrl });
    setLastCallType("audio");
    setPendingCallType("audio");
    astrologerRef.current = astrologer;
    callingChannelRef.current = props.channel;
    localStorage.setItem("selectedAstroId", astrologerId);

    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId,
      type: "audio",
      isLive: true,
      liveRoomDetails: {
        roomId: props.channel,
        hostId: astrologerId,
        hostName: resolvedHostUserName,
        channel: props.channel,
      },
    });

    // Add to waiting queue
    addPendingConnection({
      id: `${astrologerId}-audio-${Date.now()}`,
      // Carry the resolved userName-first name through so the waiting-queue /
      // waitlist popups show the username. `hostDisplayName` comes from the
      // full astrologer record (which has userName); the live-list entry only
      // has the real first + last name.
      astrologer: {
        ...astrologer,
        _id: astrologerId,
        userName: resolvedHostUserName,
        firstName: astrologer?.firstName || astrologer?.astrologerName || astrologer?.hostName || "",
      },
      type: "audio",
      roomId: null,
      waitingTime: 5,
      isEmergency: false,
      fromLive: true,
      liveChannelId: props.channel,
    });

    setShowWaitingModal(true);
    setShowWaitingToast(true);
    setWaitingList(5);
    Toast.success("Voice call request sent");
  };

  // Handle call initiation from popup (with choice)
  const handleCallRequest = async (type) => {
    // Check permissions based on call type
    const permType = type === "video" ? "both" : "microphone";
    const hasPermission = await checkPermission(permType);
    if (!hasPermission) return;

    if (!token) {
      Toast.error("Please login to make a call");
      navigate("/login");
      return;
    }

    if (!userIdLocal) {
      Toast.error("User not found");
      return;
    }

    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    // Note: astrologer object from LiveListContext uses astrologerId, not _id
    const astrologerId = astrologer?._id || astrologer?.astrologerId;
    if (!astrologerId) {
      Toast.error("Astrologer information not available");
      return;
    }

    // Check if already in queue for this astrologer+type
    if (isInQueue(astrologerId, type)) {
      Toast.error(
        isCancelling(astrologerId, type)
          ? "Still cancelling your previous request. One moment."
          : "Already waiting for this astrologer"
      );
      return;
    }

    // Check wallet balance before initiating the call
    try {
      const result = await getBalance({ astrologerId, type });

      if (result?.data?.data?.status === false) {
        const bal = result?.data?.data || {};
        setInsufficientBalanceInfo({
          sessionType: bal?.type || type,
          availableAmount: bal?.availableAmount,
          requiredAmount: bal?.requiredAmount,
          pricePerMinute: bal?.pricePerMinute,
        });
        setShowCallPopup(false);
        return;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      Toast.error("Failed to check wallet balance");
      return;
    }

    // Store astrologer info in context and ref
    // See the audio path above — forwards profileImages for the call screens.
    setLastRequestedAstro({ ...astrologer, userName: resolvedHostUserName, profileImages: hostImageSource.profileImages, profileImgUrl: hostImageSource.profileImgUrl });
    setPendingCallType(type);
    astrologerRef.current = astrologer;
    callingChannelRef.current = props.channel;

    // Show waiting modal
    setShowWaitingModal(true);
    setShowWaitingToast(true);
    setWaitingList(5);

    // Emit socket event to initiate call
    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId,
      type, // "audio" | "video"
      isLive: true,
      liveRoomDetails: {
        roomId: props.channel,
        hostId: astrologerId,
        hostName: resolvedHostUserName,
        channel: props.channel,
      },
    });

    // Add to waiting queue
    addPendingConnection({
      id: `${astrologerId}-${type}-${Date.now()}`,
      // Carry the resolved userName-first name through (see the audio-call
      // handler above for why the live-list entry isn't enough).
      astrologer: {
        ...astrologer,
        _id: astrologerId,
        userName: resolvedHostUserName,
        firstName: astrologer?.firstName || astrologer?.astrologerName || astrologer?.hostName || "",
      },
      type,
      roomId: null,
      waitingTime: 5,
      isEmergency: false,
      fromLive: true,
      liveChannelId: props.channel,
    });

    setShowCallPopup(false);
    Toast.success(`${type === "audio" ? "Voice" : "Video"} call request sent`);
  };

  // Reset call state
  const resetCallState = () => {
    // Clear the timeout if it exists
    if (astrologerRef.current?.timeoutId) {
      clearTimeout(astrologerRef.current.timeoutId);
    }

    // Emit call:cancel to server
    if (callRoomId) {
      voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      removePendingConnection(callRoomId);
    }
    
    setShowWaitingModal(false);
    setShowWaitingPopup(false);
    setShowWaitingToast(false);
    setCallRoomId(null);
    astrologerRef.current = null;
    clearPendingLiveCallState();
    
    Toast.info("Call request cancelled");
  };

  // Format call seconds to mm:ss or hh:mm:ss
  const formatCallTime = (seconds) => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // End active call from minimized view
  const handleEndActiveCall = () => {
    if (activeCall?.roomId) {
      // Set review data before clearing activeCall
      setReviewData({
        astrologerID: activeCall?.astrologerID || activeCall?.astrologerId,
        fullName: activeCall?.callerName || "Astrologer",
        // FeedbackModal renders the avatar at 44px
        profileImage: getAstrologerImageUrl(
          {
            profileImages: hostImageSource.profileImages,
            profileImgUrl:
              hostImageSource.profileImgUrl ||
              activeCall?.profileImgUrl ||
              activeCall?.astrologerImage,
            gender: hostImageSource.gender,
          },
          "small"
        ),
        roomId: activeCall.roomId,
      });

      voiceSocket.emit("call:end", {
        roomId: activeCall.roomId,
        endedBy: "CUSTOMER",
      });

      setOpenReview(true);
    }
    setActiveCall(null);
    setIsCallMinimized(false);
    setIsCallExpanded(false);
    setCallSeconds(0);
    resetCallFlow();
    setIsRemedyPanelOpen(false);
    dispatch(clearAllRemedy());
    setShowRechargeButton(false);
  };

  const localMicOn = isMicOn;
  const localSpeakerOn = isSpeakerOn;

  const toggleMiniMic = () => {
    setIsMicOn((m) => !m);
  };
  const toggleMiniSpeaker = () => {
    setIsSpeakerOn((s) => !s);
  };

  // Handle kundli selection — send via voiceSocket (same as VoiceCall)
  const handleKundliSelect = (kundli) => {
    setShowKundliModal(false);
    if (!kundli?._id || !activeCall?.roomId) return;
    // Send the bare kundliId as the message (origin-independent); the kundliId
    // also travels as its own field. Renderers rebuild the link from origin.
    voiceSocket.emit("chat:message", {
      sender: "user",
      kundliId: kundli._id,
      roomId: activeCall.roomId,
      userId: activeCall.userId || userIdLocal,
      astrologerId: activeCall.astrologerId,
      message: kundli._id,
      type: "kundli",
    });
    Toast.success("Kundali sent successfully.", { position: "top-center" });
  };

  // Listen for suggested remedy messages from astrologer during call
  useEffect(() => {
    if (!isCallForCurrentAstrologer) return;
    if (!isShubhMallEnabled()) return;
    const handleProductMessage = (data) => {
      if (data?.type === "products" && data?.suggestedProducts?.length > 0) {
        dispatch(addRemedy({
          suggestedProducts: data.suggestedProducts,
          message: data.message || null,
        }));
      }
    };
    voiceSocket.on("message:recieved", handleProductMessage);
    return () => voiceSocket.off("message:recieved", handleProductMessage);
  }, [isCallForCurrentAstrologer, dispatch]);

  // Listen for remedy panel open event from ChatContext notification
  useEffect(() => {
    if (!isCallForCurrentAstrologer) return;
    const handleOpenRemedy = () => {
      setIsRemedyPanelOpen(true);
      dispatch(clearNewRemedy());
    };
    window.addEventListener("live:open-remedy-panel", handleOpenRemedy);
    return () => window.removeEventListener("live:open-remedy-panel", handleOpenRemedy);
  }, [isCallForCurrentAstrologer]);

  // Listen for low balance warning from VoiceCall/VideoCall
  useEffect(() => {
    if (!isCallForCurrentAstrologer) return;
    const handleLowBalance = (e) => {
      setShowRechargeButton(true);
      refreshWallet();

      const detail = e?.detail || {};
      const callType = activeCall?.type || pendingCallType || "audio";

      // Per-minute rate from astrologer data (preSessionBalanceCheck errors
      // mid-call, so derive locally instead of calling it again).
      const audioRate =
        astrologer?.audioCallRate ?? fullAstro?.price?.audioRate?.amount;
      const videoRate =
        astrologer?.videoCallRate ?? fullAstro?.price?.videoCallRate?.amount;
      const rateRaw =
        detail.pricePerMinute ??
        detail.ratePerMinute ??
        (callType === "video" ? videoRate : audioRate);
      const ratePerMin = Number(rateRaw) || 0;

      // Minimum balance required to (re)start a session = 5 minutes of talk time.
      const MIN_SESSION_MINUTES = 5;
      const available =
        detail.availableAmount ?? detail.walletBalance ?? walletBalance;
      const required =
        detail.requiredAmount ??
        (ratePerMin > 0 ? ratePerMin * MIN_SESSION_MINUTES : undefined);

      setLowBalanceInfo({
        availableAmount: available,
        requiredAmount: required,
        pricePerMinute: ratePerMin,
      });
    };
    window.addEventListener("call:low-balance", handleLowBalance);
    return () => window.removeEventListener("call:low-balance", handleLowBalance);
  }, [
    isCallForCurrentAstrologer,
    activeCall,
    pendingCallType,
    astrologer,
    fullAstro,
    walletBalance,
    refreshWallet,
  ]);

  // Socket event handlers
  useEffect(() => {
    if (!userIdLocal) return;

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setShowWaitingModal(true);
      setShowWaitingToast(true);
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({ roomId, token: agoraToken, channelName, type, remainingTime, isSwitch }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        setShowWaitingModal(false);
        resetCallFlow();
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        setShowWaitingModal(false);
        resetCallFlow();
        return;
      }
      
      // Regular call acceptance
      setShowWaitingModal(false);
      setShowWaitingPopup(false);
      setShowWaitingToast(false);
      resetCallFlow();

      // Get connection data before removing (has correct astrologer info)
      const connData = getConnectionByRoomId(roomId);
      removePendingConnection(roomId);

      const pending = resolvePendingLiveCall();
      const astro =
        connData?.astrologer ||
        astrologerRef.current ||
        pending?.astrologer ||
        lastRequestedAstro ||
        astrologer;
      const astroId = astro?._id || astro?.astrologerId;
      const liveChannel =
        props.channel;
      
      if (!astro || !astroId) {
        Toast.error("Astrologer information not available");
        return;
      }

      try {
        // Create chat room for the call
        const res = await createChatRoom({
          userId: userIdLocal,
          astrologerId: astroId,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error("Failed to create chat room");

        // Set active call in context - this will trigger VideoCall or VoiceCall component
        // Auto-minimize since user is on live stream
        setActiveCall({
          roomId,
          channelName,
          chatRoomId,
          agoraToken,
          // userName-first (fullAstro carries userName; the live-list entry only
          // has the real first + last name).
          callerName: resolvedHostUserName || getAstrologerDisplayName(astro) || astro.astrologerName || "Astrologer",
          isUserSide: true,
          callType: type, // "audio" or "video"
          userId: userIdLocal,
          astrologerId: astroId,
          astrologerID: fullAstro?.astrologer_ID || astro?.astrologer_ID || astroId,
          remainingTime,
          experience: fullAstro?.experience || astro?.experience,
          // Carry the avatar + gender through — the post-call review popup reads
          // these off activeCall, and without them it fell back to a generic
          // placeholder image.
          profileImgUrl:
            fullAstro?.profileImgUrl || astro?.profileImgUrl || astro?.imageUrl,
          gender: fullAstro?.gender || astro?.gender,
          origin: "live",
          liveChannel,
        });
        setIsCallMinimized(true);
        clearPendingLiveCallState();
        
        setCallSeconds(Number(remainingTime) * 60);
        Toast.success(`${type === "video" ? "Video" : "Voice"} call started`);
      } catch (error) {
        console.error("Call acceptance error:", error);
        Toast.error("Failed to start call");
      }
    };

    const handleCallRejected = (data) => {
      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        return;
      }
      
      // Extract roomId and astrologerId — can be at top level or inside sessionData
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }

      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected"
          ? "Astrologer has rejected the call request"
          : "Call rejected";
      Toast.error(errorMsg);
      clearPendingLiveCallState();
      setShowWaitingModal(false);
      setShowWaitingPopup(false);
      setShowWaitingToast(false);
      setCallRoomId(null);
    };

    const handleCallEnded = () => {
      setShowWaitingModal(false);
      setShowWaitingPopup(false);
      setShowWaitingToast(false);
      setCallRoomId(null);
      clearPendingLiveCallState();
      setIsRemedyPanelOpen(false);
      dispatch(clearAllRemedy());
      setShowRechargeButton(false);
    };

    const handleCallCanceled = (data) => {
      console.log("[LiveView] 📞 call:canceled received", data);
      // Toast.info(data?.message || "Call was cancelled by the astrologer");
      setShowWaitingModal(false);
      setShowWaitingPopup(false);
      setShowWaitingToast(false);
      setCallRoomId(null);
      clearPendingLiveCallState();
      resetCallFlow();
    };

    const handleWarning = (msg) => {
      if (msg?.message?.includes("Low balance alert")) {
        // Forward to the low-balance effect (which has fresh deps and fetches
        // accurate balance details) instead of toggling state from this
        // stale-closure socket handler.
        window.dispatchEvent(
          new CustomEvent("call:low-balance", { detail: msg || {} })
        );
      }
      Toast.warning(msg.message);
    };

    const handleAstrologerPrivateCall = (data) => {
      // Only update private call state if the event is for the current astrologer
      const currentAstroId = astrologer?._id || astrologer?.astrologerId;
      const eventHostId = data?.hostId;
      if (eventHostId && currentAstroId && eventHostId !== currentAstroId) {
        console.log("[LiveView] 📞 Ignoring private call event for different astrologer:", eventHostId);
        return;
      }
      if (data?.status === "on_private_call") {
        console.log("[LiveView] 📞 Astrologer on private call");
        setLocalPrivateCall(true);
      } else if (data?.status === "private_call_ended") {
        console.log("[LiveView] 📞 Astrologer private call ended");
        setLocalPrivateCall(false);
      }
    };

    // When astrologer accepts, show waitlist popup (no scroll).
    // Only react in the tab that initiated the request — the event is broadcast
    // to every open tab, so non-initiating tabs must ignore it.
    const handleAstrologerAcceptedScroll = (data) => {
      const acceptedAstroId = data?.astrologerId;
      if (!acceptedAstroId) return;
      if (!ownsRoom(data?.roomId)) return;
      setShowWaitingPopup(true);
    };

    // Register socket listeners
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:ended", handleCallEnded);
    voiceSocket.on("call:canceled", handleCallCanceled);
    voiceSocket.on("warning", handleWarning);
    voiceSocket.on("live:astrologer_status", handleAstrologerPrivateCall);
    voiceSocket.on("call:astrologer_accepted", handleAstrologerAcceptedScroll);
    voiceSocket.on("chat:astrologer_accepted", handleAstrologerAcceptedScroll);

    // When user accepts from StickyWaitingQueue — no scroll needed, stay on current stream
    const handleWaitlistAccepted = () => {};
    window.addEventListener("waitlist:accepted", handleWaitlistAccepted);

    return () => {
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("call:ended", handleCallEnded);
      voiceSocket.off("call:canceled", handleCallCanceled);
      voiceSocket.off("warning", handleWarning);
      voiceSocket.off("live:astrologer_status", handleAstrologerPrivateCall);
      voiceSocket.off("call:astrologer_accepted", handleAstrologerAcceptedScroll);
      voiceSocket.off("chat:astrologer_accepted", handleAstrologerAcceptedScroll);
      voiceSocket.off("warning", handleWarning);
      window.removeEventListener("waitlist:accepted", handleWaitlistAccepted);
    };
  }, [
    userIdLocal,
    setActiveCall,
    setCallSeconds,
    resetCallFlow,
    setActiveCallRoomId,
    createChatRoom,
    clearPendingLiveCallState,
    lastRequestedAstro,
    liveListCtx,
    props.channel,
    resolvePendingLiveCall,
    astrologer,
  ]);

  // Hide LiveView when there's an active call that is NOT minimized
  // Show LiveView when call is minimized so user can watch live stream
  if (activeCall && !isCallMinimized) {
    return null;
  }

  console.log("🔍 LiveView render state:", {
    isHost,
    remoteUsersCount: remoteUsers?.length,
    hostLeft,
    roomEnded,
    roomReady,
    wasRoomReady,
    channel: props.channel,
    isOnPrivateCall,
  });

  const shouldShowWaitingIndicator = !isHost && pendingConnections.some((c) => c.astrologer?._id === astrologerId);

  if (isClosing) return null;

  return (
    <FixedLayer>
      <div className={`video-box${(!isHost && shouldRenderStream && safeRemoteUsers.length > 0 && !safeRemoteUsers.some((u) => u.hasVideo)) || (!isHost && !shouldRenderStream) ? ' camera-off' : ''}`}>
        <div className="reel-scroll-root" ref={reelRef}>

          {/* Back button when astrologer is not live */}
          {!isAstrologerLive && (
            <div className="live-header">
              <button className="live-back-button" onClick={handleCloseLive}>
                <ChevronLeft size={24} />
              </button>
            </div>
          )}

          {/* Astrologer Info Bar - only show when astrologer is live */}
          {isAstrologerLive && (<>
          <div className="top-bar">
            <div className="top-bar-left">
              <button className="live-back-button" onClick={handleCloseLive}>
                <ChevronLeft size={24} />
              </button>
              <div className="host-info">
              {/* .host-avatar-img is 30px (40px on wider screens), so the
                  `small` 100x125 derivative rather than `profileImgUrl`, which
                  points at the unresized original. `fullAstro` comes from
                  useGetAstrologerByIdQuery above, so the derivatives are
                  available here; the live-list `astrologer` is kept as the
                  pre-fetch fallback and preserves the previous precedence. */}
              {/*
                A real <button>, so the avatar and name open the astrologer's
                profile. Only the avatar and the text are wrapped — the
                minimized call pill below stays a sibling, because it is itself
                interactive and nesting it inside a button would be invalid.
              */}
              <button
                type="button"
                className="host-identity"
                onClick={handleViewHostProfile}
                aria-label={`View ${hostDisplayName}'s profile`}
              >
                <img
                  className="host-avatar-img"
                  src={getAstrologerImageUrl(hostImageSource, "small")}
                  alt=""
                  width={30}
                  height={30}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getAstrologerDefaultImage(hostImageSource.gender);
                  }}
                />
                <div className="host-text">
                  <div className="host-name host-name-truncate">
                    {hostDisplayName}
                  </div>
                  <div className="host-duration">
                    {isCallForCurrentAstrologer
                      ? `Private Call ${formatCallTime(callSeconds)}`
                      : `Live`
                    }
                  </div>
                </div>
              </button>
              {/* Minimized call pill - right after name */}
              {/* Minimized call pill - right after name */}
              {isCallForCurrentAstrologer && !isCallExpanded && (
                <div className="live-call-pill-inline" onClick={() => setIsCallExpanded(true)}>
                  <div className="live-call-pill-row">
                    <span className="live-call-pill-avatar">
                      {(activeCall.callerName || "A").split(" ").map(w => w.charAt(0).toUpperCase()).join("").slice(0, 2)}
                    </span>
                    <div className="mini-call-wave">
                      <span className="mini-call-wave-bar"></span>
                      <span className="mini-call-wave-bar"></span>
                      <span className="mini-call-wave-bar"></span>
                      <span className="mini-call-wave-bar"></span>
                    </div>
                    <button
                      className="live-call-pill-end"
                      onClick={(e) => { e.stopPropagation(); handleEndActiveCall(); }}
                      aria-label="End call"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85a.993.993 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Private call indicator - between name and follow */}
            {!isHost && localPrivateCall && !activeCall && (
              <div className="private-call-center">
                <span className="private-call-text">Private Call</span>
              </div>
            )}

            {/* Follow button - right side of top bar */}
            {!isHost && (
              <div className="top-bar-right">
                {/* The Follow button carries `aria-disabled` rather than
                  * `disabled` while the request is in flight: a disabled button
                  * dispatches no click event, so the tap is swallowed by the DOM
                  * and shows up in Clarity as a dead click. Re-entry is guarded
                  * inside handleFollow instead. */}
                {!props.isGuest && (
                <button
                  className={`follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollow}
                  aria-disabled={followLoading || unfollowLoading}
                  aria-busy={followLoading || unfollowLoading}
                >
                  {followLoading || unfollowLoading
                    ? "..."
                    : isFollowing
                    ? "Following"
                    : "+ Follow"}
                </button>
                )}
                {/* {isHostMuted && !localPrivateCall && remoteUsers.length > 0 && !roomEnded && (
                  <div className="mute-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                )} */}
                {!localPrivateCall && (
                  <button className="live-grid-btn" onClick={handleOpenLiveList} aria-label="View all live astrologers">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="8" height="8" rx="2" />
                      <rect x="13" y="3" width="8" height="8" rx="2" />
                      <rect x="3" y="13" width="8" height="8" rx="2" />
                      <rect x="13" y="13" width="8" height="8" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Private call banner */}
          {/* Moved to top bar */}

          {/* Expanded call card - below top bar */}
          {isCallForCurrentAstrologer && isCallExpanded && (
              <div className="expanded-call-card">
                <button className="expanded-call-collapse" onClick={() => setIsCallExpanded(false)} aria-label="Collapse">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="expanded-call-info">
                  <span className="expanded-call-name">
                    {(activeCall.callerName || "Caller").length > 14
                      ? (activeCall.callerName || "Caller").slice(0, 14) + "..."
                      : (activeCall.callerName || "Caller")}
                  </span>
                  <span className="expanded-call-timer">{formatCallTime(callSeconds)}</span>
                </div>
                <div className="expanded-call-actions">
                  <button
                    className={`expanded-call-action-btn ${!localMicOn ? "off" : ""}`}
                    onClick={toggleMiniMic}
                    aria-label={localMicOn ? "Mute mic" : "Unmute mic"}
                  >
                    {localMicOn
                      ? <IoMic size={16} />
                      : <IoMicOff size={16} />}
                  </button>
                  <button
                    className={`expanded-call-action-btn ${!localSpeakerOn ? "off" : ""}`}
                    onClick={toggleMiniSpeaker}
                    aria-label={localSpeakerOn ? "Mute speaker" : "Unmute speaker"}
                  >
                    {localSpeakerOn
                      ? <HiSpeakerWave size={16} />
                      : <HiSpeakerXMark size={16} />}
                  </button>
                  <button
                    className="expanded-call-action-btn end"
                    onClick={handleEndActiveCall}
                    aria-label="End call"
                  >
                    <IoCallSharp size={16} style={{ transform: "rotate(135deg)" }} />
                  </button>
                </div>
              </div>
            )}
            {/* Low Balance Modal — visible during active call on low balance */}
            <InsufficientBalanceModal
              isOpen={isCallForCurrentAstrologer && showRechargeButton}
              onClose={() => {
                setShowRechargeButton(false);
                setLowBalanceInfo(null);
              }}
              onRecharge={() => {
                setShowRechargeButton(false);
                setIsRechargeModalOpen(true);
              }}
              sessionType={lowBalanceInfo?.sessionType}
              availableAmount={lowBalanceInfo?.availableAmount}
              requiredAmount={lowBalanceInfo?.requiredAmount}
              pricePerMinute={lowBalanceInfo?.pricePerMinute}
            />

            {/* <div className="live-status">
              <div className="live-badge">LIVE</div>
              <div className="viewer-pill">
                <span className="viewer-dot" />
                <span className="viewer-count">{viewerCount} watching</span>
                {liveListCtx && (
                  <span className="viewer-count">
                    | Live {liveListCtx.currentIndex + 1} /{" "}
                    {liveListCtx.lives.length}
                  </span>
                )}
              </div>
            </div> */}
          </>)}

          {/* LIVE INDEX INDICATOR */}
          {!isHost && liveListCtx && <div className="live-counter"></div>}

          {/* Video */}
          <div className={`reel-container ${!isHost ? 'audience-view' : ''}`}>
            {/* HOST VIDEO */}
            {isHost && isConnected && (
              <LocalUser
                audioTrack={localMicrophoneTrack}
                videoTrack={localCameraTrack}
                cameraOn={cameraOn}
                micOn={micOn}
              />
            )}

            {/* AUDIENCE VIDEO — safe render with connection guard */}
            {!isHost && shouldRenderStream &&
              safeRemoteUsers.map((user) => (
                <RemoteUser key={user.uid} user={user} />
              ))
            }

            {/* Camera off overlay — background only, no profile */}
            {!isHost && shouldRenderStream && safeRemoteUsers.length > 0 && !safeRemoteUsers.some((u) => u.hasVideo) && (
              <div className="camera-off-overlay">
                <img src={astrologerOfflineBg} alt="" className="camera-off-bg" />
              </div>
            )}

            {/* Connected to the live room but no publisher/video yet.
                Mirror the iOS app: stay inside the live experience and show a
                placeholder background instead of a blocking "waiting" screen. */}
            {!isHost && isLiveConnected && safeRemoteUsers.length === 0 && (
              <div className="camera-off-overlay">
                <img src={astrologerOfflineBg} alt="" className="camera-off-bg" />
              </div>
            )}

            {/* WAITING — not connected yet, or host left / room ended */}
            {!isHost && !isLiveConnected && (
              <div className="waiting-text">
                <img src={astrologerOfflineBg} alt="" className="waiting-bg-img" />
                <span className="waiting-text-label">
                {roomEnded
                  ? 'Waiting for astrologer to go live…'
                  : hostLeft
                    ? 'Waiting for astrologer to go live…'
                    : !props.channel || connectingTimedOut
                      ? 'Waiting for astrologer to start streaming…'
                      : 'Connecting to live stream…'}
                </span>

                {/*
                  Everything else on this screen is gated behind
                  `isAstrologerLive` — the top bar, the chat panel and the right
                  action rail all disappear while we are not connected. That left
                  a full-screen background image, one line of text and a 32px
                  back chevron in the corner as the entire UI. Clarity recorded a
                  paid mobile visitor landing here straight from a Google Ads
                  "live astrologer" click, tapping the screen at 00:28, tapping
                  again at 00:31, then backing out to the homepage and leaving —
                  a 39-second session. There was nothing else to tap: the
                  stream-switching arrows are positioned off the left edge of the
                  viewport, and the swipe reel is invisible.

                  Held back until we know this is more than a normal connect
                  (10s, or the host/room is already gone) so the buttons do not
                  flash up during a fast join.
                */}
                {(connectingTimedOut || roomEnded || hostLeft || !props.channel) && (
                  <div className="waiting-actions">
                    <button
                      type="button"
                      className="waiting-action-primary"
                      onClick={handleOpenLiveList}
                    >
                      See other live astrologers
                    </button>
                    <button
                      type="button"
                      className="waiting-action-secondary"
                      onClick={handleBrowseAstrologers}
                    >
                      Chat or call instead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HOST CONTROLS */}
          {isHost && isConnected && (
            <div className="control-panel">
              <button onClick={() => setMic((v) => !v)}>
                {micOn ? "🎙️ Mute" : "🎤 Unmute"}
              </button>
              <button onClick={() => setCamera((v) => !v)}>
                {cameraOn ? "📷 Hide" : "📸 Show"}
              </button>
            </div>
          )}

          {/* CHAT - only show when astrologer is live */}
          {isAstrologerLive && (
          <div className="chat-panel" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            {/* Inline Messages Overlay */}
            <div className="inline-messages-overlay" ref={setMessagesOverlayRef}>
              {displayMessages.map((m, index) => {
                /*
                  System messages (joins, etc).

                  The avatar circle used to read `m.text.split(" ")[0]` and show
                  its first letter — an initial derived from the *sentence*, not
                  from a person. "Guest xyz joined" therefore rendered a filled
                  26px circle labelled "G", indistinguishable from a real
                  participant's avatar in the same feed. Clarity recorded a dead
                  click labelled exactly "G" on a paid mobile visit to this page:
                  a tap on an avatar that represents nobody and opens nothing.

                  A glyph instead, so the row reads as an event rather than as a
                  person. There is no per-viewer profile in this product, so
                  there is nothing a tap here could ever open.
                */
                if (m.isSystem) {
                  return (
                    <div key={m.id || index} className="inline-message" style={{ opacity: 0.7 }}>
                      <span className="inline-initial inline-initial-glyph" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <path d="M18 8v6M15 11h6" />
                        </svg>
                      </span>
                      <div className="inline-message-body">
                        <span className="inline-text" style={{ fontStyle: "italic", fontSize: 12 }}>{m.text}</span>
                      </div>
                    </div>
                  );
                }
                // Gift messages — orange gradient style
                if (m.isGift) {
                  const gd = m.giftData;
                  return (
                    <div key={m.id || index} className="inline-message inline-gift-message">
                      {/* Same reasoning as the system row above: `m.sender || "G"`
                          fabricated a "G" for an unnamed gifter, which is a
                          letter belonging to no one. Show the gift itself. */}
                      <span
                        className={`inline-initial ${m.sender ? "" : "inline-initial-glyph"}`}
                        style={{ background: "linear-gradient(135deg, #f75801, #d43400)" }}
                        aria-hidden={m.sender ? undefined : "true"}
                      >
                        {m.sender ? (
                          m.sender.charAt(0).toUpperCase()
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                          </svg>
                        )}
                      </span>
                      <div className="gift-card-bubble">
                        {gd?.giftImg && <img src={gd.giftImg} alt={gd?.giftName} className="gift-card-img" />}
                        <div className="gift-card-info">
                          <span className="gift-card-sender">{m.sender}</span>
                          <span className="gift-card-label">sent {gd?.giftName || "a gift"}</span>
                        </div>
                        {gd?.price && <span className="gift-card-price">₹{gd.price}</span>}
                      </div>
                    </div>
                  );
                }
                // Follow messages — same style as join (green arrow)
                if (m.isFollow) {
                  return (
                    <div key={m.id || index} className="inline-message" style={{ opacity: 0.6 }}>
                      {/* "U" was a fabricated initial too — see the system row. */}
                      <span
                        className={`inline-initial ${m.sender ? "" : "inline-initial-glyph"}`}
                        style={{ background: "#22c55e" }}
                        aria-hidden={m.sender ? undefined : "true"}
                      >
                        {m.sender ? (
                          m.sender.charAt(0).toUpperCase()
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        )}
                      </span>
                      <div className="inline-message-body">
                        <span className="inline-text" style={{ fontStyle: "italic", fontSize: 11 }}>{m.text}</span>
                      </div>
                    </div>
                  );
                }
                // Regular messages
                const isHostMessage = m.role === "host";
                return (
                  <div key={m.id || index} className={`inline-message ${isHostMessage ? "inline-host-message" : ""}`}>
                    {/*
                      The astrologer's own avatar in chat is the one initial here
                      with somewhere to go, so it opens their profile — the same
                      action as the name/avatar bar at the top of the stream.
                      Viewer avatars stay inert: this product has no viewer
                      profile, so there is nothing to open.
                    */}
                    {isHostMessage ? (
                      <button
                        type="button"
                        className="inline-initial inline-initial-btn"
                        onClick={handleViewHostProfile}
                        aria-label={`View ${m.sender || hostDisplayName || "astrologer"}'s profile`}
                      >
                        {(m.sender || hostDisplayName || "A").charAt(0).toUpperCase()}
                      </button>
                    ) : (
                      <span className="inline-initial">
                        {(m.sender || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="inline-message-body">
                      {m.sender && (
                        <span className="inline-sender">{m.sender}</span>
                      )}
                      <span className="inline-text">{m.text}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-row">
              <div className="input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask a question..."
                  aria-label="Ask a question in the live chat"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                {/* Deliberately never `disabled`: a disabled button swallows the
                    tap, and handleSend is what explains why a send cannot go
                    through right now. */}
                <button
                  type="button"
                  className="send-icon-btn"
                  aria-label="Send message"
                  onClick={(e) => handleSend(e)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              
              {!isHost && !props.isGuest && !isCallForCurrentAstrologer && !pendingConnections.some((c) => c.astrologer?._id === astrologerId) && (
                <button 
                  className="call-price-btn"
                  onClick={handleDirectVoiceCall}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>₹{fullAstro?.price?.audioRate?.amount || astrologer?.audioCallRate || 0}/ min</span>
                </button>
              )}
              {!isHost && !isCallForCurrentAstrologer && pendingConnections.some((c) => c.astrologer?._id === astrologerId) && (
                <button className="call-cancel-circle" onClick={() => {
                  const conn = pendingConnections.find((c) => c.astrologer?._id === astrologerId);
                  if (conn?.roomId) {
                    voiceSocket.emit("call:cancel", { roomId: conn.roomId, canceledBy: "CUSTOMER" });
                    removePendingConnection(conn.roomId);
                  }
                }} aria-label="Cancel call">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {!isHost && isCallForCurrentAstrologer && (
                <>
                  <button className="call-action-pill" onClick={() => setShowKundliModal(true)} aria-label="Share Kundli">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <text x="3" y="19" fontSize="18" fill="white" fontFamily="serif">卐</text>
                    </svg>
                  </button>
                  {isShubhMallEnabled() && (
                    <button
                      className="call-action-pill"
                      style={{ position: "relative" }}
                      onClick={() => { setIsRemedyPanelOpen(true); dispatch(clearNewRemedy()); }}
                      aria-label="Suggested Remedy"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      {hasNewRemedy && <span className="call-action-dot" />}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          )}

          <GiftPopup
            show={showGifts}
            onClose={() => setShowGifts(false)}
            giftList={giftList?.data}
            astrologerId={astrologer?._id || astrologer?.astrologerId}
            astrologerName={resolvedHostUserName || astrologer?.name}
            socketRef={props.socketRef}
            roomId={props.channel}
            userId={userIdLocal}
            userName={(() => {
              const u = getUserFromStorage();
              const first = u?.firstName || "";
              const last = u?.lastName || "";
              if (first && last && first.toLowerCase() !== last.toLowerCase()) return `${first} ${last}`;
              return first || "User";
            })()}
          />
          <SharePopup
            show={showSharePopup}
            onClose={() => setShowSharePopup(false)}
            url={shareUrl}
            shareToWhatsapp={shareToWhatsapp}
            shareToGmail={shareToGmail}
            handleCopyLink={handleCopyLink}
          />

          {/* Guests can watch but must sign up before sending a live-chat
              message. Opened from useLiveViewLogic's onGuestBlocked. */}
          <GuestKundliAuthModal
            isOpen={showGuestAuthModal}
            onClose={() => setShowGuestAuthModal(false)}
          />

          <LiveListModal
            show={showLiveList}
            onClose={() => { setShowLiveList(false); scrollDisabledRef.current = false; if (props.giftPopupOpenRef) props.giftPopupOpenRef.current = false; }}
            lives={liveListData}
          />

          <CallRequestPopup
            show={showCallPopup}
            onClose={() => setShowCallPopup(false)}
            onJoinAudio={() => handleCallRequest("audio")}
            onJoinVideo={() => handleCallRequest("video")}
            host={hostData}
            astrologer={astrologer}
            waitingList={callWaitingList}
          />

          {/* Waiting indicator is now shown as icon in right-action-bar */}

          {/* NEW BOTTOM ACTION BAR - only show when astrologer is live */}
          {isAstrologerLive && (
          <div className="right-action-bar">
            {/* Waiting in queue icon — only when waiting */}
            {shouldShowWaitingIndicator && (
              <div className="icon-btn" style={{ position: "relative" }}>
                <div
                  className="icon-circle hourglass-blink"
                  style={{ cursor: "pointer", background: "transparent" }}
                  onClick={(e) => { e.stopPropagation(); setShowWaitingPopup((v) => !v); }}
                >
                  <IoHourglass size={20} color="currentColor" />
                  <span className="hourglass-dot" />
                </div>
                {/* Waiting toast — beside hourglass, then shrinks into it */}
                {showWaitingToast && (
                  <div
                    className="waiting-beside-toast"
                    onAnimationEnd={() => setShowWaitingToast(false)}
                  >
                    <span style={{ fontSize: 18 }}>⏳</span>
                    <div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Waiting in queue</div>
                      <div style={{ color: '#9ca3af', fontSize: 11 }}>
                        {(() => {
                          const conn = pendingConnections.find((c) => c.astrologer?._id === astrologerId && c.confidence);
                          if (!conn) return "Approx 5 mins";
                          const { waitingTime, minWait, maxWait, confidence } = conn;
                          const safeWait = Math.max(1, waitingTime || 1);
                          const safeMin = Math.max(1, minWait || safeWait);
                          const safeMax = Math.max(safeMin, maxWait || safeWait);
                          if (confidence === "high") return `~${safeWait} min`;
                          return `~${safeMin}-${safeMax} min`;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                {/* New waitlist modal — opens on hourglass click */}
                <WaitlistModal
                  show={showWaitingPopup}
                  pendingRequests={pendingConnections.filter((c) => c.astrologer?._id === astrologerId)}
                  onClose={() => setShowWaitingPopup(false)}
                  onShow={() => setShowWaitingPopup(true)}
                  onAccept={(roomId, type) => {
                    const event = type === "chat" ? "chat:user_accept" : "call:user_accept";
                    voiceSocket.emit(event, { roomId });
                  }}
                  onReject={(roomId, type) => {
                    const event = type === "chat" ? "chat:user_reject" : "call:user_reject";
                    voiceSocket.emit(event, { roomId });
                    removePendingConnection(roomId);
                  }}
                  onUnhold={(roomId, type) => {
                    const userId = localStorage.getItem("shubhtalk_customer_id");
                    if (!roomId || !userId) return;
                    // Emit unhold
                    const unholdEvent = type === "chat" ? "chat:unhold" : "call:unhold";
                    voiceSocket.emit(unholdEvent, { roomId });
                    // Get connection data before removing
                    const conn = pendingConnections.find((c) => c.roomId === roomId);
                    removePendingConnection(roomId);
                    // Re-initiate call/chat
                    const initiateEvent = type === "chat" ? "chat:initiate" : "call:initiate";
                    voiceSocket.emit(initiateEvent, {
                      userId,
                      astrologerId: conn?.astrologer?._id || astrologerId,
                      type,
                      isLive: true,
                      liveRoomDetails: {
                        roomId: props.channel,
                        hostId: conn?.astrologer?._id || astrologerId,
                        hostName: getAstrologerDisplayName(conn?.astrologer) || conn?.astrologer?.astrologerName || resolvedHostUserName,
                        channel: props.channel,
                      },
                    });
                    // Add fresh pending entry
                    addPendingConnection({
                      id: `${conn?.astrologer?._id || astrologerId}-${type}-${Date.now()}`,
                      astrologer: conn?.astrologer || { _id: astrologerId },
                      type,
                      roomId: null,
                      waitingTime: type === "chat" ? 2 : 5,
                      isEmergency: false,
                      fromLive: true,
                      liveChannelId: props.channel,
                    });
                  }}
                  onCancel={(roomId, type) => {
                    if (!roomId) return;
                    // Delegate to the queue context so the correct socket event
                    // is emitted for the request's current status:
                    //   on_hold (missed call)   -> chat/call:hold_cancel
                    //   astrologer_accepted     -> chat/call:user_reject
                    //   ringing / waiting       -> chat/call:cancel
                    // Previously this always emitted the plain cancel event,
                    // which was wrong once the request went on hold.
                    cancelPendingConnection(roomId, type);
                  }}
                  onCancelAll={() => { resetCallState(); }}
                  onScrollToAstrologer={(astrologerId) => {
                    if (!liveListCtx) return;
                    const live = liveListCtx.lives?.find((l) => l.astrologerId === astrologerId || l.hostId === astrologerId);
                    if (live?.channel) liveListCtx.switchToChannel(live.channel);
                  }}
                />
              </div>
            )}

            {/* Viewers — a readout, not a control.
              *
              * The `cursor: default` that used to live inline here has moved to
              * `.viewer-icon-btn` in videoBox.scss, together with rules that
              * strip the circular button chrome this shared with the gift and
              * share buttons on either side of it. Clarity dead clicks were
              * landing here because on mobile the badge looked exactly like the
              * two real buttons around it. `role="status"` plus an explicit
              * label also stops assistive tech reading it as a bare number. */}
            <div className="icon-btn viewer-icon-btn" role="status" aria-label={`${viewerCount} watching`}>
              <div className="icon-circle" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
              </div>
              <span className="icon-label">{viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}</span>
            </div>

            {/* Send Gift */}
            {!isHost && !props.isGuest && (
              <button className="icon-btn" onClick={() => setShowGifts(true)}>
                <div className="icon-circle">
                  <img src={AppImages.LiveGift} alt="Send gift" width="28" height="28" />
                </div>
                <span className="icon-label">Send gift</span>
              </button>
            )}

            {/* Share (curved reply arrow) */}
            <button className="icon-btn" onClick={() => setShowSharePopup(true)}>
              <div className="icon-circle">
                <img src={AppImages.LiveShare} alt="Share" width="28" height="28" />
              </div>
              {/* <span className="icon-label">{viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}</span> */}
            </button>

            {/* End Live - Only for hosts */}
            {isHost && (
              <button
                className="icon-btn end-live"
                onClick={() => setCalling(false)}
              >
                <div className="icon-circle">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
          )}
        </div>

        {/* Kundli Select Modal — shown during active call */}
        <KundliSelectModal
          isOpen={showKundliModal}
          onClose={() => setShowKundliModal(false)}
          onSelect={handleKundliSelect}
        />

        {/* Suggested Remedy Panel — shown during active call */}
        <SuggestedRemedyPanel
          isOpen={isRemedyPanelOpen}
          onClose={() => setIsRemedyPanelOpen(false)}
          remedyData={suggestedRemedyData}
          onProductClick={() => setIsRemedyPanelOpen(false)}
        />

        {/* Recharge Modal — shown on low balance warning during active call */}
        <RechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={() => {
            refreshWallet();
            setIsRechargeModalOpen(false);
            setShowRechargeButton(false);
          }}
          title="Recharge to Continue Call"
        />

        {/* Insufficient Balance popup — shown when preSessionBalanceCheck returns status:false */}
        <InsufficientBalanceModal
          isOpen={!!insufficientBalanceInfo}
          onClose={() => setInsufficientBalanceInfo(null)}
          onRecharge={() => {
            setInsufficientBalanceInfo(null);
            setIsRechargeModalOpen(true);
          }}
          sessionType={insufficientBalanceInfo?.sessionType}
          availableAmount={insufficientBalanceInfo?.availableAmount}
          requiredAmount={insufficientBalanceInfo?.requiredAmount}
          pricePerMinute={insufficientBalanceInfo?.pricePerMinute}
        />
      </div>
    </FixedLayer>
  );
};

export default LiveView;
