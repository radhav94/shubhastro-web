import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaPlay, FaStar, FaStarHalfAlt, FaRegStar, FaChevronRight } from "react-icons/fa";
import { Radio } from "lucide-react";
import { IoMdTime } from "react-icons/io";
import {
  IoChevronBack,
  IoPaperPlaneOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import { MdNotifications } from "react-icons/md";
import { BiMessageDetail, BiPhone, BiVideo } from "react-icons/bi";
import { PiBookOpenTextLight, PiUsersThreeBold } from "react-icons/pi";
import {
  useGetAstrologerByIdQuery,
  useGetAstrologersQuery,
} from "../../../redux/api/astrologer/astrologerApi";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ErrorText, PrimaryText } from "../../../component";
import toast from "../../../component/toast";
import { unavailableReason } from "../../../utils/helper/astrologerAvailability";
import {
  getAstrologerDisplayName,
  getAstrologerProfilePath,
  isObjectIdLike,
} from "../../../utils/helper/string.utils";
import {
  useFollowAstrologerByIdMutation,
  useUnfollowAstrologerByIdMutation,
  useCheckFollowingStatusQuery,
} from "../../../redux/api/astrologer/followAstrologerApi";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useCall } from "../../../context/CallContext";
import { getToken } from "../../../utils/token";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import { useTalkToAstrologer } from "../talkToAstrologer/useTalkToAstrologer";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useGetAstrologerReviewsQuery, useLazyGetAstrologerReviewsQuery } from "../../../redux/api/review/reviewApi";
import { useLazyGetCallHistoryQuery } from "../../../redux/api/callHistory/callHistory";
import { useLazyGetUserChatMessagesQuery } from "../../../redux/api/chatHistory/chatHistory";
import useIsDesktop from "../../../utils/hooks/useIsDesktop";

import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useGuestConnectFlow } from "../../public/guestChat/useGuestConnectFlow";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useChat } from "../../../context/ChatContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { trackEvent } from "../../../utils/analytics";
import { ProfileManager } from "../../../component/UI/Profile";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { AppIcons, getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../utils/appImages";
import AstrologerLiveBadge from "../../../component/UI/astrologerLiveBadge/AstrologerLiveBadge";
import useAstrologerLiveStatus from "../../../hooks/useAstrologerLiveStatus";
import { resolveLiveChannelForAstrologer } from "../../../utils/helper/resolveLiveChannel";
import AudioIntro from "./AudioIntro";

// Import custom SVG icons
import ExperienceIcon from "../../../assets/icons/experience.svg";
import ConsultationsIcon from "../../../assets/icons/consultations.svg";
import RatingIcon from "../../../assets/icons/rating.svg";
import ShareIcon from "../../../assets/icons/Share.svg";
import TimeIcon from "../../../assets/icons/time-icon.svg";
import NotificationIcon from "../../../assets/icons/notification.svg";
import ChatMinutesIcon from "../../../assets/icons/experienceIcon.svg";
import CallMinutesIcon from "../../../assets/icons/callMinutess.svg";
import VideoMinutesIcon from "../../../assets/icons/videoMinutes.svg";
import SendGiftImage from "../../../assets/images/send-gift.png";
import AstrologerShopImage from "../../../assets/images/astrologer-shop.png";
import AstrologerNumerologyDefault from "../../../assets/default-img/astrologer-numerology.png";
import iconSet from "../../../assets/images/Vector.png";
import GiftModal from "../../../component/call/GiftModal";
import VirtualAssistant from "../../../component/virtualAssistant/VirtualAssistant";
import { useGetChatHistoryQuery } from "../../../redux/api/chatApi";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";

// Chat/Call actions for a top-astrologer sidebar card. Mirrors the homepage
// (NewAstrologerCard) enable logic: both buttons always render, and are enabled
// only when the astrologer is online, not live-streaming, active for that
// session type, and has a price for it. Extracted into a component so the
// live-status hook can be used per astrologer inside the list.
const TopAstrologerActions = ({ astrologer, onChat, onCall }) => {
  const isOnline = astrologer?.isActive === true;
  const { isLive } = useAstrologerLiveStatus(astrologer?._id, astrologer?.astrologerLiveStatus);
  const activeTypes = astrologer?.isActiveType || [];
  const chatPrice = Number(astrologer?.price?.chatRate?.amount) || 0;
  const callPrice = Number(astrologer?.price?.audioRate?.amount) || 0;
  const chatTypeActive = activeTypes.includes("all") || activeTypes.includes("chat");
  const callTypeActive = activeTypes.includes("all") || activeTypes.includes("audio");
  const chatEnabled = isOnline && !isLive && chatTypeActive && chatPrice > 0;
  const callEnabled = isOnline && !isLive && callTypeActive && callPrice > 0;

  // Never render these `disabled`: a disabled button swallows the tap and the
  // `title` tooltip does not exist on touch devices, so the user gets no
  // response at all. See utils/helper/astrologerAvailability.
  const chatReason = unavailableReason({
    label: "Chat",
    isOnline,
    isLive,
    isTypeActive: chatTypeActive,
    hasPrice: chatPrice > 0,
  });
  const callReason = unavailableReason({
    label: "Call",
    isOnline,
    isLive,
    isTypeActive: callTypeActive,
    hasPrice: callPrice > 0,
  });

  return (
    <div className={styles.actionButtons}>
      <div className={styles.buttonWrapper}>
        <button
          className={`${styles.chatBtn} ${!chatEnabled ? styles.unavailable : ""}`.trim()}
          onClick={() => {
            if (!chatEnabled) {
              toast.info(chatReason);
              return;
            }
            onChat(astrologer);
          }}
          aria-disabled={!chatEnabled}
          title={!chatEnabled ? chatReason : "Start chat"}
        >
          <img src={AppIcons.ChatMinutesIcon} alt="" /> Chat
        </button>
        <p className={styles.priceText}>
          {astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
            <>
              <span className={styles.originalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{chatPrice}</span> min
            </>
          ) : (
            <>
              <span className={styles.priceAmount}>₹{chatPrice}</span> min
            </>
          )}
        </p>
      </div>
      <div className={styles.buttonWrapper}>
        <button
          className={`${styles.callBtn} ${!callEnabled ? styles.unavailable : ""}`.trim()}
          onClick={() => {
            if (!callEnabled) {
              toast.info(callReason);
              return;
            }
            onCall(astrologer, "audio");
          }}
          aria-disabled={!callEnabled}
          title={!callEnabled ? callReason : "Start call"}
        >
          <img src={AppIcons.CallMinutesIcon} alt="" /> Call
        </button>
        <p className={styles.priceText}>
          {astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
            <>
              <span className={styles.originalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{callPrice}</span> min
            </>
          ) : (
            <>
              <span className={styles.priceAmount}>₹{callPrice}</span> min
            </>
          )}
        </p>
      </div>
    </div>
  );
};

const AstrologerProfile = () => {
  // The URL segment is EITHER the astrologer's `userName` handle
  // (`/astrologer/anirudh`, the canonical form) or a raw ObjectId
  // (`/astrologer/darpan-naik/69b2...`, the fallback for astrologers with no
  // userName, plus every previously shared link). The lookup endpoint accepts
  // both, so it's passed through untouched.
  const { id: astrologerParam } = useParams();
  const navigate = useNavigate();
  /*
    The router's location, which this file previously never obtained — every
    `location.pathname` here was resolving to the global `window.location`. That
    happens to work for `pathname`, so it went unnoticed, but `window.location`
    has no `key`, and `key` is how you tell whether there is in-app history to go
    back to. Without this, handleBackOut's check would read `undefined` and always
    take the `navigate(-1)` branch — silently keeping the bug it exists to fix.
  */
  const location = useLocation();
  // Same Figma-exported star icon as NewAstrologerCard, which this page also
  // renders — both hardcoded `id="clip0_4961_937"`, so they collided.
  const starClipId = `astroProfileStarClip-${useId()}`;

  const {
    data: astrologerData,
    isLoading,
    error,
    refetch: refetchAstrologer,
  } = useGetAstrologerByIdQuery(
    { id: astrologerParam },
    { skip: !astrologerParam },
  );

  const data = astrologerData?.data;

  // The real ObjectId. Anything that talks to an id-only endpoint (chat
  // history, follow status, live status, analytics) must use this, never the URL
  // segment — that may be a userName handle, which those endpoints reject.
  const id = data?._id || (isObjectIdLike(astrologerParam) ? astrologerParam : "");

  // Track astrologer profile view (fires when a new astrologer id is opened)
  useEffect(() => {
    if (id) trackEvent("astrologer_profile_viewed", { astrologer_id: id });
  }, [id]);

  // Live status — seeded from the fetched astrologer, then kept up to date via
  // the live:astrologer_status socket event (no polling needed).
  const { isLive, roomId: liveRoomId } = useAstrologerLiveStatus(
    id,
    data?.astrologerLiveStatus
  );

  // Set while the channel is being looked up, so all five join controls can show
  // that the tap registered. See handleJoinLive.
  const [joiningLive, setJoiningLive] = useState(false);

  const goToLive = (channel) => {
    trackEvent("live_stream_joined", { astrologer_id: id, stream_id: channel });
    navigate(`/live/${channel}`, {
      state: { from: getAstrologerProfilePath(data, id) },
    });
  };

  /*
    Shared by all five join controls: the LIVE pill, the mobile status bar, the
    sidebar live card, that card's Join button, and the mobile "Join Live Session"
    CTA.

    An earlier pass replaced a bare `if (liveRoomId) { … }` with a toast, on the
    understanding that a missing roomId was a brief window. It is not. `roomId`
    reaches useAstrologerLiveStatus only from `astrologerLiveStatus` on the fetched
    astrologer or from the `live:astrologer_status` socket event, and that event
    fires on a status *change* — so a visitor who opens this profile while the
    stream is already running never gets it. If the API omitted the roomId, all
    five controls stay no-ops for the whole visit, and the toast made that
    invisible to Clarity rather than fixing it.

    Clarity caught it: a visitor tried to join a live session, then worked through
    this astrologer's LIVE controls at 01:09, got nothing, and left.

    So look the channel up from the live list — the same source LivePlayerPage
    uses — and only report failure when the astrologer genuinely isn't in it. The
    busy state gives the tap a visible response, which a toast cannot.
  */
  const handleJoinLive = async () => {
    if (joiningLive) return;

    if (liveRoomId) {
      goToLive(liveRoomId);
      return;
    }

    setJoiningLive(true);
    try {
      const channel = await resolveLiveChannelForAstrologer(id);
      if (channel) {
        goToLive(channel);
        return;
      }
      toast.error("This live session just ended. Try another astrologer.");
    } finally {
      setJoiningLive(false);
    }
  };

  // Availability for the three connect tiles (Chat / Audio / Video).
  //
  // These tiles used to be `<div onClick={cond && handler}>`: when the
  // astrologer was offline, not accepting that session type, or had no rate
  // configured, the tap was swallowed and nothing at all happened — no toast,
  // no modal. `.connectOptionDisabled` only dimmed them and set a `cursor`,
  // which is meaningless on touch. That is a dead click, and it is what mobile
  // users hit after tapping through from a category listing.
  const connectTiles = useMemo(() => {
    const activeTypes = data?.isActiveType || [];
    const isOnline = data?.isActive === true;

    const build = (label, typeKey, rateKey) => {
      const price = Number(data?.price?.[rateKey]?.amount) || 0;
      const isTypeActive = activeTypes.includes("all") || activeTypes.includes(typeKey);
      return {
        price,
        enabled: isOnline && !isLive && isTypeActive && price > 0,
        reason: unavailableReason({
          label,
          isOnline,
          isLive,
          isTypeActive,
          hasPrice: price > 0,
        }),
      };
    };

    return {
      chat: build("Chat", "chat", "chatRate"),
      audio: build("Call", "audio", "audioRate"),
      video: build("Video call", "video", "videoCallRate"),
    };
  }, [data?.isActive, data?.isActiveType, data?.price, isLive]);

  // Fetch top astrologers for left sidebar — desktop only, and now actually
  // skipped on mobile. `.leftSidebar` is `display: none !important` at <=1024px
  // (AstrologerProfile.module.scss), so every phone and tablet load was fetching
  // a 10-astrologer list that could never be rendered, in parallel with the
  // astrologer request this page genuinely blocks on.
  const isDesktop = useIsDesktop(1025);
  const { data: topAstrologersData } = useGetAstrologersQuery(
    { page: 1, limit: 10, isActive: true },
    {
      skip: !isDesktop,
      // Sidebar list, not the primary content. Serve a recent result from cache
      // instead of refetching on every profile view — this is the same query the
      // /astrologers listing uses, so navigating between profiles keeps it warm
      // rather than paying the request each time.
      refetchOnMountOrArgChange: 120,
    },
  );
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useGetAstrologerReviewsQuery(
    { astrologerID: data?.astrologer_ID, page: 1, limit: 10 },
    { skip: !data?.astrologer_ID },
  );

  // Listen for review submission events (backup to cache invalidation)
  useEffect(() => {
    const handleReviewSubmitted = (event) => {
      if (event.detail?.astrologerID === data?.astrologer_ID) {
        refetchReviews();
      }
    };

    window.addEventListener("reviewSubmitted", handleReviewSubmitted);
    return () =>
      window.removeEventListener("reviewSubmitted", handleReviewSubmitted);
  }, [data?.astrologer_ID, refetchReviews]);

  const [showFullAbout, setShowFullAbout] = useState(false);
  const [isAboutTruncated, setIsAboutTruncated] = useState(false);
  const aboutTextRef = useRef(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  /*
    Whether the 5-line clamp is actually cutting the text off. This decides
    whether "Read More" renders at all, so a wrong answer leaves visibly
    truncated text with no way to expand it — a paragraph that ends mid-sentence
    and nothing to click.

    The old version measured once inside a single requestAnimationFrame. That is
    one frame after the description lands, which on this page is routinely too
    early: Poppins is loaded from Google Fonts with `media="print"` swapped to
    `all` on load (see index.html), so the first measurement can happen in the
    fallback font, and the three-column layout reflows this column as the right
    rail and sidebar images settle. Either one changes how many lines the text
    occupies after the single measurement has already been taken.

    Now: re-measure on element resize, and again once webfonts are ready.
  */
  useEffect(() => {
    const el = aboutTextRef.current;
    if (!el || showFullAbout) return;

    const measure = () => {
      // +1px tolerance: scrollHeight/clientHeight are rounded, and a
      // fractional line-height can leave a sub-pixel difference on text that
      // is not actually clamped.
      setIsAboutTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    // Fonts change line count, and this page's font arrives asynchronously.
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [data?.description, showFullAbout]);
  const [isVAOpen, setIsVAOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Reviews pagination state
  const [allReviews, setAllReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchMoreReviews] = useLazyGetAstrologerReviewsQuery();

  // Both of these need the real ObjectId (`id`), so on a `/astrologer/<userName>`
  // URL they wait one round trip for the profile fetch to resolve. On the older
  // `/astrologer/<slug>/<objectId>` URLs `id` is available immediately from the
  // URL, so they still fire in the first wave — no waterfall there.
  const { data: vaChatHistoryData } = useGetChatHistoryQuery(
    { userId: id },
    { skip: !id || !getToken() },
  );

  const hasChatHistory = (vaChatHistoryData?.data?.length || 0) > 0;

  const { data: followingData } = useCheckFollowingStatusQuery(
    { astrologerId: id },
    { skip: !id || !getToken() },
  );

  // Check if the current astrologer is in the following list
  const isFollowing = followingData?.data?.isFollowing || false;

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const [createChatRoom] = useCreateChatRoomMutation();
  const [setOpenModal] = useTalkToAstrologer();

  // State
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showMobileConnectPopup, setShowMobileConnectPopup] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const { openGuestConnect, guestConnectModal } = useGuestConnectFlow();

  const { activeCall, setActiveCall, setOpenReview, setReviewData, lastSelectedKundli } = useCall();
  
  const {
    waitingList: WaitingList,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setActiveChat,
    setChatSeconds,
  } = useChat();

  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, cancelAll, assignRoomId } = useWaitingQueue();
  
  const {
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    resetCallFlow,
    setActiveCallRoomId,
  } = useCall();

  const activeCallAstroRef = useRef(null);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = getToken();
  const { balance } = useWalletBalance();

  // Call & chat history, fetched on demand rather than on mount.
  //
  // These were two eager queries pulling 30 records each on every page load, and
  // their only consumer is `lastRoomId`, which in turn is only read inside
  // handleOpenReviewModal — a click handler. So every visitor paid for two
  // sizeable requests on the critical path to populate a field that most of them
  // never reach. Now they run when the review modal is actually opened.
  const [fetchCallHistory] = useLazyGetCallHistoryQuery();
  const [fetchChatHistory] = useLazyGetUserChatMessagesQuery();

  // Most recent roomId for this astrologer, from call/chat history. Pure so it
  // can run against freshly fetched payloads instead of render-time state.
  const pickLastRoomId = (callHistoryData, chatHistoryData, astrologerId) => {
    if (!astrologerId) return null;

    const callEntry = callHistoryData?.data?.callHistory?.find(
      (item) => item?.receiverId === astrologerId,
    );
    const chatEntry = chatHistoryData?.data?.chatHistory?.find(
      (room) => room?.astrologerId === astrologerId,
    );

    // Pick the most recent one
    const callTime = callEntry?.timestamp ? new Date(callEntry.timestamp) : null;
    const lastChat = chatEntry?.[chatEntry.length - 1];
    const chatTime = lastChat?.createdAt ? new Date(lastChat.createdAt) : null;

    if (callTime && chatTime) {
      return callTime > chatTime ? callEntry.roomId : chatEntry.roomId;
    }
    return callEntry?.roomId || chatEntry?.roomId || null;
  };
  
  // Use the astrologer connect hook
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  /*
    Follow / unfollow.

    Both of the non-success paths here used to end in silence, and this is the one
    control on the page whose entire result is a label change:

      - `if (!data?._id) return;` — a bare return. The button renders from
        `displayData`, which falls back to the astrologer passed through router
        state, so it is on screen and enabled before `data` exists.
      - `catch { console.log(...) }` — on a failed request the label, the follow
        state and the screen were all left exactly as they were. The button is
        `disabled` while the mutation runs, so the whole interaction was: "..."
        for a moment, then back to "+ Follow", with no indication anything went
        wrong.

    That second path is what a long session hits. Session replay shows this page
    left hidden for roughly eighteen minutes and the follow attempted at 19:52 —
    by which point the access token may have expired or the connection dropped
    while the tab was backgrounded. The request fails, nothing is said, and the
    visitor is left tapping a button that keeps saying "+ Follow".
  */
  /*
    Leave the profile.

    `navigate(-1)` alone is inert on the first history entry — a shared link, an
    ad, or a Google in-app browser opening this profile directly — so the back
    chevron did nothing at all for exactly those visitors. Same pattern the rest
    of the codebase uses (see BackButton.jsx and LalKitabDetail.jsx): prefer real
    history, fall back to the listing this profile belongs to.
  */
  const handleBackOut = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/astrologers", { replace: true });
  };

  const handleFollow = async () => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!data?._id) {
      toast.error("Still loading this astrologer. Please try again in a moment.");
      return;
    }

    const wasFollowing = isFollowing;
    try {
      if (!wasFollowing) {
        await followAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(
          `We will notify you when ${getAstrologerDisplayName(data)} goes live or posts an update!`,
        );
      } else {
        await unfollowAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(`You unfollowed ${getAstrologerDisplayName(data)}`);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      // 401 after a long idle period is the likely case here, and "try again"
      // is useless advice if the session is gone — say which it is.
      if (err?.status === 401 || err?.originalStatus === 401) {
        toast.error("Your session expired. Please sign in again to follow.");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      toast.error(
        wasFollowing
          ? "Couldn't unfollow just now. Please try again."
          : "Couldn't follow just now. Please try again.",
      );
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${getAstrologerDisplayName(data)} - Astrologer`,
      text: `Check out ${getAstrologerDisplayName(data)}'s profile on ShubhTalk`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
        toast.error("Failed to share profile");
      }
    }
  };

  const handleConnectClick = () => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    
    
    activeCallAstroRef.current = data;
    setIsConnectPopupOpen(true);
  };

  const handleChatStart = async (astro, isEmergency = false) => {
    // Guests start chat through the conversational guest flow rather than login.
    if (!token) {
      const targetAstro = astro || data;
      navigate(`/guest-chat/${targetAstro?._id}`, { state: { astrologer: targetAstro } });
      return;
    }
    
    activeCallAstroRef.current = astro;
    const result = await hookHandleChatStart(astro, true, isEmergency);
    if (result?.emergencyAvailable) {
      setShowEmergencyModal(true);
      return;
    }
    return result;
  };

  const handleCallStart = async (astro, type, isEmergency = false) => {
    // Guests use the AI Wow-style guest flow (details + OTP), then the call starts.
    if (!token) {
      openGuestConnect(astro || data, type);
      return;
    }
    
    activeCallAstroRef.current = astro;
    const result = await hookHandleCallStart(astro, type, isEmergency);
    if (result?.emergencyAvailable) {
      setShowEmergencyModal(true);
      return;
    }
    return result;
  };

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    handleAfterKundliSelect(selectedProfile);
  };

  // Reset waiting state function
  const resetCallState = () => {
    // Cancel the active room on server based on connection type
    if (connectionType === "chat" && chatRoomId) {
      voiceSocket.emit("chat:cancel", { roomId: chatRoomId });
    } else if (
      (connectionType === "audio" || connectionType === "video") &&
      callRoomId
    ) {
      voiceSocket.emit("call:cancel", { roomId: callRoomId });
    }

    // Explicitly reset waiting states to false
    setWaitingList(false);
    setCallWaitingList(false);

    // Reset local state
    setCallRoomId(null);
    setChatRoomId(null);
    setConnectionType(null);

    // Clear localStorage
    localStorage.removeItem("waitingState");

    // Reset context flows
    resetChatFlow();
    resetCallFlow();
  };



  /*
    Opening the review modal waits on two history requests before anything
    appears, and nothing acknowledged the tap while they were in flight — so on a
    slow connection the control sat there looking broken and got tapped again.
    That matters more now that the star row above is a second trigger for this
    same action.
  */
  const [openingReview, setOpeningReview] = useState(false);

  const handleOpenReviewModal = async () => {
    if (openingReview) return;
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setOpeningReview(true);

    // Resolve the roomId here rather than on every page load — see the note on
    // fetchCallHistory. Cached by RTK Query, so reopening the modal is free.
    // `roomId` is optional metadata on the review, so a failed lookup must not
    // block the modal.
    let roomId = null;
    if (userIdLocal) {
      try {
        const [callRes, chatRes] = await Promise.all([
          fetchCallHistory({ userId: userIdLocal, page: 1, limit: 30 }).unwrap(),
          fetchChatHistory({ userId: userIdLocal, page: 1, limit: 30 }).unwrap(),
        ]);
        roomId = pickLastRoomId(callRes, chatRes, data?._id);
      } catch {
        roomId = null;
      }
    }

    try {
      setReviewData({
        astrologerID: data?.astrologer_ID,
        fullName: getAstrologerDisplayName(data),
        profileImage: getAstrologerImageUrl(data),
        roomId,
      });
      setOpenReview(true);
    } finally {
      // In a `finally` so the busy flag can never strand the control on
      // "Opening…" if anything above it throws.
      setOpeningReview(false);
    }
  };

  const handleSetReminder = () => {
    try {
      const astrologerName = getAstrologerDisplayName(displayData);

      /*
       * `weeklySchedule` is always seven entries in fixed Monday-first order
       * (see formatWeeklyAvailability), with `time` null on days the astrologer
       * is offline.
       *
       * This used to be `weeklySchedule.find((item) => item.time)` — named
       * "next available" but actually the first *listed* day with hours, i.e.
       * Monday whenever Monday is worked. Its start time was then combined with
       * TODAY's date, and `nextAvailable.day` was never used at all. So on a
       * Friday the reminder was created for Friday at Monday's start time,
       * usually a moment that had already passed, which puts the calendar event
       * in the past.
       *
       * Walk forward from today instead and take the first day that actually has
       * hours, skipping today if its start time has already gone by.
       */
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.trim().split(" ");
        let [hours, minutes = "00"] = time.split(":");
        hours = parseInt(hours, 10);

        if (period === "pm" && hours !== 12) {
          hours += 12;
        } else if (period === "am" && hours === 12) {
          hours = 0;
        }

        return { hours, minutes: parseInt(minutes, 10) || 0 };
      };

      const now = new Date();
      let start = null;

      for (let offset = 0; offset < 7; offset += 1) {
        const candidate = new Date(now);
        candidate.setDate(candidate.getDate() + offset);

        const dayName = candidate.toLocaleDateString("en-US", { weekday: "long" });
        const entry = displayData.weeklySchedule.find(
          (item) => item.day === dayName && item.time,
        );
        if (!entry) continue;

        // "8:00 am - 7:08 pm" -> start side only. Multiple slots are joined with
        // ", ", so take the first slot's start.
        const { hours, minutes } = parseTime(entry.time.split(" - ")[0]);
        candidate.setHours(hours, minutes, 0, 0);

        // Today's slot is only usable if it has not already started.
        if (offset === 0 && candidate <= now) continue;

        start = candidate;
        break;
      }

      if (!start) {
        toast.error("No upcoming consultation hours to set a reminder for.");
        return;
      }

      /*
       * Date arithmetic rather than string maths for the end time. The previous
       * version did `(startHour + 1) % 24` and reused today's date, so a slot
       * starting at 23:30 produced an end of 00:30 on the SAME day — an event
       * that ends before it begins. Adding an hour to a Date rolls the date over
       * correctly.
       */
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const stamp = (d) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
          d.getDate(),
        ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(
          d.getMinutes(),
        ).padStart(2, "0")}00`;

      const startDateTime = stamp(start);
      const endDateTime = stamp(end);

      // Create Google Calendar URL
      const eventTitle = encodeURIComponent(
        `Consultation with ${astrologerName}`,
      );
      const eventDetails = encodeURIComponent(
        `Reminder for consultation with ${astrologerName}\n\nSpecialties: ${displayData.specialities.join(", ")}\nLanguages: ${displayData.languagePreference.map((l) => (typeof l === "object" ? l.languageName : l)).join(", ")}`,
      );
      const eventLocation = encodeURIComponent(
        "ShubhTalk - Online Consultation",
      );

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDateTime}/${endDateTime}&details=${eventDetails}&location=${eventLocation}&sf=true&output=xml`;
      
      // Open Google Calendar in new tab
      window.open(googleCalendarUrl, "_blank");
      toast.success("Opening Google Calendar...");
    } catch (error) {
      console.error("Error creating calendar reminder:", error);
      toast.error("Failed to create reminder. Please try again.");
    }
  };

  useEffect(() => {
    if (!userIdLocal) return;

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2);

      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: "chat",
          timestamp: Date.now(),
        }),
      );
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setConnectionType(data?.type || "audio");
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5);

      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: data?.type || "audio",
          timestamp: Date.now(),
        }),
      );
    };

    const handleChatAccepted = async ({
      roomId,
      astrologerId,
      userId,
      ...data
    }) => {
      setWaitingList(false);
      localStorage.removeItem("waitingState");
      removePendingConnection(roomId);

      const astro = data?.astrologer || activeCallAstroRef.current || {};
      const kundliId = lastSelectedKundli?._id;

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          userId: userId,
          astrologerId: astrologerId,
          astrologerID: astro?.astrologer_ID || data?.astrologer?.astrologer_ID,
          kundliId,
          astrologerName: getAstrologerDisplayName(data?.astrologer),
          experience: data?.astrologer?.experience || "",
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: getAstrologerDisplayName(astro),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: getAstrologerDisplayName(data?.astrologer),
            astroID: data?.astrologer?.astrologer_ID,
            experience: astro?.experience || data?.astrologer?.experience,
            profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
          },
        });
      } catch (e) {
        console.error("Chat accepted error:", e);
        toast.error("Failed to start chat");
      }
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      channelName,
      type,
      remainingTime,
      isSwitch,
      ...rest
    }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      localStorage.removeItem("waitingState");
      removePendingConnection(roomId);

      const astro = rest?.astrologer || activeCallAstroRef.current;

      try {
        if (!astro) {
          console.error("❌ Astrologer data missing in ref");
          toast.error("Astrologer data missing");
          return;
        }

        const res = await createChatRoom({
          userId: userIdLocal,
          astrologerId: astro._id,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error("Failed to create chat room");

        setActiveCall({
          roomId,
          channelName,
          chatRoomId,
          agoraToken: token,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId: lastSelectedKundli?._id,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || astro?.imageUrl,
        });
      } catch (error) {
        console.error("Call accepted error:", error);
        toast.error("Failed to start call");
      }
    };

    const handleRejected = (data) => {
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
        data?.sessionData?.sessionEndReason === "rejected" &&
        data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      toast.error(errorMsg);

      localStorage.removeItem("waitingState");
      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    const handleSocketError = (err) => {
      toast.error(err?.message || "Connection error");

      localStorage.removeItem("waitingState");
      resetChatFlow();
      resetCallFlow();
      cancelAll();
      setConnectionType(null);
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("error", handleSocketError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("error", handleSocketError);
    };
  }, [
    userIdLocal,
    navigate,
    resetChatFlow,
    resetCallFlow,
    setWaitingList,
    setCallWaitingList,
    setActiveChatRoomId,
    setActiveCallRoomId,
    setActiveChat,
    setChatSeconds,
    setActiveCall,
    createChatRoom,
  ]);

  const reviews = reviewsData?.data?.getDetail || [];
  const totalReviews = data?.totalRatings || reviewsData?.data?.totalRecords || 0;

  // Sync initial reviews from API into allReviews
  useEffect(() => {
    if (reviewsData?.data) {
      setAllReviews(reviewsData.data.getDetail || []);
      setReviewPage(1);
      setReviewTotalPages(reviewsData.data.totalPages || 1);
    }
  }, [reviewsData]);

  const handleLoadMoreReviews = async () => {
    if (loadingMore || reviewPage >= reviewTotalPages) return;
    const nextPage = reviewPage + 1;
    setLoadingMore(true);
    try {
      const res = await fetchMoreReviews({
        astrologerID: data?.astrologer_ID,
        page: nextPage,
        limit: 10,
      }).unwrap();
      const newReviews = res?.data?.getDetail || [];
      setAllReviews((prev) => [...prev, ...newReviews]);
      setReviewPage(nextPage);
      setReviewTotalPages(res?.data?.totalPages || reviewTotalPages);
    } catch (err) {
      console.error("Failed to load more reviews:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll target for the Rating stat tile.
  const reviewsSectionRef = useRef(null);

  // Infinite scroll for reviews
  const reviewsListRef = useRef(null);
  const handleReviewsScroll = useCallback(() => {
    const el = reviewsListRef.current;
    if (!el || loadingMore || reviewPage >= reviewTotalPages) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      handleLoadMoreReviews();
    }
  }, [loadingMore, reviewPage, reviewTotalPages]);

  useEffect(() => {
    const el = reviewsListRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleReviewsScroll);
    return () => el.removeEventListener("scroll", handleReviewsScroll);
  }, [handleReviewsScroll]);

  // Use the overall rating from API data (not calculated from limited reviews)
  const averageRating = data?.rating || 0;

  // Get top astrologers list from the API response
  const topAstrologers = topAstrologersData?.data?.topTenAstrologer || [];

  // Helper: convert 24h "HH:MM" or "H:MM" to 12h "h:mm am/pm"
  const formatTimeTo12h = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  // Build full weekly schedule from API availability
  const formatWeeklyAvailability = (availability) => {
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayMap = {};
    if (availability?.length) {
      availability.forEach((item) => {
        if (!item?.day) return;
        const key = item.day.charAt(0).toUpperCase() + item.day.slice(1).toLowerCase();
        if (item.slots?.length) {
          dayMap[key] = item.slots
            .map((s) => `${formatTimeTo12h(s.start)} - ${formatTimeTo12h(s.end)}`)
            .join(", ");
        }
      });
    }
    return allDays.map((day) => ({
      day,
      time: dayMap[day] || null,
    }));
  };

  // Legacy helper for today's slots (used by Set Reminder)
  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return [{ day: "Offline", time: "Offline" }];
    }
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const todaySlots = availability.find((a) => a.day?.toLowerCase() === today);
    if (!todaySlots?.slots?.length) {
      return [{ day: "Offline", time: "Offline" }];
    }
    return todaySlots.slots.map((slot) => ({
      day: todaySlots.day,
      time: `${formatTimeTo12h(slot.start)} - ${formatTimeTo12h(slot.end)}`,
    }));
  };

  // Fallback data - only used when API data is missing
  const displayData = {
    // `userName` is the astrologer's public alias and takes priority in
    // getAstrologerDisplayName(). It has to be carried through here, otherwise
    // every getAstrologerDisplayName(displayData) call silently falls back to
    // firstName + lastName.
    userName: data?.userName || "",
    firstName: data?.firstName || "Astrologer",
    lastName: data?.lastName || "",
    // The hero image on this page renders at roughly 130x160, so prefer the
    // pre-resized `large` derivative (500x624) over the unresized original.
    // Larger than the cards' `medium` because this is the page's biggest image
    // and is often viewed on a desktop at 2x.
    imageUrl: getAstrologerImageUrl(data, "medium"),
    specialities:
      data?.specialties?.length > 0
        ? data.specialties.map((s) => (typeof s === "object" ? s.title || s.name : s))
        : ["Vedic Kundli", "Tarot", "Palmistry"],
    expertise:
      data?.expertise?.length > 0
        ? data.expertise.map((e) => (typeof e === "object" ? e.title : e))
        : ["Relationships", "Finance", "Health"],
    /*
      The same expertise entries, but keeping any `slug` the API sent.

      The line below the astrologer's name reads as a row of topic tags, and
      Clarity keeps reporting clicks in this block that do nothing — most
      recently a desktop visitor "interacting with biography details" across two
      visits to the same profile. A topic tag means "show me astrologers for
      this", and the listing already supports exactly that as a plain URL:
      /astrologers/<slug> is what FilterChips auto-applies from.

      Only entries that carry a real slug become links. Slugifying the title to
      guess the URL was rejected: an unrecognised slug lands on the listing's
      "No astrologers in this category" state, which trades a dead click for a
      dead end. So when the payload has no slugs this renders exactly as before.
    */
    expertiseTags:
      data?.expertise?.length > 0
        ? data.expertise
            .filter((e) => typeof e === "object" && e?.title && e?.slug)
            .map((e) => ({ title: e.title, slug: e.slug }))
        : [],
    languagePreference:
      data?.languagePreferences?.length > 0
        ? data.languagePreferences
        : ["English", "Hindi"],
    experience: data?.experience ?? 20,
    totalConsultations: data?.consultations ?? 1200,
    rating: data?.rating ?? 0,
    totalRatings: data?.totalRatings ?? 0,
    availability: formatAvailability(data?.availability),
    weeklySchedule: formatWeeklyAvailability(data?.availability),
    metrics: {
      chatMinutes: data?.metrics?.chatMinutes ?? 0,
      audioMinutes: data?.metrics?.audioMinutes ?? 0,
      videoMinutes: data?.metrics?.videoMinutes ?? 0,
    },
    
    description:
      data?.description ||
      "",
    // OLD: dummy/static gallery data
    // gallery:
    //   data?.gallery?.length > 0
    //     ? data.gallery
    //     : [
    //         "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+1",
    //         "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+2",
    //         "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+3",
    //       ],
    // NEW: dynamic gallery from achievements (achievementImgUrl) and education (certificateImgUrl)
    // Only include items where display === true, filter out null/undefined URLs
    gallery: [
      ...(data?.achievements || [])
        .filter((item) => item?.display === true && item?.achievementImgUrl)
        .map((item) => item.achievementImgUrl),
      ...(data?.education || [])
        .filter((item) => item?.display === true && item?.certificateImgUrl)
        .map((item) => item.certificateImgUrl),
    ],
    reviews:
      reviews.length > 0
        ? reviews.map((r) => ({
            date: new Date(r.createdAt).toLocaleDateString("en-GB"),
            rating: r.rating,
            user: r.customerName,
            text: r.review || "",
          }))
        : [
            {
              date: "25/11/2025",
              rating: 5.0,
              user: "Rahul Sharma",
              text: "The insights provided were life-changing, helping me to see my path clearly.",
            },
            {
              date: "26/11/2025",
              rating: 4.8,
              user: "Anjali Verma",
              text: "I felt a deep connection and understood my purpose in life better after our session.",
            },
            {
              date: "27/11/2025",
              rating: 4.2,
              user: "Sameer Rao",
              text: "The advice was practical and easy to implement, making a positive impact on my daily routine.",
            },
            {
              date: "28/11/2025",
              rating: 4.9,
              user: "Sneha Iyer",
              text: "I appreciated the warmth and empathy shown during our discussion; it truly felt supportive.",
            },
          ],
    products:
      data?.products?.length > 0
        ? data.products
        : [
            {
              name: "Crystal Set",
              description: "Amethyst + Quartz +",
              price: 1500,
              originalPrice: 2200,
              image: "",
              isPopular: true,
            },
            {
              name: "Astrology Journal",
              description: "Leather-bound",
              price: 800,
              originalPrice: 1200,
              image: "",
              isPopular: true,
            },
            {
              name: "Reading Cards",
              description: "Detailed illustrations",
              price: 3500,
              originalPrice: null,
              image: "",
              isPopular: true,
            },
          ],
  };

  /*
   * Whether this astrologer has ANY consultation hours in the week.
   *
   * Must stay below `displayData` — it reads it during render, so declaring it up
   * beside handleSetReminder (which only reads displayData when invoked) would be
   * a TDZ ReferenceError on every profile view.
   *
   * The "Set Reminder" button used to render unconditionally beneath the
   * Consultation Hours list. For an astrologer offline all week that list is
   * seven rows of "Offline" next to a fully-enabled button whose only possible
   * outcome is an error toast — there is no date to put in a calendar. A paid-ad
   * visitor was recorded doing exactly this across several offline astrologers
   * before giving up and starting a chat with someone else.
   *
   * Same call as the footer's App Store button: do not advertise a control that
   * cannot succeed. The seven "Offline" rows already state the situation.
   *
   * Deliberately NOT `disabled` + toast, which is the house pattern for a
   * temporarily-unavailable chat/call button. That pattern fits a state the
   * visitor can wait out; "this astrologer publishes no hours" is not.
   */
  const hasConsultationHours = displayData.weeklySchedule.some((item) => item.time);

  /*
    ── Dead clicks on the status card and the minutes tiles ──

    Two groups of elements on this page look like the primary CTA and did
    nothing at all:

    - The "Available Now" / "Offline" status card (mobile bar + desktop rail).
      It is the largest, highest-contrast block above the fold, it sits exactly
      where a Connect button belongs, and its own live-state twin in the same
      slot IS clickable (`handleJoinLive`). So the card teaches that it is a
      button and then ignores three quarters of the states it renders in.
    - "Chat Minutes" / "Call Minutes" / "Video Minutes". Same tile grammar as the
      Rating tile beside them, which is a working button, and they are labelled
      with the three actions the visitor came here to perform. "Chat Minutes"
      reads as "tap to chat"; it was a number.

    Neither becomes a paid action on tap — starting a chat from a statistics tile
    would be worse than doing nothing. They bring the real connect controls into
    view and flash them instead, which is the answer to the question the tap was
    asking. `connectPulse` is what makes it visible: on desktop the sidebar card
    is often already on screen, so a scroll alone would look like nothing
    happened, and a toast would not register with session replay either.
  */
  const connectCardRef = useRef(null);
  const mobileBottomBarRef = useRef(null);
  const hoursSectionRef = useRef(null);
  const [connectPulse, setConnectPulse] = useState(false);

  /*
    Why an unavailable Chat/Call/Video tile answers on the card instead of in a
    toast.

    The three connect tiles stay tappable when the astrologer can't take that
    session type — a `disabled` button fires no event at all, which is worse — and
    the answer was `toast.info(reason)`. That is invisible where it matters: the
    toast is portalled to the edge of the viewport, it changes nothing in the tile
    that was tapped, and react-hot-toast renders an identical repeat as no visible
    change. So the tap is logged dead and a second tap gets less feedback, not
    more.

    Clarity, desktop Chrome: a visitor returned to the same astrologer's profile
    three times (00:38, 02:06, 03:53) and made two attempts a second apart at
    04:14 and 04:15 before leaving. Same shape as the listing card, which now
    reports inline; this is the other half of that fix.
  */
  const [blockedNote, setBlockedNote] = useState(null);

  const reportBlocked = (reason) =>
    setBlockedNote((prev) => ({ text: reason, seq: (prev?.seq || 0) + 1 }));

  useEffect(() => {
    if (!blockedNote) return undefined;
    const id = setTimeout(() => setBlockedNote(null), 5000);
    return () => clearTimeout(id);
  }, [blockedNote]);

  const revealConnectOptions = () => {
    /*
      Whichever connect surface this width actually renders: the sidebar card
      above 1024px, the fixed bottom bar below it (the sidebars are
      `display: none !important` there, and an unrendered element has no
      offsetParent).
    */
    const sidebarCard = connectCardRef.current?.offsetParent
      ? connectCardRef.current
      : null;
    const target = sidebarCard || mobileBottomBarRef.current;

    if (!target) {
      // Live streaming: the connect card is not rendered in either place and
      // joining the stream is the only way to reach this astrologer.
      toast.info(
        unavailableReason({
          label: "Chat",
          isOnline: true,
          isLive: true,
          isTypeActive: true,
          hasPrice: true,
        }),
      );
      return;
    }

    // The bottom bar is `position: fixed`, so it is already on screen — the
    // pulse is the whole response there.
    if (target === sidebarCard) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setConnectPulse(true);
  };

  // Offline: there is nothing to connect to, so say so once and put the
  // published hours (and the Set Reminder button under them) in front of them.
  const handleOfflineStatusClick = () => {
    toast.info(
      unavailableReason({
        label: "Chat",
        isOnline: false,
        isLive,
        isTypeActive: true,
        hasPrice: true,
      }),
    );
    hoursSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (!connectPulse) return undefined;
    const id = setTimeout(() => setConnectPulse(false), 1200);
    return () => clearTimeout(id);
  }, [connectPulse]);

  /*
    Load / error / not-found states.

    These were `<div>Loading...</div>` and two bare <ErrorText> strings. The
    loading one fills the viewport (`min-height: 100vh`) with a centred grey
    word and nothing else: the page's own header — including its back button —
    is rendered further down, after these returns, so during the load there was
    not one interactive element on screen. A visitor who has just tapped an
    astrologer from the listing taps where the photo and the Chat/Call buttons
    are about to be, and gets nothing.

    That window is not short on a phone: this screen's chunk is ~84 kB on top of
    the astrologer request, and session replay caught a dead click three seconds
    after arrival in the Google in-app browser. The two error states were worse —
    a sentence with no header and no way out at all.

    All three now keep the page chrome, so a tap always has the back button to
    land on, and the failure states offer a retry and a route onward. Mirrors the
    treatment LivePlayerPage's gate states already have.
  */
  const stateShell = (children) => (
    <div className={styles.profilePage}>
      <header className={styles.topHeaderWrap}>
        <div className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={handleBackOut} aria-label="Go back">
              <IoChevronBack />
            </button>
            <h2 className={styles.headerTitle}>Profile</h2>
          </div>
        </div>
      </header>
      <div className={styles.stateBody}>{children}</div>
    </div>
  );

  if (isLoading) {
    return stateShell(
      <PrimaryLoader fullscreen={false} message="" />
    );
  }

  if (error) {
    return stateShell(
      <div className={styles.stateCard}>
        <h1 className={styles.stateTitle}>Couldn&apos;t load this profile</h1>
        <p className={styles.stateText}>
          This is usually a connection hiccup rather than a problem with the astrologer.
        </p>
        <div className={styles.stateActions}>
          <button type="button" className={styles.statePrimary} onClick={refetchAstrologer}>
            Try again
          </button>
          <Link to="/astrologers" className={styles.stateSecondary}>
            Browse astrologers
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return stateShell(
      <div className={styles.stateCard}>
        <h1 className={styles.stateTitle}>Astrologer not found</h1>
        <p className={styles.stateText}>
          This profile may have been removed, or the link may be out of date.
        </p>
        <div className={styles.stateActions}>
          <Link to="/astrologers" className={styles.statePrimary}>
            See who&apos;s online
          </Link>
        </div>
      </div>
    );
  }

  const StarRating = ({ rating, max = 5 }) => {
    return (
      <div className={styles.starRating}>
        {[...Array(max)].map((_, i) => {
          const starIndex = i + 1;
          if (rating >= starIndex) {
            return <FaStar key={i} className={styles.starFilled} />;
          }
          if (rating >= starIndex - 0.5) {
            return <FaStarHalfAlt key={i} className={styles.starFilled} />;
          }
          return <FaRegStar key={i} className={styles.starEmpty} />;
        })}
      </div>
    );
  };

  return (
    <div className={styles.profilePage}>
      {/* Top Header */}
      <header className={styles.topHeaderWrap}>
        <div className={styles.topHeader}>
          <div className={styles.headerLeft}>
            {/* handleBackOut, not a bare navigate(-1) — see its definition. */}
            <button className={styles.backBtn} onClick={handleBackOut} aria-label="Go back">
              <IoChevronBack />
            </button>
            <h2 className={styles.headerTitle}>Profile</h2>
          </div>
          <div className={styles.headerActions}>
            {hasChatHistory && (
              <button className={styles.vaBtn} onClick={() => setIsVAOpen(true)}>
                Virtual Assistant
              </button>
            )}
            <button
              className={`${styles.followBtn} ${isFollowing ? styles.following : ""}`}
              onClick={handleFollow}
              disabled={followLoading || unfollowLoading}
            >
              {followLoading || unfollowLoading
                ? "..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
            <button className={styles.shareBtn} onClick={handleShare}>
              <img src={ShareIcon} alt="Share" className={styles.shareIcon} />
            </button>
          </div>
        </div>
      </header>

      {/* 3-Column Layout Container */}
      <div className={styles.threeColumnLayout}>
        {/* Left Sidebar - Top Astrologers (Desktop Only) */}
        <aside className={styles.leftSidebar}>
          {topAstrologers.length > 0 && (
          <section className={styles.astrologersSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sidebarTitle}>TOP ASTROLOGERS</h3>
              <div className={styles.titleDivider}>
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerMoon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="4"
                    height="5"
                    viewBox="0 0 4 5"
                    fill="none"
                  >
                    <path
                      d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                      fill="#0002"
                    />
                  </svg>
                </span>
                <div className={styles.dividerLine}></div>
              </div>
            </div>
            <div className={styles.astrologersGrid}>
              {topAstrologers.slice(0, 3).map((astrologer) => (
                <div key={astrologer._id} className={styles.astrologerCard}>
                  <AstrologerLiveBadge
                    astrologerId={astrologer?._id}
                    initialStatus={astrologer?.astrologerLiveStatus}
                  />
                  <Link
                    to={getAstrologerProfilePath(astrologer)}
                    className={styles.cardLink}
                  >
                    <div className={styles.astrologerImageWrapper}>
                      <img
                        src={getAstrologerImageUrl(astrologer, "small")}
                        alt={astrologer.firstName}
                        className={styles.astrologerImg}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>

                    <div className={styles.rightSideContent}>
                      <div className={styles.ratingBadge}>
                        <span className={styles.star}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="21"
                            viewBox="0 0 12 13"
                            fill="none"
                          >
                            <g clipPath={`url(#${starClipId})`}>
                              <path
                                d="M5.94187 1.3447C6.09954 0.919606 6.69621 0.919606 6.85438 1.3447L7.87429 4.2327C7.90988 4.32678 7.97253 4.40762 8.05399 4.46454C8.13545 4.52146 8.23188 4.55179 8.33055 4.55152H10.837C11.3001 4.55152 11.5021 5.14081 11.138 5.42941L9.35441 7.06984C9.27451 7.13262 9.21612 7.21967 9.18762 7.31848C9.15912 7.41729 9.16196 7.52279 9.19575 7.61984L9.84712 10.4419C10.0058 10.8952 9.49237 11.2845 9.10411 11.0055L6.68143 9.43404C6.59847 9.37443 6.49953 9.34245 6.39812 9.34245C6.29672 9.34245 6.19778 9.37443 6.11481 9.43404L3.69214 11.0055C3.30437 11.2845 2.79047 10.8947 2.94912 10.4419L3.60049 7.61984C3.63428 7.52279 3.63713 7.41729 3.60863 7.31848C3.58012 7.21967 3.52173 7.13262 3.44184 7.06984L1.65821 5.42941C1.2936 5.14081 1.4966 4.55152 1.95877 4.55152H4.46521C4.56389 4.55186 4.66035 4.52156 4.74182 4.46463C4.82329 4.4077 4.88594 4.32682 4.92146 4.2327L5.94138 1.3447H5.94187Z"
                                fill="#FFB246"
                                stroke="#FFB246"
                                strokeWidth="0.985428"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </g>
                            <defs>
                              <clipPath id={starClipId}>
                                <rect
                                  width="11.8251"
                                  height="12.0879"
                                  fill="white"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        </span>
                        <span className={styles.ratingText}>
                          {astrologer.rating
                            ? Number(astrologer.rating).toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                      <h3 className={styles.astrologerNames}>
                        {getAstrologerDisplayName(astrologer)}
                      </h3>
                      {astrologer.experience && (
                        <div className={styles.experienceRow}>
                          <BookOpen size={18} className={styles.bookIcon} />
                          <span className={styles.experienceText}>
                            {astrologer.experience} years exp.
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <TopAstrologerActions
                    astrologer={astrologer}
                    onChat={handleChatStart}
                    onCall={handleCallStart}
                  />
                </div>
              ))}
            </div>
          </section>
          )}
        </aside>

        {/* Center Column - Existing Profile Content */}
        <div className={styles.centerColumn}>
          <div className={styles.profileContentMain}>
            {/* Profile Card */}
            <div className={styles.profileCard}>
              {/* This used to navigate to /live/<liveRoomId || astrologerId>,
                  so on a missing roomId it sent the visitor to a room that does
                  not exist. Shares the one handler now, so all five join
                  controls behave identically. */}
              {isLive && (
                <button
                  className={styles.liveIndicator}
                  onClick={handleJoinLive}
                  aria-label="Astrologer is live, click to watch"
                >
                  <span className={styles.liveDot}></span>
                  {joiningLive ? "OPENING…" : "LIVE"}
                </button>
              )}
              {/*
                The portrait is the largest, most obvious thing on the page and
                had no handler at all — a click on it did nothing. The lightbox
                it should open still exists further down (`imagePreview`, the
                overlay near the end of this file), but its only trigger was the
                video/photo gallery, which is commented out at the bottom of the
                About section. So the whole preview feature was unreachable dead
                code while the one element everyone clicks sat inert on top of it.

                A <button> rather than an onClick on the <img>: this is now a
                real control and has to be reachable by keyboard.
              */}
              <button
                type="button"
                className={styles.profileImageWrapper}
                onClick={() => setImagePreview(displayData.imageUrl)}
                aria-label={`View larger photo of ${getAstrologerDisplayName(displayData)}`}
              >
                <img
                  src={displayData.imageUrl}
                  alt={getAstrologerDisplayName(displayData)}
                  className={styles.profileImage}
                  onError={(e) => {
                    e.target.src = getAstrologerDefaultImage(data?.gender);
                  }}
                />
              </button>
              <div className={styles.profileInfo}>
                <h1 className={styles.astrologerName}>
                  {getAstrologerDisplayName(displayData)}
                </h1>
                {/* Linked tags when the API gave us slugs, plain text otherwise.
                    See expertiseTags above. */}
                {displayData.expertiseTags.length > 0 ? (
                  <p className={styles.expertise}>
                    {displayData.expertiseTags.map((tag, i) => (
                      <React.Fragment key={tag.slug}>
                        {i > 0 && <span aria-hidden="true"> • </span>}
                        <Link
                          to={`/astrologers/${tag.slug}`}
                          className={styles.expertiseTagLink}
                          title={`See astrologers for ${tag.title}`}
                        >
                          {tag.title}
                        </Link>
                      </React.Fragment>
                    ))}
                  </p>
                ) : (
                  <p className={styles.expertise}>
                    {displayData.expertise.join(" • ")}
                  </p>
                )}
                <div className={styles.languages}>
                  {displayData.languagePreference.map((lang, i) => (
                    <span key={i} className={styles.languageTag}>
                      {typeof lang === "object" ? lang.languageName : lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Status Indicator */}
            <div className={styles.mobileStatusBar}>
              {isLive ? (
                /* role/tabIndex/keydown: this is a div with an onClick, so it was
                   unreachable by keyboard — the one actionable element in the
                   status bar could only be triggered with a pointer. */
                <div
                  className={styles.mobileStatusLive}
                  role="button"
                  tabIndex={0}
                  aria-label="Astrologer is live, watch the session"
                  onClick={handleJoinLive}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleJoinLive();
                    }
                  }}
                >
                  <Radio size={20} />
                  <span>{joiningLive ? "Opening…" : "Live Now"}</span>
                </div>
              ) : data?.isActive ? (
                <button
                  type="button"
                  className={`${styles.mobileStatusAvailable} ${styles.statusCardBtn}`}
                  onClick={revealConnectOptions}
                  aria-label="Astrologer is available now. Show the connect options"
                >
                  <div className={styles.mobileStatusDot}></div>
                  <span>Available Now</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.mobileStatusOffline} ${styles.statusCardBtn}`}
                  onClick={handleOfflineStatusClick}
                  aria-label="Astrologer is offline. Show the consultation hours"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="16" fill="#E0E0E0"/>
                    <path d="M8.34093 7.78665C8.27892 7.72514 8.19507 7.69071 8.10773 7.69089C8.02038 7.69107 7.93667 7.72584 7.87491 7.7876C7.81315 7.84936 7.77838 7.93307 7.7782 8.02042C7.77802 8.10776 7.81245 8.19161 7.87396 8.25362L12.0833 12.4597H12.0537C11.1357 12.4621 10.2527 12.8127 9.58315 13.4408C8.91357 14.0688 8.50724 14.9276 8.44616 15.8436C7.91479 15.9992 7.45737 16.3412 7.15783 16.8069C6.8583 17.2726 6.73676 17.8306 6.81551 18.3787C6.89426 18.9268 7.16802 19.428 7.58656 19.7905C8.00509 20.153 8.54032 20.3524 9.09401 20.3521H19.9758L23.6589 24.0386C23.7213 24.0997 23.8051 24.134 23.8924 24.134C23.9797 24.134 24.0636 24.0997 24.1259 24.0386C24.1875 23.9765 24.2221 23.8926 24.2221 23.8051C24.2221 23.7176 24.1875 23.6337 24.1259 23.5716L8.34093 7.78665Z" fill="#BDBDBD"/>
                    <path d="M23.1163 15.1497C23.355 14.1247 23.2354 13.0488 22.7774 12.1013C22.3194 11.1537 21.5507 10.3916 20.5992 9.94179C19.6478 9.492 18.5709 9.38168 17.548 9.62918C16.5251 9.87669 15.6178 10.4671 14.9772 11.3021C14.6598 11.1658 14.3119 11.1164 13.9691 11.1592C13.6264 11.202 13.3012 11.3353 13.0271 11.5455L21.8338 20.3521H22.577C23.2276 20.3526 23.8553 20.1118 24.3387 19.6762C24.822 19.2407 25.1267 18.6414 25.1938 17.9942C25.2609 17.3471 25.0856 16.698 24.7019 16.1726C24.3181 15.6472 23.7532 15.2827 23.1163 15.1497Z" fill="#BDBDBD"/>
                  </svg>
                  <span>Offline</span>
                </button>
              )}
            </div>

            {/* Stats Section */}
            <div className={styles.statsSection}>
              <div className={styles.statItem}>
                <img
                  src={ExperienceIcon}
                  alt="Experience"
                  className={styles.statIcon}
                />
                <div className={styles.statValue}>
                  {displayData.experience}+
                </div>
                <div className={styles.statLabel}>Experience</div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <img
                  src={ConsultationsIcon}
                  alt="Consultations"
                  className={styles.statIcon}
                />
                <div className={styles.statValue}>
                  {displayData.totalConsultations}
                </div>
                <div className={styles.statLabel}>Consultations</div>
              </div>
              <div className={styles.statDivider}></div>
              {/*
                The Rating tile jumps to the reviews.

                All three tiles here look like the interactive tiles used
                elsewhere in the app, and none of them did anything. Experience
                and Consultations have nowhere to go, so they stay as the figures
                they are — but Rating is a summary of a section that is on this
                same page, and a rating summary that scrolls to the reviews is the
                standard behaviour. It is the one of the three worth a handler
                rather than an explanation.
              */}
              <button
                type="button"
                className={`${styles.statItem} ${styles.statItemLink}`}
                onClick={() =>
                  reviewsSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                aria-label={`Rating ${Number(displayData.rating).toFixed(1)} out of 5. Jump to reviews`}
              >
                <img
                  src={RatingIcon}
                  alt=""
                  className={styles.statIcon}
                />
                <div className={styles.statValue}>
                  {Number(displayData.rating).toFixed(1)}
                </div>
                <div className={styles.statLabel}>Rating</div>
              </button>
            </div>

            {/* Consultation Hours */}
            <div className={styles.consultationHours} ref={hoursSectionRef}>
              <div className={styles.hoursHeader}>
                <img src={TimeIcon} alt="Time" className={styles.clockIcon} />
                <span className={styles.hoursTitle}>Consultation Hours</span>
              </div>
              <div className={styles.weeklySchedule}>
                {displayData.weeklySchedule.map((item, index) => (
                  <div key={index} className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>{item.day}:</span>
                    <span
                      className={`${styles.scheduleTime} ${!item.time ? styles.offline : ""}`}
                    >
                      {item.time || "Offline"}
                    </span>
                  </div>
                ))}
              </div>
              {hasConsultationHours && (
                <button
                  type="button"
                  className={styles.reminderBtnFull}
                  onClick={handleSetReminder}
                >
                  <img
                    src={NotificationIcon}
                    alt=""
                    className={styles.notificationIcon}
                  />
                  Set Reminder
                </button>
              )}
            </div>

            {/* Minutes Section — see revealConnectOptions for why these are
                buttons that point at the connect controls rather than figures. */}
            <div className={styles.minutesSection}>
              <button
                type="button"
                className={`${styles.minuteItem} ${styles.minuteItemLink}`}
                onClick={revealConnectOptions}
                aria-label={`${displayData.metrics.chatMinutes} chat minutes delivered. Show the connect options`}
              >
                <img
                  src={ChatMinutesIcon}
                  alt=""
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.chatMinutes}
                </div>
                <div className={styles.minuteLabel}>Chat Minutes</div>
              </button>
              <div className={styles.minuteDivider}></div>
              <button
                type="button"
                className={`${styles.minuteItem} ${styles.minuteItemLink}`}
                onClick={revealConnectOptions}
                aria-label={`${displayData.metrics.audioMinutes} call minutes delivered. Show the connect options`}
              >
                <img
                  src={CallMinutesIcon}
                  alt=""
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.audioMinutes}
                </div>
                <div className={styles.minuteLabel}>Call Minutes</div>
              </button>
              <div className={styles.minuteDivider}></div>
              <button
                type="button"
                className={`${styles.minuteItem} ${styles.minuteItemLink}`}
                onClick={revealConnectOptions}
                aria-label={`${displayData.metrics.videoMinutes} video minutes delivered. Show the connect options`}
              >
                <img
                  src={VideoMinutesIcon}
                  alt=""
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.videoMinutes}
                </div>
                <div className={styles.minuteLabel}>Video Minutes</div>
              </button>
            </div>

            {/* About Section */}
            {displayData.description && (
            <div className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>About</h3>

              {displayData.description && (
              /*
                The clamped paragraph now expands on click. Text cut off
                mid-sentence is itself the affordance — people click the words,
                not the 85x22px "Read More" underneath it — and that click used
                to do nothing. Only wired while it is actually truncated and
                collapsed, so an untruncated or already-expanded paragraph stays
                plain text and remains selectable.

                No role/tabIndex here on purpose: the button below is the
                keyboard- and screen-reader-facing control, and duplicating it
                onto the paragraph would just add a second stop announcing the
                whole description as a button label.
              */
              <p
                ref={aboutTextRef}
                className={`${styles.aboutText} ${
                  showFullAbout ? styles.expanded : ""
                } ${isAboutTruncated && !showFullAbout ? styles.aboutTextClickable : ""}`}
                onClick={
                  isAboutTruncated && !showFullAbout
                    ? () => setShowFullAbout(true)
                    : undefined
                }
              >
                {displayData.description}
              </p>
              )}

              {isAboutTruncated && !showFullAbout && (
                <button
                  className={styles.readMoreBtn}
                  aria-expanded={false}
                  onClick={() => setShowFullAbout((prev) => !prev)}
                >
                  Read More
                </button>
              )}

              {showFullAbout && (
                <button
                  className={styles.readMoreBtn}
                  aria-expanded={true}
                  onClick={() => setShowFullAbout((prev) => !prev)}
                >
                  Read Less
                </button>
              )}

              {/* Video Gallery - Hidden */}
              {/* {displayData.gallery.length > 0 && (
                <div className={styles.videoGallery}>
                  {displayData.gallery.slice(0, 3).map((video, index) => (
                    <div
                      key={index}
                      className={styles.videoThumbnail}
                      onClick={() =>
                        setImagePreview(video || AstrologerNumerologyDefault)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={video || AstrologerNumerologyDefault}
                        alt={`Gallery ${index + 1}`}
                        onError={(e) => {
                          e.target.src = AstrologerNumerologyDefault;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )} */}
            </div>
            )}

            {/* Send a Gift Section */}
            {/* <div className={styles.giftSection}>
              <div className={styles.giftContent}>
                <h3 className={styles.giftTitle}>Send a Gift</h3>
                <p className={styles.giftSubtitle}>
                  Show your appreciation to your favorite astrologer.
                </p>
               <button
                  className={styles.sendNowBtn}
                  onClick={() => {
                    if (!token) {
                      navigate("/login", { state: { from: location.pathname } });
                      return;
                    }
                    setIsGiftModalOpen(true);
                  }}
                >
                  Send Now
                </button>
              </div>
              <div className={styles.giftImage}>
                <img src={SendGiftImage} alt="Send Gift" />
              </div>
            </div> */}

            {/* Astrologer voice intro */}
            {data?.voiceNoteUrl && (
              <AudioIntro
                name={getAstrologerDisplayName(displayData)}
                src={data.voiceNoteUrl}
                isNew
              />
            )}

            {/* User Reviews — scroll target for the Rating tile above. */}
            <div className={styles.reviewsSection} ref={reviewsSectionRef}>
              <div className={styles.devider}>
                <h3 className={styles.sectionTitle}>USER REVIEWS</h3>
                <div className={styles.titleDivider}>
                  <div className={styles.dividerLine}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="93"
                      height="1"
                      viewBox="0 0 93 1"
                      fill="none"
                    >
                      <path
                        d="M92.803 0.406393C92.803 0.630933 90.7481 0.812789 88.2131 0.812789C85.6781 0.812789 0 0.630933 0 0.406393C0 0.181853 85.6786 0 88.2131 0C90.7481 0 92.803 0.181853 92.803 0.406393Z"
                        fill="#0002"
                      />
                    </svg>
                  </div>
                  <span className={styles.dividerMoon}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="5"
                      viewBox="0 0 4 5"
                      fill="none"
                    >
                      <path
                        d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                        fill="#0002"
                      />
                    </svg>
                  </span>
                  <div className={styles.dividerLine}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="93"
                      height="1"
                      viewBox="0 0 93 1"
                      fill="none"
                    >
                      <path
                        d="M-4.06066e-06 0.406393C-4.06066e-06 0.630933 2.05498 0.812789 4.58996 0.812789C7.12494 0.812789 92.803 0.630933 92.803 0.406393C92.803 0.181853 7.12439 0 4.58996 0C2.05498 0 -4.06066e-06 0.181853 -4.06066e-06 0.406393Z"
                        fill="#0002"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className={styles.reviewsSummary}>
                {/*
                  Five 30px stars sitting immediately above a "Share a Review"
                  button read as a rating input — that is what a row of stars means
                  everywhere else — and this row was display-only. Session replay
                  shows a visitor clicking around the ratings for a long stretch on
                  this page.

                  It now opens the same review modal the button below opens, so the
                  affordance resolves to the action people are reaching for. Same
                  gating as that button, including the sign-in requirement: this is
                  a second trigger for one action, not a new behaviour.
                */}
                <button
                  type="button"
                  className={styles.rateTrigger}
                  onClick={handleOpenReviewModal}
                  aria-busy={openingReview}
                  aria-label={`Rate ${getAstrologerDisplayName(data)}. Average rating ${averageRating.toFixed(1)} out of 5`}
                >
                  <StarRating rating={averageRating} />
                </button>
                <p className={styles.reviewsCount}>
                  {averageRating.toFixed(1)} out of 5 • {totalReviews} total
                  ratings
                </p>
              </div>

              {reviewsLoading ? (
                <div className={styles.reviewsLoading}>Loading reviews...</div>
              ) : allReviews.length > 0 ? (
                <div ref={reviewsListRef} className={`${styles.reviewsList} ${styles.scrollable}`}>
                  {allReviews.map((review) => (
                    <div key={review._id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewDate}>
                          <IoCalendarOutline className={styles.calendarIcon} />
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-GB",
                          )}
                        </span>
                        <div className={styles.reviewRating}>
                          <FaStar className={styles.reviewStar} />
                          <span>{Number(review.rating).toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className={styles.reviewerName}>
                        {review.isAnonymous
                          ? "Anonymous"
                          : review.customerName
                              ?.toLowerCase()
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h4>
                      {review.review && (
                        <p className={styles.reviewText}>{review.review}</p>
                      )}
                    </div>
                  ))}
                  {loadingMore && (
                    <div className={styles.reviewsLoading}>Loading more...</div>
                  )}

                  {/*
                    Pagination was scroll-only: handleLoadMoreReviews existed but
                    nothing rendered a control for it, so more reviews arrived
                    only by scrolling this inner `max-height: 500px` box. A nested
                    scroller inside the page scroller is easy to miss on a phone
                    and worse in an in-app browser, so page 2 onwards was
                    effectively unreachable — visitors read the first few reviews
                    and tapped at them instead. An explicit control also gives the
                    keyboard a way to reach the rest.
                  */}
                  {!loadingMore && reviewPage < reviewTotalPages && (
                    <button
                      type="button"
                      className={styles.loadMoreReviewsBtn}
                      onClick={handleLoadMoreReviews}
                    >
                      Load more reviews
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.noReviews}>
                  No reviews yet. Be the first to review!
                </div>
              )}

              {/* Not `disabled` while opening: a disabled button fires no click,
                  so a second tap would be swallowed rather than refused. The
                  handler returns early instead, and the label reports the wait. */}
              <button
                className={styles.shareReviewBtn}
                onClick={handleOpenReviewModal}
                aria-busy={openingReview}
              >
                {openingReview ? "Opening…" : "Share a Review"}
              </button>
            </div>

            {/* Astrologer Shop */}
            {/* <div className={styles.shopSection}>
              <div className={styles.shopHeader}>
                <h3 className={styles.sectionTitle}>
                  Check out Astrologers Shop
                </h3>
                <FaChevronRight className={styles.chevronIcon} />
              </div>
              <div className={styles.productGrid}>
                {displayData.products.slice(0, 3).map((product, index) => (
                  <div key={index} className={styles.productCard}>
                    {product.isPopular && (
                      <div className={styles.productBadge}>
                        <FaStar className={styles.badgeStar} />
                        Most Popular
                      </div>
                    )}
                    <div className={styles.productImage}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <img src={AstrologerShopImage} alt={product.name} />
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h4 className={styles.productName}>{product.name}</h4>
                      <p className={styles.productDesc}>
                        {product.description}
                      </p>
                      <div className={styles.productPrice}>
                        <span className={styles.currentPrice}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className={styles.originalPrice}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <button className={styles.addToCartBtn}>
                        + Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
        {/* End Center Column */}

        {/* Right Sidebar - Available Now & Connect (Desktop Only) */}
        <aside className={styles.rightSidebar}>
          {/* Available Now / Offline / Live Card */}
          {isLive ? (
            /* Same as the mobile status bar: a div with onClick is invisible to
               the keyboard. The inner "Join" button was the only reachable
               control, so the surrounding card — which is what the eye reads as
               the target — did nothing unless clicked with a pointer. */
            <div
              className={styles.liveCard}
              role="button"
              tabIndex={0}
              aria-label="Astrologer is live, watch the session"
              onClick={handleJoinLive}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleJoinLive();
                }
              }}
            >
              <div className={styles.liveLeft}>
                <svg className={styles.liveIcon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="4" fill="white"/>
                  <path d="M10.5 21.5C8.5 19.5 7.5 17 7.5 14.5C7.5 12 8.5 9.5 10.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M21.5 7.5C23.5 9.5 24.5 12 24.5 14.5C24.5 17 23.5 19.5 21.5 21.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M13 19C11.5 17.5 11 16 11 14.5C11 13 11.5 11.5 13 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M19 10C20.5 11.5 21 13 21 14.5C21 16 20.5 17.5 19 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className={styles.liveText}>Live Now</span>
              </div>
              <button className={styles.joinLiveSidebarBtn} aria-busy={joiningLive} onClick={(e) => { e.stopPropagation(); handleJoinLive(); }}>
                Join
              </button>
            </div>
          ) : data?.isActive ? (
            <button
              type="button"
              className={`${styles.availableCard} ${styles.statusCardBtn}`}
              onClick={revealConnectOptions}
              aria-label="Astrologer is available now. Show the connect options"
            >
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>Available Now</span>
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.offlineCard} ${styles.statusCardBtn}`}
              onClick={handleOfflineStatusClick}
              aria-label="Astrologer is offline. Show the consultation hours"
            >
              <div className={styles.offlineIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="16" fill="#E0E0E0"/>
                  <path d="M8.34093 7.78665C8.27892 7.72514 8.19507 7.69071 8.10773 7.69089C8.02038 7.69107 7.93667 7.72584 7.87491 7.7876C7.81315 7.84936 7.77838 7.93307 7.7782 8.02042C7.77802 8.10776 7.81245 8.19161 7.87396 8.25362L12.0833 12.4597H12.0537C11.1357 12.4621 10.2527 12.8127 9.58315 13.4408C8.91357 14.0688 8.50724 14.9276 8.44616 15.8436C7.91479 15.9992 7.45737 16.3412 7.15783 16.8069C6.8583 17.2726 6.73676 17.8306 6.81551 18.3787C6.89426 18.9268 7.16802 19.428 7.58656 19.7905C8.00509 20.153 8.54032 20.3524 9.09401 20.3521H19.9758L23.6589 24.0386C23.7213 24.0997 23.8051 24.134 23.8924 24.134C23.9797 24.134 24.0636 24.0997 24.1259 24.0386C24.1875 23.9765 24.2221 23.8926 24.2221 23.8051C24.2221 23.7176 24.1875 23.6337 24.1259 23.5716L8.34093 7.78665Z" fill="#BDBDBD"/>
                  <path d="M23.1163 15.1497C23.355 14.1247 23.2354 13.0488 22.7774 12.1013C22.3194 11.1537 21.5507 10.3916 20.5992 9.94179C19.6478 9.492 18.5709 9.38168 17.548 9.62918C16.5251 9.87669 15.6178 10.4671 14.9772 11.3021C14.6598 11.1658 14.3119 11.1164 13.9691 11.1592C13.6264 11.202 13.3012 11.3353 13.0271 11.5455L21.8338 20.3521H22.577C23.2276 20.3526 23.8553 20.1118 24.3387 19.6762C24.822 19.2407 25.1267 18.6414 25.1938 17.9942C25.2609 17.3471 25.0856 16.698 24.7019 16.1726C24.3181 15.6472 23.7532 15.2827 23.1163 15.1497Z" fill="#BDBDBD"/>
                </svg>
              </div>
              <span className={styles.offlineText}>Offline</span>
            </button>
          )}

          {/* Connect Now Card — hidden when astrologer is live streaming */}
          {!isLive && <div
            ref={connectCardRef}
            className={`${styles.connectCard} ${connectPulse ? styles.connectPulse : ""}`}
          >
            <h3 className={styles.connectTitle}>CONNECT NOW</h3>
            <div className={styles.titleDivider}>
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerMoon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="5"
                  viewBox="0 0 4 5"
                  fill="none"
                >
                  <path
                    d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                    fill="#0002"
                  />
                </svg>
              </span>
              <div className={styles.dividerLine}></div>
            </div>

            {!data?.isActive && data?.isEmergencyAvailable && (
              data?.emergencyPrice?.chatRate?.amount > 0 || data?.emergencyPrice?.audioRate?.amount > 0
            ) ? (
              <div className={styles.emergencySection}>
                <button
                  className={styles.emergencyBtn}
                  onClick={() => setShowEmergencyModal(true)}
                >
                  Emergency{(() => {
                    const eChatRate = Number(data?.emergencyPrice?.chatRate?.amount) || 0;
                    const eCallRate = Number(data?.emergencyPrice?.audioRate?.amount) || 0;
                    const minRate = eChatRate > 0 && eCallRate > 0 ? Math.min(eChatRate, eCallRate) : eChatRate || eCallRate;
                    return minRate > 0 ? ` - ₹${minRate}/min` : '';
                  })()}
                </button>
                <p className={styles.emergencyDesc}>
                  Astrologer is offline, only emergency sessions available.
                </p>
              </div>
            ) : (
              <div className={styles.connectOptions}>
                <button
                  type="button"
                  className={`${styles.connectOption} ${!connectTiles.chat.enabled ? styles.connectOptionDisabled : ""}`}
                  onClick={() => {
                    if (!connectTiles.chat.enabled) {
                      reportBlocked(connectTiles.chat.reason);
                      return;
                    }
                    handleChatStart(data);
                  }}
                  aria-disabled={!connectTiles.chat.enabled}
                  title={!connectTiles.chat.enabled ? connectTiles.chat.reason : "Start chat"}
                >
                  <div className={styles.optionIcon}>
                    <BiMessageDetail />
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>Chat</span>
                    <span className={styles.optionPrice}>
                      ₹{data?.price?.chatRate?.amount || 0}/ min
                      {data?.price?.chatRate?.isDiscountActive && data?.price?.chatRate?.beforeDiscountPrice && (
                        <span className={styles.originalPrice}>₹{data?.price?.chatRate?.beforeDiscountPrice}/ min</span>
                      )}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`${styles.connectOption} ${!connectTiles.audio.enabled ? styles.connectOptionDisabled : ""}`}
                  onClick={() => {
                    if (!connectTiles.audio.enabled) {
                      reportBlocked(connectTiles.audio.reason);
                      return;
                    }
                    handleCallStart(data, "audio");
                  }}
                  aria-disabled={!connectTiles.audio.enabled}
                  title={!connectTiles.audio.enabled ? connectTiles.audio.reason : "Start audio call"}
                >
                  <div className={styles.optionIcon}>
                    <BiPhone />
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>Audio Call</span>
                    <span className={styles.optionPrice}>
                      ₹{data?.price?.audioRate?.amount || 0}/ min
                      {data?.price?.audioRate?.isDiscountActive && data?.price?.audioRate?.beforeDiscountPrice && (
                        <span className={styles.originalPrice}>₹{data?.price?.audioRate?.beforeDiscountPrice}/ min</span>
                      )}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`${styles.connectOption} ${!connectTiles.video.enabled ? styles.connectOptionDisabled : ""}`}
                  onClick={() => {
                    if (!connectTiles.video.enabled) {
                      reportBlocked(connectTiles.video.reason);
                      return;
                    }
                    handleCallStart(data, "video");
                  }}
                  aria-disabled={!connectTiles.video.enabled}
                  title={!connectTiles.video.enabled ? connectTiles.video.reason : "Start video call"}
                >
                  <div className={styles.optionIcon}>
                    <BiVideo />
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>Video Call</span>
                    <span className={styles.optionPrice}>
                      ₹{data?.price?.videoCallRate?.amount || 0}/ min
                      {data?.price?.videoCallRate?.isDiscountActive && data?.price?.videoCallRate?.beforeDiscountPrice && (
                        <span className={styles.originalPrice}>₹{data?.price?.videoCallRate?.beforeDiscountPrice}/ min</span>
                      )}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* role="status" so the reason is announced as well as seen. See
                reportBlocked. */}
            {blockedNote && (
              <p key={blockedNote.seq} className={styles.connectBlockedNote} role="status">
                {blockedNote.text}
              </p>
            )}
          </div>}

          {/* Consultation Hours Card */}
          <div className={styles.consultationCard}>
            <div className={styles.hoursHeader}>
              <img src={TimeIcon} alt="Time" className={styles.clockIcon} />
              <span className={styles.hoursTitle}>Consultation Hours</span>
            </div>

            <div className={styles.weeklySchedule}>
              {displayData.weeklySchedule.map((item, index) => (
                <div key={index} className={styles.scheduleRow}>
                  <span className={styles.scheduleDay}>{item.day}:</span>
                  <span
                    className={`${styles.scheduleTime} ${!item.time ? styles.offline : ""}`}
                  >
                    {item.time || "Offline"}
                  </span>
                </div>
              ))}
            </div>
            {hasConsultationHours && (
              <button
                type="button"
                className={styles.reminderBtnFull}
                onClick={handleSetReminder}
              >
                <img
                  src={NotificationIcon}
                  alt=""
                  className={styles.notificationIcon}
                />
                Set Reminder
              </button>
            )}
          </div>
        </aside>
      </div>
      {/* End 3-Column Layout */}

      {/* Mobile Bottom Bar - Chat & Call */}
      <div
        ref={mobileBottomBarRef}
        className={`${styles.mobileBottomBar} ${connectPulse ? styles.connectPulse : ""}`}
      >
        {isLive ? (
          <button
            className={styles.mobileJoinLiveBtn}
            onClick={handleJoinLive}
          >
            <Radio size={18} />
            <span>Join Live Session</span>
          </button>
        ) : !data?.isActive && data?.isEmergencyAvailable && (
          data?.emergencyPrice?.chatRate?.amount > 0 || data?.emergencyPrice?.audioRate?.amount > 0
        ) ? (
          <button
            className={styles.mobileEmergencyBtn}
            onClick={() => setShowEmergencyModal(true)}
          >
            Emergency{(() => {
              const eChatRate = Number(data?.emergencyPrice?.chatRate?.amount) || 0;
              const eCallRate = Number(data?.emergencyPrice?.audioRate?.amount) || 0;
              const minRate = eChatRate > 0 && eCallRate > 0 ? Math.min(eChatRate, eCallRate) : eChatRate || eCallRate;
              return minRate > 0 ? ` - ₹${minRate}/min` : '';
            })()}
          </button>
        ) : (
          <button
            className={styles.mobileConnectBtn}
            onClick={() => {
              if (!data?.isActive) {
                /*
                  Was `toast.error("This astrologer is currently offline. Please
                  try again later.")` — a dead end that told the visitor to come
                  back later and nothing else. The shared helper in
                  astrologerAvailability.js is the single source of this wording
                  and names the alternative ("Try another astrologer or check back
                  soon"), which is what the desktop connect tiles already show. A
                  session recording has a visitor tapping this button repeatedly
                  across twelve minutes while the astrologer stayed offline, so
                  the two copies disagreeing was costing the one hint that goes
                  anywhere. `info` rather than `error`: nothing failed.
                */
                toast.info(
                  unavailableReason({
                    label: "Chat",
                    isOnline: false,
                    isLive,
                    isTypeActive: true,
                    hasPrice: true,
                  }),
                );
                return;
              }
              setShowMobileConnectPopup(true);
            }}
          >
            {data?.isActive ? "Connect Now" : "Currently Offline"}
          </button>
        )}
      </div>

      {/* Guest call/video flow (AI Wow-style details + OTP, then initiate call) */}
      {guestConnectModal}

      {/* Mobile Connect Popup */}
      <ConnectAstrologerPopup
        isOpen={showMobileConnectPopup}
        onClose={() => setShowMobileConnectPopup(false)}
        astrologer={data}
        onChatStart={handleChatStart}
        onCallStart={handleCallStart}
      />

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={data}
        onChatNow={(astro) => handleChatStart(astro, true)}
        onCallNow={(astro) => handleCallStart(astro, "audio", true)}
        onVideoNow={(astro) => handleCallStart(astro, "video", true)}
      />

      {/* Modals */}
      {/* ConnectAstrologerPopup - No longer needed, direct connection from sidebar */}
      {/* <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={data}
        onChatStart={handleChatStart}
        onCallStart={handleCallStart}
      /> */}

      {/* Profile Manager Modal for Kundli Selection */}
      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        title="Select Profile to Continue"
        startCallMode={true}
        callModeBtnTitle="Continue"
        onStartCall={handleProfileManagerStartCall}
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Recharge Modal */}
      <RechargeModal
        astrologer={data}
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
      />

      {/*
        StickyReview intentionally NOT rendered here.

        It reads `openReview`/`reviewData` from CallContext and renders
        FeedbackModal, and HomeLayout already renders one for every
        header/footer route — which this one is (see PROFILE_ASTROLOGER in
        Paths.js). Rendering a second copy mounted two identical
        `position: fixed; z-index: 99999` modals on top of each other whenever
        "Share a Review" was tapped: only the last one in the DOM received
        clicks, so the other was a fully-rendered, unreachable duplicate — with
        duplicated star inputs and submit buttons in the accessibility tree.

        Removing it here changes nothing about the flow: setOpenReview(true) in
        handleOpenReviewModal still opens the layout's instance.
      */}

      {/* Waiting Modal — commented out to avoid duplicate with FooterWaiting */}
      {/* {(WaitingList || callWaitingList) && (
        <WaitingModal
          callRoomId={connectionType === "chat" ? chatRoomId : callRoomId}
          resetCallState={resetCallState}
          connectionType={connectionType}
          astrologerName={getAstrologerDisplayName(data)}
        />
      )} */}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        astrologerId={data?._id}
        astrologerName={getAstrologerDisplayName(data)}
      />

      {/* Virtual Assistant Chat */}
      <VirtualAssistant
        astrologerId={data?._id}
        astrologerName={getAstrologerDisplayName(data)}
        astrologerImage={getAstrologerImageUrl(data)}
        isOpen={isVAOpen}
        setIsOpen={setIsVAOpen}
        onConnect={() => handleChatStart(data)}
      />

      {/* Image Preview Lightbox */}
      {imagePreview && (
        <div
          className={styles.imagePreviewOverlay}
          onClick={() => setImagePreview(null)}
          onKeyDown={(e) => e.key === "Escape" && setImagePreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          tabIndex={-1}
        >
          <button
            className={styles.imagePreviewClose}
            onClick={() => setImagePreview(null)}
            aria-label="Close preview"
          >
            &times;
          </button>
          <img
            src={imagePreview}
            alt="Preview"
            className={styles.imagePreviewImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AstrologerProfile;
