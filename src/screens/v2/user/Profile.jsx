import {
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Filter,
  ArrowUpDown,
  Phone,
  Video,
  MessageCircle,
  Star,
  Trash2,
  FilterIcon,
  UserPlus,
  Download,
  Search,
  Mail,
  Calendar,
  Clock,
  X,
} from "lucide-react";
import { TiUserDelete } from "react-icons/ti";
import { LuPencilLine } from "react-icons/lu";
import { FaCheck, FaUser } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import { useGetTransactionsQuery, useGetInvoiceMutation } from "../../../services/appServices/transactionService";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetCallHistoryQuery } from "../../../redux/api/callHistory/callHistory";
import { useGetUserChatMessagesQuery } from "../../../redux/api/chatHistory/chatHistory";
import { useWalletBalance } from "../../private/wallet/useWalletBalance";
import { getUserFromStorage } from "../../../utils/authStorage";
import { useChat } from "../../../context/ChatContext";
import { useCall } from "../../../context/CallContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import ConnectAstrologerPopup from "../../private/v2/components/ui/ConnectAstrologerPopup";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import AddProfileModal from "../../../component/UI/Profile/AddProfileModal";
import EditProfileModal from "../../../component/UI/Profile/EditProfileModal";
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import SubscriptionModal from "../../../component/UI/modal/SubscriptionModal/SubscriptionModal";
import { useGetFollowedAstrologersQuery } from "../../../redux/api/astrologer/followedAstrologersApi";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useGetAstroDetailsQuery } from "../../../redux/api/kundli/kundliApi";
import { buildVedicParam } from "../../../utils/VedicParams.js/vedicParams";
import { PATH } from "../../../utils/routes/Paths";
import { PANDIT_AI_ID } from "../../../component/panditAI/usePanditAI";
import { logout, updateRegistrationStatus, setEmail } from "../../../redux/auth/authSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import styles from "./Profile.module.scss";
import MembershipCard from "./MembershipCard";
import { useGetSubscriptionStatusQuery, useCancelSubscriptionMutation } from "../../../redux/api/subscription/subscriptionApi";
import profileWallet from "../../../assets/images/profile-wallet.jpg";
import emailIconSet from "../../../assets/images/icon_set (1).png";
import { Toast } from "../../../component/index";
import StickyReview from "../../private/home/components/call/StickyReview";
import { trackEvent } from "../../../utils/analytics";
import { SUBSCRIPTION_EVENTS, trackSubscriptionEvent } from "../../../utils/subscriptionAnalytics";
import MallHistoryContent from "../../private/shubhAstroMallHistory/MallHistoryContent";
import { isShubhMallEnabled } from "../../../utils/featureConfig";
import {
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useEditKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import Pagination from "../../../component/pagination/Pagination";
import { ProfileManager } from "../../../component/UI/Profile";
import { registerUser, updateUserProfile } from "../../../services/appServices/authService";
import { useLogoutUserMutation } from "../../../redux/api/userSession/userSessionApi";
import { useSelector } from "react-redux";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { clearAllCalculatorData } from "../../../redux/calculator/calculatorSlice";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import useAstrologerLiveStatus from "../../../hooks/useAstrologerLiveStatus";
import {
  getAstrologerDisplayName,
  getAstrologerProfilePath,
} from "../../../utils/helper/string.utils";
import { getAstrologerImageUrl, getAstrologerDefaultImage } from "../../../utils/appImages";

// "Consult Again" button that disables in real time when the astrologer is live.
// Uses useAstrologerLiveStatus so it reacts to the live socket event even when
// the live status arrives after the initial render (the list data alone doesn't
// update reactively for socket-driven live changes).
const CONSULT_LIVE_BLOCKED_REASON =
  "This astrologer is in a live session right now. Join the live stream or try again once it ends.";

const ConsultAgainButton = ({ astrologer, seedLiveStatus, onConsultAgain }) => {
  const { isLive } = useAstrologerLiveStatus(astrologer?._id, seedLiveStatus);
  return (
    // Blocked-while-live was previously expressed twice over, both silently:
    // `disabled` meant the browser swallowed the tap, and the handler also
    // returned early without a word. The user got no response at all. Stay
    // tappable and explain — same treatment as the order-history button.
    <button
      className={`${styles.consultAgainButton} ${isLive ? styles.consultAgainBlocked : ""}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        if (isLive) {
          Toast.info(CONSULT_LIVE_BLOCKED_REASON);
          return;
        }
        onConsultAgain(astrologer);
      }}
      aria-disabled={isLive}
      title={isLive ? CONSULT_LIVE_BLOCKED_REASON : "Consult again"}
    >
      Consult Again
    </button>
  );
};

// Pulsing red dot shown on an order card when the astrologer is currently live.
// Renders nothing otherwise. Reactive via the live socket event.
const LiveDot = ({ astrologer, seedLiveStatus }) => {
  const { isLive } = useAstrologerLiveStatus(astrologer?._id, seedLiveStatus);
  if (!isLive) return null;
  return <span className={styles.orderLiveDot} title="Live now" aria-label="Astrologer is live" />;
};

const getAstrologerInitial = (name) =>
  (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 1);

// Order-history avatar (.astrologerAvatar is 60px, so the `small` 100x125
// derivative).
//
// The call/chat history endpoints flatten the astrologer onto each row and
// expose only `astrologerProfileImgUrl` — the unresized original (896x902 and
// 1433x1433 have both been observed) for a 60px circle. The derivatives live on
// the astrologer document, and their filenames are not derivable from the
// original (only the first path segment is shared; the second is random per
// size), so the sized variant has to be fetched.
//
// Resolving per row rather than in the list mapper because that needs a hook.
// RTK Query dedupes by argument, so repeat rows for the same astrologer share
// one request — the visible page is typically 3-5 unique astrologers, and any
// astrologer already loaded elsewhere (profile page, chat, order detail) is a
// cache hit. `order.astrologer._id` is the same id the card navigates to and
// that the order detail page feeds into this query.
//
// `astrologer.image` (the flat original) paints immediately and is swapped for
// the derivative when the query lands, so there's no blank avatar while waiting.
const OrderAstrologerAvatar = ({ astrologer }) => {
  const { data } = useGetAstrologerByIdQuery(
    { id: astrologer?._id },
    { skip: !astrologer?._id }
  );

  const fetched = data?.data;
  const hasImage = !!(fetched?.profileImages || fetched?.profileImgUrl || astrologer?.image);

  // Nothing to show at all — keep the initials circle rather than dropping in a
  // gendered placeholder for an astrologer who simply has no photo.
  if (!hasImage) {
    return <span>{getAstrologerInitial(astrologer?.name)}</span>;
  }

  return (
    <img
      src={getAstrologerImageUrl(
        {
          profileImages: fetched?.profileImages,
          profileImgUrl: fetched?.profileImgUrl || astrologer?.image,
          gender: fetched?.gender,
        },
        "small"
      )}
      alt={astrologer?.name}
      width={60}
      height={60}
      loading="lazy"
      decoding="async"
      // Covers a derivative that is listed but missing from S3.
      onError={(e) => {
        e.currentTarget.src = getAstrologerDefaultImage(fetched?.gender);
      }}
    />
  );
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation
  const navigationState = location.state || {};

  // Get isRegister from Redux auth state
  const isRegister = useSelector((state) => state.auth.isRegister);
  const userEmail = useSelector((state) => state.auth.email) || getUserFromStorage()?.email || "";

  const [activeTab, setActiveTab] = useState(() => {
    const navTab = navigationState.activeTab;
    // If navigated to a mall tab but mall is disabled, fallback to Profile
    if (navTab === "ShubhMall History" && !isShubhMallEnabled()) {
      return "Profile";
    }
    return navTab || "Profile";
  });
  const [orderHistoryTab, setOrderHistoryTab] = useState("call"); // Sub-tab for order history

  // Track profile screen view (once on mount)
  useEffect(() => {
    trackEvent("profile_viewed", { user_id: localStorage.getItem("shubhtalk_customer_id") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to tabs section when navigated with activeTab state
  useEffect(() => {
    if (navigationState.activeTab && orderListRef.current) {
      setTimeout(() => {
        const el = orderListRef.current;
        const headerOffset = 100;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementPosition - headerOffset, behavior: "smooth" });
      }, 300);
    }
  }, []);

  // Filter modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterActiveTab, setFilterActiveTab] = useState("Sort");
  const [filterSortOrder, setFilterSortOrder] = useState("desc");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const transactionListRef = useRef(null);
  const orderListRef = useRef(null); // Ref for order history scroll
  const user = getUserFromStorage();
  // const userName = user
  //   ? user.firstName && user.lastName
  //     ? `${user.firstName} ${user.lastName}`
  //     : user.phoneNumber || "Guest User"
  //   : "Guest User";
  const userId = localStorage.getItem("shubhtalk_customer_id");

  const { data: subscriptionStatus } = useGetSubscriptionStatusQuery(undefined, {
    skip: !userId,
    // Report generation consumes quota on the backend, so always pull a fresh
    // status when the account page mounts instead of showing stale cached data.
    refetchOnMountOrArgChange: true,
  });
  const [cancelSubscription, { isLoading: isCancellingSubscription }] = useCancelSubscriptionMutation();
  const activeSubscriptionId = subscriptionStatus?.data?.subscription?._id;
  const subData = subscriptionStatus?.data;
  const hasActiveSubscription = !!subData?.hasActiveSubscription;
  const subPlanName = subData?.plan?.name || subData?.subscription?.planName || subData?.subscription?.planCode || "Premium";
  const subEndDate = subData?.subscription?.subscriptionEndDate || subData?.subscription?.endDate || null;
  const subValidTill = subEndDate ? dayjs(subEndDate).format("DD MMM YYYY") : null;
  const subRemainingDays = subEndDate
    ? Math.max(0, dayjs(subEndDate).startOf("day").diff(dayjs().startOf("day"), "day"))
    : null;
  const subQuota = subData?.quota || null;
  const extQuota = subData?.extendedQuota || null;
  // Total generations = basic plan quota + any extended pack quota (combined).
  // Basic plan is always the primary; extended packs add on top of it.
  const combinedQuotaTotal = (Number(subQuota?.monthlyQuota) || 0) + (Number(extQuota?.monthlyQuota) || 0);
  const combinedQuotaUsed = (Number(subQuota?.usedQuota) || 0) + (Number(extQuota?.usedQuota) || 0);

  const handleCancelSubscription = () => {
    if (!activeSubscriptionId) {
      Toast.error("No active subscription to cancel.");
      return;
    }
    setShowCancelConfirm(true);
  };

  const handleConfirmCancelSubscription = async () => {
    try {
      const res = await cancelSubscription({ subscriptionId: activeSubscriptionId });
      const body = res?.data || res?.error?.data;
      if (body?.success) {
        // #10 SUBSCRIPTION_CANCELLED
        trackSubscriptionEvent(SUBSCRIPTION_EVENTS.CANCELLED, {
          subscription_id: activeSubscriptionId,
        });
        Toast.success(body?.message || "Subscription cancelled");
      } else {
        Toast.error(body?.message || "Failed to cancel subscription");
      }
    } catch {
      Toast.error("Failed to cancel subscription");
    } finally {
      setShowCancelConfirm(false);
    }
  };

  // Connect popup state
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [lastConnectionType, setLastConnectionType] = useState("chat");
  const [selectedAstrologerId, setSelectedAstrologerId] = useState(null);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const activeAstroRef = useRef(null);

  // Fetch latest astrologer details when selected
  const {
    data: latestAstrologerData,
    isLoading: isLoadingAstrologer,
    isFetching: isFetchingAstrologer,
    refetch: refetchAstrologer,
  } = useGetAstrologerByIdQuery(
    { id: selectedAstrologerId },
    { skip: !selectedAstrologerId, refetchOnMountOrArgChange: true }
  );

  // Update activeAstroRef when latest astrologer data is fetched
  useEffect(() => {
    if (latestAstrologerData?.data) {
      activeAstroRef.current = latestAstrologerData.data;
      setChatLastRequestedAstro(latestAstrologerData.data);
      setCallLastRequestedAstro(latestAstrologerData.data);
      console.log('✅ Updated activeAstroRef with latest pricing:', latestAstrologerData.data.price);
    }
  }, [latestAstrologerData]);

  // Get contexts
  const {
    waitingList: WaitingList,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setActiveChat,
    setChatSeconds,
    setLastRequestedAstro: setChatLastRequestedAstro,
  } = useChat();

  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, cancelAll, assignRoomId } = useWaitingQueue();

  const {
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    activeCall,
    resetCallFlow,
    setActiveCallRoomId,
    setActiveCall,
    setOpenReview,
    setReviewData,
    setLastRequestedAstro: setCallLastRequestedAstro,
  } = useCall();

  const [createChatRoom] = useCreateChatRoomMutation();
  const [logoutUser] = useLogoutUserMutation();

  // Use profile manager hook
  const { selectedProfile, profiles, profilesLoading, isCreating } =
    useProfileManager(dispatch);

  // Profile modal state
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailEditModal, setShowEmailEditModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [emailError, setEmailError] = useState("");
  const [profileToEdit, setProfileToEdit] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // RTK Query hooks for profile operations
  const [createKundli, { isLoading: isCreatingProfile }] =
    useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [editKundli] = useEditKundliMutation();

  // Use the astrologer connect hook
  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedTransactions, setAllLoadedTransactions] = useState([]);
  const [txnFilterBy, setTxnFilterBy] = useState("");
  const [txnFilterModalOpen, setTxnFilterModalOpen] = useState(false);
  const [txnFilterType, setTxnFilterType] = useState("");
  const [txnSortBy, setTxnSortBy] = useState("");
  const [txnDateRange, setTxnDateRange] = useState("");
  const [txnCustomFromDate, setTxnCustomFromDate] = useState("");
  const [txnCustomToDate, setTxnCustomToDate] = useState("");
  const [txnMinPrice, setTxnMinPrice] = useState("");
  const [txnMaxPrice, setTxnMaxPrice] = useState("");
  const [txnFilterActiveTab, setTxnFilterActiveTab] = useState("Type");
  const [txnSearchText, setTxnSearchText] = useState("");
  const [txnAppliedSearch, setTxnAppliedSearch] = useState("");
  const txnSearchTimerRef = useRef(null);
  // Applied filter state (used in API calls)
  const [txnAppliedSortBy, setTxnAppliedSortBy] = useState("");
  const [txnAppliedDateRange, setTxnAppliedDateRange] = useState("");
  const [txnAppliedFromDate, setTxnAppliedFromDate] = useState("");
  const [txnAppliedToDate, setTxnAppliedToDate] = useState("");
  const [txnAppliedMinPrice, setTxnAppliedMinPrice] = useState("");
  const [txnAppliedMaxPrice, setTxnAppliedMaxPrice] = useState("");

  // Call history pagination state
  const [callHistoryPage, setCallHistoryPage] = useState(1);

  // Chat history pagination state
  const [chatHistoryPage, setChatHistoryPage] = useState(1);

  // Filter state for applied filters (used in API calls)
  const [appliedSortOrder, setAppliedSortOrder] = useState("");
  const [appliedMonth, setAppliedMonth] = useState("");
  const [appliedYear, setAppliedYear] = useState("");

  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);

  // Fetch call and chat history
  const {
    data: callHistoryData,
    isLoading: isLoadingCalls,
    isFetching: isFetchingCalls,
  } = useGetCallHistoryQuery(
    {
      userId,
      page: callHistoryPage,
      limit: 12,
      ...(appliedSortOrder && { sortOrder: appliedSortOrder }),
      ...(appliedMonth && { month: appliedMonth }),
      ...(appliedYear && { year: appliedYear }),
      filterBy: "audio,video",
    },
    { skip: !userId },
  );
  // console.log("callHistoryData",callHistoryData?.data?.callHistory)

  const { data: chatHistoryData, isLoading: isLoadingChats, isFetching: isFetchingChats } =
    useGetUserChatMessagesQuery({
      userId,
      page: chatHistoryPage,
      limit: 12,
      ...(appliedSortOrder && { sortOrder: appliedSortOrder }),
      ...(appliedMonth && { month: appliedMonth }),
      ...(appliedYear && { year: appliedYear }),
    }, {
      skip: !userId,
    });


  // Get pagination info
  const callPagination = callHistoryData?.data?.pagination;
  const hasNextCallPage = callPagination?.hasNextPage || false;
  const hasPrevCallPage = callPagination?.hasPreviousPage || false;

  const chatPagination = chatHistoryData?.data?.pagination;
  const hasNextChatPage = chatPagination?.hasNextPage || false;
  const hasPrevChatPage = chatPagination?.hasPreviousPage || false;



  const formatDuration = (seconds = 0) => {
    const totalSecs = Math.round(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins} Min ${secs} Sec`;
  };

  // First-paint avatar for an order row. OrderAstrologerAvatar upgrades this to
  // the sized derivative once the astrologer query lands; this is what shows in
  // the meantime.
  //
  // Reads a derivatives map under both the row's `astrologer`-prefixed naming
  // convention and the bare name, so if the history endpoints ever include it
  // the first paint is already the 100x125 variant with no swap. Today they
  // carry only `astrologerProfileImgUrl`, the unresized original.
  //
  // Returns "" when there is no image at all, which lets the avatar keep its
  // initials circle instead of showing a placeholder photo.
  const resolveHistoryAvatar = (row) => {
    const profileImages = row?.astrologerProfileImages || row?.profileImages;
    const profileImgUrl = row?.astrologerProfileImgUrl;
    if (!profileImages && !profileImgUrl) return "";
    return getAstrologerImageUrl({ profileImages, profileImgUrl }, "small");
  };
  // Process order history data - current page call orders
  // Live status is only returned by the call-history endpoint (not chat/recordings),
  // so build a per-astrologer live map from it and reuse it on the chat tab.
  const liveAstrologerMap = Array.isArray(callHistoryData?.data?.callHistory)
    ? callHistoryData.data.callHistory.reduce((acc, item) => {
        const aId = item?.receiverId;
        if (aId && item?.astrologerLiveStatus?.isLive === true) acc[aId] = true;
        return acc;
      }, {})
    : {};

  const callOrders = Array.isArray(callHistoryData?.data?.callHistory)
    ? callHistoryData.data.callHistory
        .map((item, index) => ({
          id: `call-${callHistoryPage}-${index}`,
          type: "call",
          sessionType: item?.type || "audio",
          astrologer: {
            name: item?.receiverName || "Unknown",
            image: resolveHistoryAvatar(item),
            _id: item?.receiverId,
            astrologer_ID: item?.astrologer_ID || item?.receiverAstrologerId,
            firstName: item?.receiverName?.split(" ")[0] || "Unknown",
            lastName: item?.receiverName?.split(" ").slice(1).join(" ") || "",
            isActive: true,
          },
          date: item?.timestamp || new Date(),
          duration:`${formatDuration(Math.round(item?.totalDuration)) || 0}`,
          amount: item?.amount || 0,
          channelBreakdown: item?.channelBreakdown || [],
          rate: 0,
          status: item?.status || "completed",
          roomId: item?.roomId,
          rating: item?.rating || null,
          isLive: item?.astrologerLiveStatus?.isLive === true,
          liveStatus: item?.astrologerLiveStatus,
          year: item?.timestamp
            ? new Date(item.timestamp).getFullYear()
            : new Date().getFullYear(),
        }))
    : [];

  const chatOrders = Array.isArray(chatHistoryData?.data?.chatHistory)
    ? chatHistoryData.data.chatHistory.map((room, index) => {
        const chatMessages = room?.chatHistory || [];
        const firstChat = chatMessages[0];
        return {
          id: `chat-${chatHistoryPage}-${index}`,
          type: "chat",
          // orderId: room.roomId?.slice(-6) || "NA",
          astrologer: {
            name: room.astrologerFirstName
              ? `${room.astrologerFirstName} ${room.astrologerLastName || ""}`
              : "Unknown",
            image: resolveHistoryAvatar(room),
            _id: room.astrologerId,
            astrologer_ID: room.astrologer_ID || room.astrologerAstrologerId,
            firstName: room.astrologerFirstName || "Unknown",
            lastName: room.astrologerLastName || "",
            isActive: true,
          },
          date: firstChat?.createdAt || room?.createdAt || new Date(),
          duration: `${formatDuration(Math.round(room?.totalDuration)) || 0}`,
          amount: room?.amount || 0,
          channelBreakdown: room?.channelBreakdown || [],
          rate: room?.rate || 0,
          status: "completed",
          roomId: room.roomId,
          rating: room?.rating || null,
          isLive:
            room?.astrologerLiveStatus?.isLive === true ||
            liveAstrologerMap[room.astrologerId] === true,
          liveStatus:
            room?.astrologerLiveStatus ||
            { isLive: liveAstrologerMap[room.astrologerId] === true },
          year: firstChat?.createdAt
            ? new Date(firstChat.createdAt).getFullYear()
            : room?.createdAt
              ? new Date(room.createdAt).getFullYear()
              : new Date().getFullYear(),
        };
      })
    : [];

  const allOrders = [...callOrders, ...chatOrders].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Filter orders based on sub-tab
  const filteredOrders = orderHistoryTab === "call" ? callOrders : chatOrders;

  // Group orders by year
  const ordersByYear = filteredOrders.reduce((acc, order) => {
    if (!acc[order.year]) {
      acc[order.year] = [];
    }
    acc[order.year].push(order);
    return acc;
  }, {});
  // Fetch saved kundli profiles
  const {
    data: kundliData,
    isLoading: isLoadingKundlis,
    refetch: refetchKundlis,
  } = useGetAllKundlisQuery(undefined, {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });
  const savedKundlis = kundliData?.data || [];

  // Debug: Log kundli structure
  useEffect(() => {
    if (savedKundlis.length > 0) {
      console.log("First kundli structure:", savedKundlis[0]);
      console.log("Available ID fields:", {
        _id: savedKundlis[0]._id,
        kundli_ID: savedKundlis[0].kundli_ID,
        id: savedKundlis[0].id,
      });
    }
  }, [savedKundlis]);

  // Helper: Get primary profile (prioritize Redux selectedKundli, then 'self' relation, otherwise first profile)
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Clear stale selectedKundli if the profile no longer exists in the fetched list
  useEffect(() => {
    if (selectedKundli?._id && savedKundlis.length > 0) {
      const exists = savedKundlis.some(p => p._id === selectedKundli._id);
      if (!exists) {
        dispatch(clearSelectedKundli());
      }
    }
  }, [savedKundlis, selectedKundli, dispatch]);

  const primaryProfile = (() => {
    if (selectedKundli?._id) {
      const found = savedKundlis.find(p => p._id === selectedKundli._id);
      if (found) return found;
    }
    return savedKundlis.find(profile => profile.relation?.toLowerCase() === 'self') || savedKundlis[0];
  })();

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return str;
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const subStartDate = subData?.subscription?.subscriptionStartDate || null;
  const subscriptionDetails = hasActiveSubscription
    ? [
        { label: "Status", value: capitalizeWords(subData?.subscription?.status || "active") },
        { label: "Started", value: subStartDate ? dayjs(subStartDate).format("DD MMM YYYY") : "-" },
        { label: "Amount", value: `₹${subData?.subscription?.planAmount ?? subData?.plan?.price ?? 0}` },
        { label: "Payment", value: capitalizeWords(subData?.subscription?.paymentGateway || "wallet") },
        { label: "Reports left", value: subQuota ? `${subQuota.remainingQuota} of ${subQuota.monthlyQuota}` : "-" },
        { label: "Extra report", value: `₹${subData?.subscription?.overagePrice ?? subQuota?.overagePrice ?? 0} each` },
      ]
    : [];

    // Get user name with fallback to first Kundli name
 
  const userName = (() => {
    // Top priority: If a kundli is explicitly selected from dropdown, show its name
    if (selectedKundli?._id && primaryProfile?.name) {
      return capitalizeWords(primaryProfile.name);
    }

    // First priority: User's registered name
    if (user?.firstName && user?.lastName) {
      return capitalizeWords(`${user.firstName} ${user.lastName}`);
    }
    if (user?.firstName) {
      return capitalizeWords(user.firstName);
    }
    
    // Second priority: Primary Kundli profile name (self or first)
    if (primaryProfile?.name) {
      return capitalizeWords(primaryProfile.name);
    }
    
    // Third priority: Phone number
    if (user?.phoneNumber) {
      return user.phoneNumber;
    }
    
    // Last resort
    return "Guest User";
  })();
  // Build params for Kundali API from primary profile
  const kundliParams = primaryProfile
    ? buildVedicParam({
        name: primaryProfile.name,
        gender:
          primaryProfile.gender === "male"
            ? "Male"
            : primaryProfile.gender === "female"
              ? "Female"
              : "Others",
        day: primaryProfile.day,
        month: primaryProfile.month,
        year: primaryProfile.year,
        hour:
          primaryProfile.hour > 12
            ? primaryProfile.hour - 12
            : primaryProfile.hour === 0
              ? 12
              : primaryProfile.hour,
        min: primaryProfile.min,
        meridiem: primaryProfile.hour >= 12 ? "PM" : "AM",
        birthPlace: primaryProfile.place,
        lat: primaryProfile.lat,
        lon: primaryProfile.lon,
        tzone: primaryProfile.tzone ?? 5.5,
      })
    : null;

  // Fetch astrological details
  const {
    data: astroData,
    isLoading: isLoadingAstro,
    isError: isAstroError,
  } = useGetAstroDetailsQuery(kundliParams, {
    skip: !kundliParams,
  });

  const astroDetails = astroData?.response;

  // Delete kundli mutation - removed, now using ProfileManager

  // Fetch wallet balance
  const { balance, isFetching: isFetchingBalance } = useWalletBalance();

  // Fetch followed astrologers count
  const { data: followedData } = useGetFollowedAstrologersQuery({ page: 1, limit: 1 });
  const followedCount = followedData?.pagination?.totalDocs ?? 0;

  // Fetch transactions data with pagination - only when on Transactions tab
  const shouldFetch = activeTab === "Transactions";

  const { data: transactionsData, isFetching: isFetchingTransactions } =
    useGetTransactionsQuery(
      {
        page: currentPage,
        limit: 10,
        filterBy: txnFilterBy || null,
        sortBy: txnAppliedSortBy || null,
        dateRange: txnAppliedDateRange || null,
        customFromDate: txnAppliedFromDate || null,
        customToDate: txnAppliedToDate || null,
        minPrice: txnAppliedMinPrice || null,
        maxPrice: txnAppliedMaxPrice || null,
        search: txnAppliedSearch || null,
      },
      { skip: !shouldFetch },
    );

  const [getInvoice] = useGetInvoiceMutation();

  const pagination = transactionsData?.data?.pagination;
  const hasNextPage = pagination?.hasNextPage || false;

  // Update loaded transactions when new data arrives
  useEffect(() => {
    if (transactionsData?.data?.transactions && shouldFetch) {
      if (currentPage === 1) {
        setAllLoadedTransactions(transactionsData.data.transactions);
      } else {
        setAllLoadedTransactions((prev) => [
          ...prev,
          ...transactionsData.data.transactions,
        ]);
      }
    }
  }, [transactionsData, currentPage, shouldFetch]);

  // Infinite scroll handler for transactions
  const handleTransactionScroll = (e) => {
    const element = e.target;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (isAtBottom && hasNextPage && !isFetchingTransactions) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Reset pages and filters when switching tabs
  useEffect(() => {
    if (orderHistoryTab === "call") {
      setCallHistoryPage(1);
    } else {
      setChatHistoryPage(1);
    }
    // Reset applied filters on tab switch
    setFilterSortOrder("desc");
    setFilterMonth("");
    setFilterYear("");
    setAppliedSortOrder("");
    setAppliedMonth("");
    setAppliedYear("");
  }, [orderHistoryTab]);

  // Restore waiting state from localStorage on mount
  useEffect(() => {
    const savedWaitingState = localStorage.getItem("waitingState");
    if (savedWaitingState) {
      try {
        const { roomId, type, timestamp } = JSON.parse(savedWaitingState);

        // Check if waiting state is not too old (max 30 minutes)
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        if (now - timestamp < maxAge) {
          // Restore state
          setConnectionType(type);
          if (type === "chat") {
            setChatRoomId(roomId);
            setWaitingList(2);
          } else {
            setCallRoomId(roomId);
            setCallWaitingList(5);
          }

          // Reconnect socket if needed
          if (!voiceSocket.connected && userId) {
            voiceSocket.io.opts.query = {
              userId: userId,
              role: "CUSTOMER",
            };
            voiceSocket.connect();
          }
        } else {
          // Clear old waiting state
          localStorage.removeItem("waitingState");
        }
      } catch (error) {
        console.error("Error restoring waiting state:", error);
        localStorage.removeItem("waitingState");
      }
    }
  }, [userId, setWaitingList, setCallWaitingList]);

  // Socket event listeners for waiting modal
  useEffect(() => {
    if (!userId) return;

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2);

      // Save to localStorage
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

      // Save to localStorage
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

      // Clear localStorage
      localStorage.removeItem("waitingState");
      removePendingConnection(roomId);
      trackEvent("session_request_accepted", { astrologer_id: astrologerId, channel: "chat" });
      trackEvent("session_started_chat", { astrologer_id: astrologerId, session_id: roomId });

      const astro = data?.astrologer || activeAstroRef.current || {};
      const kundliId = selectedProfile?._id;

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          userId: userId,
          astrologerId: astrologerId,
          astrologerID: astro?.astrologer_ID,
          kundliId,
          astrologerName: getAstrologerDisplayName(astro),
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        // Navigate to chat page
        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: getAstrologerDisplayName(astro),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: getAstrologerDisplayName(astro),
            astroID: astro?.astrologer_ID,
            experience: astro?.experience,
            profileImgUrl: astro?.profileImgUrl,
          },
        });
      } catch (e) {
        console.error("Chat accepted error:", e);
        Toast.error("Failed to start chat");
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

      // Clear localStorage
      localStorage.removeItem("waitingState");
      removePendingConnection(roomId);
      trackEvent("session_request_accepted", { astrologer_id: rest?.astrologer?._id, channel: type || "audio" });

      const astro = rest?.astrologer || activeAstroRef.current;
      const kundliId = selectedProfile?._id;

      try {
        if (!astro) {
          console.error("❌ Astrologer data missing in ref");
          Toast.error("Astrologer data missing");
          return;
        }

        const res = await createChatRoom({
          userId: userId,
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
          userId: userId,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
        });
      } catch (error) {
        console.error("Call accepted error:", error);
        Toast.error("Failed to start call");
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
      Toast.error(errorMsg);

      // Clear localStorage
      localStorage.removeItem("waitingState");

      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    const handleSocketError = (err) => {
      Toast.error(err?.message || "Connection error");

      // Clear localStorage
      localStorage.removeItem("waitingState");

      resetChatFlow();
      resetCallFlow();
      cancelAll();
      setConnectionType(null);
    };

    // Attach events
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
    userId,
    navigate,
    resetChatFlow,
    resetCallFlow,
    setWaitingList,
    setCallWaitingList,
    setActiveChatRoomId,
    setActiveCallRoomId,
  ]);

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

  // Handle connect button click
  const handleConnectClick = (astrologer) => {
    console.log("astrologer", astrologer);

    // If this is a Pandit AI session, open Pandit AI chat
    if (astrologer._id === PANDIT_AI_ID) {
      if (!balance || balance <= 0) {
        Toast.error("Insufficient balance. Please recharge to continue.");
        return;
      }
      sessionStorage.setItem("panditai_open", "true");
      navigate(PATH.privateRoutes.HOME.path);
      return;
    }

    setSelectedAstrologerId(astrologer._id);
    setSelectedAstrologer(astrologer);
    activeAstroRef.current = astrologer;
    setIsConnectPopupOpen(true);

    // Force refetch if same astrologer is selected again
    if (selectedAstrologerId === astrologer._id) {
      refetchAstrologer();
    }
  };

  // Handle rate consultation button click
  const handleRateConsultation = (astrologer, roomId) => {
    setReviewData({
      astrologerID: astrologer.astrologer_ID || astrologer._id,
      // userName-first — only fall back to the plain `name` field when the
      // helper can't resolve a username / first+last name.
      fullName: getAstrologerDisplayName(astrologer) || astrologer.name,
      profileImage: astrologer.image || astrologer.profileImgUrl || astrologer.imageUrl,
      roomId,
    });
    setOpenReview(true);
  };

  const handleClosePopup = () => {
    setIsConnectPopupOpen(false);
    setSelectedAstrologer(null);
    setSelectedAstrologerId(null); // Clear the ID to stop fetching
  };

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    hookHandleAfterKundliSelect(selectedProfile);
  };

  // Delete kundli handlers - now using direct modals
  const handleOpenAddProfileModal = () => {
    setShowAddProfileModal(true);
  };

  const handleEditClick = (kundli) => {
    trackEvent("profile_edit_started", { profile_id: kundli?._id });
    setProfileToEdit(kundli);
    setShowEditProfileModal(true);
  };

  const handleDeleteClick = (kundli) => {
    console.log("=== DELETE BUTTON CLICKED ===");
    console.log("Full kundli object:", kundli);
    console.log("Available ID fields:");
    console.log("  - kundli._id:", kundli._id);
    console.log("  - kundli.id:", kundli.id);
    console.log("  - kundli.kundli_ID:", kundli.kundli_ID);
    console.log("  - kundli.kundliId:", kundli.kundliId);
    
    // Use _id (same as other working components)
    const idToDelete = kundli._id;
    
    if (!idToDelete) {
      console.error("❌ No valid ID found!");
      Toast.error("Cannot delete: Invalid profile ID");
      return;
    }
    
    console.log("✅ Using ID:", idToDelete);
    console.log("ID type:", typeof idToDelete);
    console.log("ID length:", idToDelete.length);
    
    setProfileToDelete(idToDelete);
    setShowDeleteModal(true);
  };

  const handleCloseAddProfile = () => {
    setShowAddProfileModal(false);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfileModal(false);
    setProfileToEdit(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  // Helper function to build kundli payload
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: data.relation || "Self",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: data.timezone ?? 5.5,
    };
  };

  // Helper function to check for duplicate kundli
  const isDuplicateKundli = (payload, list) =>
    list.some(
      (k) =>
        k.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
        k.gender.toLowerCase() === payload.gender.toLowerCase() &&
        Number(k.day) === Number(payload.day) &&
        Number(k.month) === Number(payload.month) &&
        Number(k.year) === Number(payload.year) &&
        Number(k.hour) === Number(payload.hour) &&
        Number(k.min) === Number(payload.min) &&
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
    );

  // Get initial data for edit modal
  const getEditInitialData = () => {
    if (!profileToEdit) return null;

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      relation: profileToEdit.relation
        ? profileToEdit.relation.charAt(0).toUpperCase() + profileToEdit.relation.slice(1).toLowerCase()
        : "Self",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
  };

  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      // Check for duplicate
      if (isDuplicateKundli(payload, savedKundlis)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      // Only call registerUser API if:
      // 1. User skipped onboarding (isRegister = false)
      // 2. AND the profile being added is "Self" relation
      // 3. AND user has not been registered yet (check localStorage as source of truth)
      const isSelfProfile = formData.relation?.toLowerCase() === "self";
      
      // Check if user is already registered from localStorage (source of truth)
      const currentUserData = localStorage.getItem("userData");
      const parsedUserData = currentUserData ? JSON.parse(currentUserData) : {};
      const isAlreadyRegistered = parsedUserData.isRegister === true;
      
      if (isRegister === false && isSelfProfile && !isAlreadyRegistered) {
        console.log("📝 User not registered and adding Self profile, calling registration API first...");
        
        // Prepare registration payload from profile data
        const dateObj = new Date(formData.birthDate);
        const phoneNumber = user?.phoneNumber || localStorage.getItem("shubhtalk_customer_phone") || "";
        const cleanPhone = phoneNumber.replace(/^\+?91/, "");
        const formattedPhone = `91${cleanPhone}`;
        
        const registrationPayload = {
          firstName: formData.name.split(" ")[0] || formData.name,
          lastName: formData.name.split(" ").slice(1).join(" ") || "",
          dateOfBirth: formData.birthDate,
          place: formData.birthPlace,
          phoneNumber: formattedPhone,
          password: "TempPass@123",
          gender: formData.identity.toLowerCase() === "others" ? "other" : formData.identity.toLowerCase(),
          languagePreferences: ["en"],
          role: "CUSTOMER",
          lat: formData.latitude || 0,
          lon: formData.longitude || 0,
        };

        try {
          const regResponse = await registerUser(registrationPayload);
          console.log("✅ Registration successful:", regResponse);
          
          // Update localStorage with registration data
          const updatedUserData = {
            ...parsedUserData,
            isRegister: true,
            firstName: registrationPayload.firstName,
            lastName: registrationPayload.lastName,
            place: formData.birthPlace,
            dateOfBirth: formData.birthDate,
            gender: formData.identity,
          };
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          
          // Update Redux state to reflect registration
          dispatch(updateRegistrationStatus({ isRegister: true }));
          
          // Update shubhtalk_user for TopBar
          const currentUser = localStorage.getItem("shubhtalk_user");
          const parsedUser = currentUser ? JSON.parse(currentUser) : {};
          const updatedUser = {
            ...parsedUser,
            firstName: registrationPayload.firstName,
            lastName: registrationPayload.lastName,
            place: formData.birthPlace,
          };
          localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));
          
          // Dispatch event to notify components
          window.dispatchEvent(new Event("auth-change"));
          
          Toast.success("Registration completed successfully");
        } catch (regErr) {
          console.error("❌ Registration failed:", regErr);
          const errorMessage = regErr?.response?.data?.message || regErr?.message || "Registration failed. Please try again.";
          
          // If user is already registered, update localStorage and continue
          if (errorMessage.toLowerCase().includes("already registered") || errorMessage.toLowerCase().includes("already exists")) {
            console.log("⚠️ User already registered, updating local state and continuing...");
            const updatedUserData = {
              ...parsedUserData,
              isRegister: true,
            };
            localStorage.setItem("userData", JSON.stringify(updatedUserData));
            
            // Update Redux state
            dispatch(updateRegistrationStatus({ isRegister: true }));
            
            // Don't throw error, continue with kundli creation
          } else {
            Toast.error(errorMessage);
            throw regErr;
          }
        }
      } else if (isSelfProfile && isAlreadyRegistered) {
        console.log("✅ User already registered, skipping registration API");
      }

      // Now create the kundli profile
      const result = await createKundli(payload).unwrap();
      
      // If this is a Self profile, update shubhtalk_user to reflect the new name in TopHeader
      if (isSelfProfile && result?.data) {
        const currentUser = localStorage.getItem("shubhtalk_user");
        const parsedUser = currentUser ? JSON.parse(currentUser) : {};
        const updatedUser = {
          ...parsedUser,
          firstName: formData.name.split(" ")[0] || formData.name,
          lastName: formData.name.split(" ").slice(1).join(" ") || "",
          place: formData.birthPlace,
        };
        localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));
        
        // Dispatch event to notify TopHeader to update
        window.dispatchEvent(new Event("auth-change"));
        console.log("✅ Updated shubhtalk_user with new Self profile name");
      }
      
      Toast.success("Profile added successfully");
      setShowAddProfileModal(false);
      trackEvent("additional_profile_added", { profile_count: (savedKundlis?.length || 0) + 1 });
    } catch (err) {
      console.error("Add profile error:", err);
      setShowAddProfileModal(false);
      // Only show custom toast for duplicate error (already shown above)
      // For API errors, global handler in privateRequestNew.js will show the toast
      if (err.message !== "Duplicate profile") {
        throw err;
      }
    }
  };

  // Handler: Submit edited profile
  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Build payload with updated data
      const payload = buildKundliPayload(formData);

      // Call editKundli with id and payload
      await editKundli({
        id: profileToEdit.kundli_ID,
        ...payload,
      }).unwrap();

      // If Self profile, also update user profile
      const isSelfProfile =
        profileToEdit.relation?.toLowerCase() === "self" ||
        formData.relation?.toLowerCase() === "self";

      if (isSelfProfile && formData.name?.trim()) {
        try {
          await updateUserProfile({ fullName: formData.name.trim() });
        } catch (e) {
          console.error("User profile update error:", e);
        }
      }

      Toast.success("Profile updated successfully");

      setShowEditProfileModal(false);
      setProfileToEdit(null);
      trackEvent("profile_updated", { profile_id: profileToEdit?._id });
    } catch (err) {
      console.error("Edit profile error:", err);
      throw err;
    }
  };

  // Handler: Confirm delete profile
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) {
      console.error("No profile ID to delete");
      return;
    }

    console.log("=== DELETE PROFILE DEBUG ===");
    console.log("Profile ID to delete:", profileToDelete);
    console.log("Type of ID:", typeof profileToDelete);
    console.log("ID length:", profileToDelete?.length);

    try {
      const result = await deleteKundli(profileToDelete).unwrap();
      console.log("Delete successful:", result);
      Toast.success("Profile deleted successfully");
      trackEvent("profile_deleted", { deleted_profile_id: profileToDelete });

      // Clear selected kundli if the deleted profile was the one selected
      if (selectedKundli?._id === profileToDelete) {
        dispatch(clearSelectedKundli());
      }

      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("=== DELETE ERROR ===");
      console.error("Full error:", err);
      console.error("Error data:", err?.data);
      console.error("Error message:", err?.data?.message || err?.message);
      
      const errorMessage = err?.data?.message || err?.message || "Failed to delete profile";
      Toast.error(errorMessage);
      
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  const handleLogout = async () => {
    // Call logout API
    trackEvent("logout_initiated", { user_id: localStorage.getItem("shubhtalk_customer_id") });
    try {
      await logoutUser({ deviceType: "web" }).unwrap();
      // Dispatch Redux logout action
      dispatch(logout());
      dispatch(clearSelectedKundli());
      dispatch(clearAllCalculatorData());
      // Clear all authentication related data from localStorage
      localStorage.clear();
      window.dispatchEvent(new Event("auth-change"));
      Toast.success("Logged out successfully");
      // Navigate to home page
      navigate("/");
    } catch (err) {
      // Continue with local logout even if API fails
      console.error("Logout API error:", err);
      // Still perform local logout
      dispatch(logout());
      dispatch(clearSelectedKundli());
      dispatch(clearAllCalculatorData());
      localStorage.clear();
      window.dispatchEvent(new Event("auth-change"));
      Toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const tabs = ["Profile", "Order History", ...(isShubhMallEnabled() ? ["ShubhMall History"] : []), "Transactions", "Support"];

  // Get initials for avatar
  const getInitials = (name) => {
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  // Get user avatar display (initials or emoji)
  const userAvatarDisplay = (() => {
    // If a kundli is explicitly selected from dropdown, show its initials
    if (selectedKundli?._id && primaryProfile?.name) {
      return getInitials(primaryProfile.name);
    }

    // If user has registered name, show initials
    if (user?.firstName && user?.lastName) {
      return getInitials(`${user.firstName} ${user.lastName}`);
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // If primary kundli exists, show its initials
    if (primaryProfile?.name) {
      return getInitials(primaryProfile.name);
    }
    
    // Default: show goat emoji
    return "🐏";
  })();

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ChevronLeft size={24} />
        </button>

        <div className={styles.headerCenter}>
          <div className={styles.userAvatar}>
            <span>{userAvatarDisplay}</span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.profileName}>{userName}</h1>
            <p className={styles.profileDetails}>
              {primaryProfile
                ? `${dayjs(`${primaryProfile.year}-${primaryProfile.month}-${primaryProfile.day}`).format("DD MMM YYYY")} • ${String(primaryProfile.hour > 12 ? primaryProfile.hour - 12 : primaryProfile.hour === 0 ? 12 : primaryProfile.hour).padStart(2, "0")}:${String(primaryProfile.min).padStart(2, "0")} ${primaryProfile.hour >= 12 ? "PM" : "AM"}`
                : " "}
            </p>
            {user?.phoneNumber && (
              <p className={styles.profileDetails}>
                {user.phoneNumber.startsWith("+")
                  ? user.phoneNumber
                  : `+${user.phoneNumber}`}
              </p>
            )}
          </div>
        </div>

        {/* <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button> */}
      </div>

      {/* Zodiac Cards */}
      <div className={styles.zodiacSection}>
        <div
          className={styles.zodiacCard}
          style={{ background: "#E9D7F6", color: "#49196D" }}
        >
          <div className={styles.zodiacIcon}>
            <Sun size={32} fill="#49196D" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : primaryProfile?.westernSign
                  ? primaryProfile.westernSign
                  : primaryProfile?.sunSign
                    ? primaryProfile.sunSign
                    : isAstroError || !astroDetails?.sun_sign
                      ? "-"
                      : astroDetails.sun_sign}
            </span>
            <span className={styles.zodiacValue}>Sun Sign</span>
          </div>
        </div>

        <div
          className={styles.zodiacCard}
          style={{ background: "#D8E9F4", color: "#1C4863" }}
        >
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#1C4863" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : isAstroError || !astroDetails?.rasi
                  ? "-"
                  : astroDetails.rasi}
            </span>
            <span className={styles.zodiacValue}>Moon Sign</span>
          </div>
        </div>

        <div
          className={styles.zodiacCard}
          style={{ background: "#D5F5E3", color: "#271C50" }}
        >
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#271C50" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : isAstroError || !astroDetails?.ascendant_sign
                  ? "-"
                  : astroDetails.ascendant_sign}
            </span>
            <span className={styles.zodiacValue}>Ascendant Sign</span>
          </div>
        </div>
      </div>

      <div className={styles.balanceMembershipRow}>
        <div className={styles.balanceMembershipItem}>
          {/* Balance Card */}
          <div
            className={styles.balanceCard}
            style={{ backgroundImage: `url(${profileWallet})` }}
          >
            <div className={styles.balanceLeft}>
              <div className={styles.balanceHeader}>
                <div className={styles.coinIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="#FFD700"
                      stroke="#FFA500"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="6" fill="#FFA500" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fill="#FFF"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ₹
                    </text>
                  </svg>
                </div>
                {/* <Sparkles size={16} fill="#FFF" color="#FFF" /> */}
                <span className={styles.balanceLabel}>Balance</span>
              </div>
              <div className={styles.balanceAmount}>
                ₹{Number(balance || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <button
              className={styles.addMinutesButton}
              onClick={() => navigate("/recharge")}
            >
              Recharge Wallet
              <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
            </button>
          </div>
        </div>

        <div className={styles.balanceMembershipItem}>
          <MembershipCard
                  hasSubscription={hasActiveSubscription}
                  autoRenew={!!subData?.subscription?.autoRenew}
                  planName={subPlanName}
                  validTill={subValidTill}
                  remainingDays={subRemainingDays}
                  quotaUsed={combinedQuotaUsed}
                  quotaTotal={combinedQuotaTotal}
                  details={subscriptionDetails}
                  onCancel={handleCancelSubscription}
                  isCancelling={isCancellingSubscription}
                  onSubscribe={() => setShowSubscriptionModal(true)}
                />
        </div>
      </div>

      {/* Email & Following Row */}
      <div className={styles.emailFollowingRow}>
        {/* Email Row */}
        <div
          className={styles.profileLink}
          onClick={() => {
            setEditEmailValue(userEmail || "");
            setEmailError("");
            setShowEmailEditModal(true);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditEmailValue(userEmail || "");
              setEmailError("");
              setShowEmailEditModal(true);
            }
          }}
        >
          <div className={styles.profileLinkRow}>
            <div className={styles.profileLinkLeft}>
              <div className={styles.profileLinkIcon} style={{ background: "transparent" }}>
                <img src={emailIconSet} alt="email" style={{ width: 28, height: 28 }} />
              </div>
              <p className={styles.profileLinkText}>{userEmail || "Add email"}</p>
            </div>
            <ChevronLeft size={18} className={styles.profileLinkArrow} style={{ transform: "rotate(180deg)", color: "#f75801" }} />
          </div>
        </div>

        {/* Astrologer You Follow Link */}
        <div
          className={styles.profileLink}
          onClick={() => navigate("/followed-astrologers")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/followed-astrologers")}
        >
          <div className={styles.profileLinkRow}>
            <div className={styles.profileLinkLeft}>
              <div className={styles.profileLinkIcon}>
                <FaUser size={18} />
              </div>
              <p className={styles.profileLinkText}>{followedCount} (Following)</p>
            </div>
            <ChevronLeft size={18} className={styles.profileLinkArrow} style={{ transform: "rotate(180deg)", color: "#f75801" }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer} ref={orderListRef}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "Profile" && (
          <div className={styles.profileContent}>
            {isLoadingKundlis ? (
              <div className={styles.loadingState}>
                <p>Loading profiles...</p>
              </div>
            ) : savedKundlis.length > 0 ? (
              <>
                {savedKundlis.map((kundli, index) => (
                  <div
                    key={kundli._id}
                    className={`${styles.profileCard} ${selectedKundli?._id === kundli._id ? styles.profileCardSelected : ""}`}
                    onClick={() => dispatch(setSelectedKundli(kundli))}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.avatarCircle}>
                      <span>{getInitials(kundli.name)}</span>
                    </div>

                    <div className={styles.profileCardContent}>
                      <div className={styles.profileCardHeader}>
                        {kundli?.relation && <div className={styles.badge}>{capitalizeWords(kundli?.relation)}</div>}
                        <div className={styles.profileActions}>
                          <button
                            className={styles.iconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(kundli);
                            }}
                            type="button"
                          >
                            <LuPencilLine size={18} />
                          </button>
                          {kundli?.relation !== "Self" &&
                            kundli?.relation !== "self" && (
                              <button
                                className={styles.iconButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(kundli);
                                }}
                                type="button"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                        </div>
                      </div>

                      <h3 className={styles.profileCardName}>{kundli.name}</h3>
                      <p className={styles.profileCardDate}>
                        {dayjs(
                          `${kundli.year}-${kundli.month}-${kundli.day}`,
                        ).format("DD MMM YYYY")}{" "}
                        •{" "}
                        {String(
                          kundli.hour > 12
                            ? kundli.hour - 12
                            : kundli.hour === 0
                              ? 12
                              : kundli.hour,
                        ).padStart(2, "0")}
                        :{String(kundli.min).padStart(2, "0")}{" "}
                        {kundli.hour >= 12 ? "PM" : "AM"}
                      </p>
                      <p className={styles.profileCardLocation}>
                        {kundli.place}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add Profile Button - now part of the list */}
                <button
                  className={styles.addProfileButton}
                  onClick={handleOpenAddProfileModal}
                >
                  Add Profile +
                </button>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No profiles found</p>
                <button
                  className={styles.addProfileButton}
                  onClick={handleOpenAddProfileModal}
                >
                  Add Profile +
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Order History" && (
          <div className={styles.orderContent}>
            {/* Sub Tabs for Call and Chat */}
            <div className={styles.subTabs}>
              <button
                className={`${styles.subTabButton} ${orderHistoryTab === "call" ? styles.active : ""}`}
                onClick={() => setOrderHistoryTab("call")}
              >
                Call
              </button>
              <button
                className={`${styles.subTabButton} ${orderHistoryTab === "chat" ? styles.active : ""}`}
                onClick={() => setOrderHistoryTab("chat")}
              >
                Chat
              </button>
            </div>

            {(orderHistoryTab === "call" ? isLoadingCalls : isLoadingChats) ? (
              <div className={styles.loadingState}>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <>
                {/* Filter button - always visible */}
                <div className={styles.headerContainer}>
                  <h4 className={styles.yearTitle}></h4>
                  <button
                    className={styles.filterButton}
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <FilterIcon size={16} />
                    <span>Filter</span>
                  </button>
                </div>
                <div
                  key={orderHistoryTab}
                  className={styles.orderList}
                >
                  {/* Loading overlay for page transitions */}
                  {(orderHistoryTab === "call"
                    ? isFetchingCalls
                    : isFetchingChats) && (
                    <div className={styles.loadingMore}>
                      <p>Loading...</p>
                    </div>
                  )}

                  {/* Orders by Year */}
                  {Object.keys(ordersByYear)
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <div key={year} className={styles.yearSection}>
                        <div className={styles.headerContainer}>
                          <h4 className={styles.yearTitle}>{year}</h4>
                          {/* Filter button moved outside the loop */}
                        </div>
                        <div className={styles.orderCardMain}>
                          {ordersByYear[year].map((order) => (
                            <div
                              key={order.id}
                              className={styles.orderCard}
                              onClick={() =>
                                navigate(
                                  `/profile/order-history/${order.astrologer._id}`,
                                  {
                                    state: {
                                      tab:
                                        order.type === "chat"
                                          ? "Chat"
                                          : "Call",
                                      from: "profile",
                                      // NOTE: Previously routed video to separate "Video" tab
                                      // tab:
                                      //   order.type === "chat"
                                      //     ? "Chat"
                                      //     : order.sessionType === "video"
                                      //       ? "Video"
                                      //       : "Call",
                                    },
                                  },
                                )
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <div className={styles.orderCardTop}>
                                <div className={styles.orderLeft}>
                                  <div
                                    className={styles.astrologerAvatar}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        getAstrologerProfilePath(
                                          order.astrologer,
                                        ),
                                      );
                                    }}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <OrderAstrologerAvatar
                                      astrologer={order.astrologer}
                                    />
                                    <LiveDot
                                      astrologer={order.astrologer}
                                      seedLiveStatus={order.liveStatus}
                                    />
                                  </div>
                                  <div className={styles.orderInfo}>
                                    <h5
                                      className={styles.astrologerName}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          getAstrologerProfilePath(
                                            order.astrologer,
                                          ),
                                        );
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {/* userName-first, else the plain name */}
                                      {getAstrologerDisplayName(order.astrologer) ||
                                        order.astrologer.name}
                                    </h5>
                                    <div className={styles.orderMeta}>
                                      <span className={styles.orderDate}>
                                        <Calendar size={15} className={styles.metaIcon} />{" "}
                                        {dayjs(order.date).format(
                                          "DD MMM, YYYY",
                                        )}
                                      </span>
                                      <span className={styles.orderTime}>
                                        <Clock size={15} className={styles.metaIcon} /> {dayjs(order.date).format("hh:mm A")}
                                      </span>
                                    </div>
                                    <p className={styles.orderDuration}>
                                      Duration : {order.duration}
                                    </p>
                                    {order.channelBreakdown?.length > 0 ? (
                                      <div className={styles.channelBreakdown}>
                                        {order.channelBreakdown.map((ch, i) => (
                                          <div key={i} className={styles.channelItem}>
                                            <span className={styles.channelLabel}>
                                              {ch.type === "call" ? "Audio" : ch.type === "video" ? "Video" : "Chat"}
                                            </span>
                                            <span className={styles.channelAmount}>₹{ch.amount}</span>
                                          </div>
                                        ))}
                                        <div className={styles.channelItemTotal}>
                                          <span className={styles.channelLabel}>Total</span>
                                          <span className={styles.channelTotalAmount}>₹{order.amount}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className={styles.orderAmount}>
                                        ₹{order.amount}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button className={styles.orderTypeIcon}>
                                  {order.type === "call" ? (
                                    order.sessionType === "video" ? (
                                      <Video size={20} />
                                    ) : (
                                      <Phone size={20} />
                                    )
                                  ) : (
                                    <MessageCircle size={20} />
                                  )}
                                </button>
                              </div>

                              <div className={styles.orderCardBottom}>
                                {order.rating ? (
                                  <div className={styles.ratingDisplay}>
                                    <span className={styles.ratingLabel}>Your Rating</span>
                                    <div className={styles.ratingStars}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          size={16}
                                          fill={star <= order.rating ? "#F97316" : "none"}
                                          color="#F97316"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    className={styles.rateButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRateConsultation(
                                        order.astrologer,
                                        order.roomId,
                                      );
                                    }}
                                  >
                                    Rate Consultation
                                  </button>
                                )}
                                <div className={styles.buttonSeparator}></div>
                                <ConsultAgainButton
                                  astrologer={order.astrologer}
                                  seedLiveStatus={order.liveStatus}
                                  onConsultAgain={handleConnectClick}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination Controls - outside scrollable orderList */}
                {(() => {
                  const isCall = orderHistoryTab === "call";
                  const page = isCall ? callHistoryPage : chatHistoryPage;
                  const totalPages = isCall
                    ? callPagination?.totalPages || 1
                    : chatPagination?.totalPages || 1;
                  const hasPrev = isCall ? hasPrevCallPage : hasPrevChatPage;
                  const hasNext = isCall ? hasNextCallPage : hasNextChatPage;

                  return totalPages > 1 ? (
                    <Pagination
                      pagination={{
                        page,
                        totalPages,
                        hasNextPage: hasNext,
                        hasPrevPage: hasPrev,
                      }}
                      onPageChange={(newPage) => {
                        if (isCall) setCallHistoryPage(newPage);
                        else setChatHistoryPage(newPage);
                        if (orderListRef.current) {
                          orderListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                    />
                  ) : null;
                })()}
              </>
            ) : (
              <>
                {/* Filter button - visible even in empty state */}
                <div className={styles.headerContainer}>
                  <h4 className={styles.yearTitle}></h4>
                  <button
                    className={styles.filterButton}
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <FilterIcon size={16} />
                    <span>Filter</span>
                  </button>
                </div>
                <div className={styles.emptyState}>
                  <p>
                    No {orderHistoryTab === "call" ? "call" : "chat"} orders yet
                  </p>
                  <button
                    className={styles.exploreButton}
                    onClick={() => navigate("/astrologers")}
                  >
                    Explore Astrologers
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "ShubhMall History" && isShubhMallEnabled() && <MallHistoryContent />}

        {activeTab === "Transactions" && (
          <div className={styles.transactionsContent}>
            {/* Search + Filter */}
            <div className={styles.txnSearchFilterRow}>
              <div className={styles.txnSearchWrap}>
                <input
                  type="text"
                  className={styles.txnSearchInput}
                  placeholder="Search Name"
                  value={txnSearchText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTxnSearchText(val);
                    if (txnSearchTimerRef.current) {
                      clearTimeout(txnSearchTimerRef.current);
                    }
                    txnSearchTimerRef.current = setTimeout(() => {
                      setTxnAppliedSearch(val.trim());
                      setCurrentPage(1);
                      setAllLoadedTransactions([]);
                    }, 500);
                  }}
                />
                {txnSearchText && (
                  <button
                    className={styles.txnSearchClearBtn}
                    onClick={() => {
                      setTxnSearchText("");
                      setTxnAppliedSearch("");
                      setCurrentPage(1);
                      setAllLoadedTransactions([]);
                    }}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                className={styles.filterButton}
                onClick={() => setTxnFilterModalOpen(true)}
              >
                <FilterIcon size={16} />
                <span>Filter</span>
              </button>
            </div>

            {/* Table Header */}
            {allLoadedTransactions.length > 0 && (
              <div className={styles.txnTableHeader}>
                <span className={styles.txnHeaderCell}>Transaction</span>
                <span className={styles.txnHeaderCell}>Duration</span>
                <span className={styles.txnHeaderCell}>Amount</span>
                <span className={styles.txnHeaderCell}>Action</span>
              </div>
            )}
            {/* Transaction History */}
            <div
              className={styles.transactionList}
              ref={transactionListRef}
              onScroll={handleTransactionScroll}
            >
              {allLoadedTransactions.length > 0 ? (
                <>
                  {allLoadedTransactions.map((transaction) => {
                    const txnType = (() => {
                      const desc = (transaction.description || "").toLowerCase();
                      if (desc.includes("gift")) return { label: "Gift Sent", icon: "🎁", color: "#F75801" };
                      if (desc.includes("video")) return { label: "Video Call", icon: "📹", color: "#7C3AED" };
                      if (desc.includes("audio") || desc.includes("call")) return { label: "Audio Call", icon: "📞", color: "#7C3AED" };
                      if (desc.includes("chat")) return { label: "Chat", icon: "💬", color: "#2563EB" };
                      if (desc.includes("recharge") || desc.includes("credit") || desc.includes("wallet")) return { label: "Recharge", icon: "💰", color: "#10B981" };
                      return { label: "Other", icon: "📄", color: "#6B7280" };
                    })();

                    return (
                      <div
                        key={transaction._id}
                        className={styles.txnRow}
                      >
                        {/* Icon + Info */}
                        <div className={styles.txnInfoCell}>
                          <div className={styles.txnIcon} style={{ background: `${txnType.color}15` }}>
                            <span>{txnType.icon}</span>
                          </div>
                          <div className={styles.txnDetails}>
                            <h4 className={styles.txnTitle}>
                              {transaction.description || "Transaction with"}{" "}
                              {/* userName-first: show the astrologer's username when
                                  available, else fall back to their real name. */}
                              {transaction?.displayProfile?.userName ||
                                getAstrologerDisplayName(transaction?.displayProfile) ||
                                transaction?.displayProfile?.name}
                            </h4>
                            <span className={styles.txnMeta}>
                              {dayjs(transaction.createdAt).format("DD MMM, YYYY • hh:mm A")} • TXN #{transaction._id?.slice(-4)}
                            </span>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className={styles.txnDurationCell}>
                          {transaction?.sessionDetails?.durationSeconds > 0 ? (
                            <span className={styles.txnDurationText}>
                              {Math.floor(Math.round(transaction.sessionDetails.durationSeconds) / 60)} Min {Math.round(transaction.sessionDetails.durationSeconds) % 60} Sec
                            </span>
                          ) : (
                            <span className={styles.txnDurationEmpty}>—</span>
                          )}
                        </div>

                        {/* Amount */}
                        <div className={styles.txnAmountCell}>
                          <span
                            className={`${styles.txnAmount} ${transaction?.billing?.user?.action === "credit" ? styles.credit : styles.debit}`}
                          >
                            {transaction?.billing?.user?.action === "credit"
                              ? "+"
                              : "-"}{" "}
                            ₹{transaction?.billing?.user?.debitAmount}
                          </span>
                        </div>

                        {/* Receipt Button - only for successful purchases (not admin credits) */}
                        <div className={styles.txnActionCell}>
                          {transaction?.billing?.user?.action === "credit" && transaction?.type !== "refunded" &&
                           !(transaction.description || "").toLowerCase().includes("admin") &&
                           !(transaction.description || "").toLowerCase().includes("bonus") && (
                            <button
                              className={`${styles.receiptBtn} ${invoiceLoadingId === transaction._id ? styles.downloadLoading : ""}`}
                              disabled={invoiceLoadingId === transaction._id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setInvoiceLoadingId(transaction._id);
                                try {
                                  const data = await getInvoice(transaction._id).unwrap();
                                  const pdfUrl =
                                    data?.data?.pdfUrl ||
                                    data?.data?.url ||
                                    data?.data ||
                                    data?.pdfUrl ||
                                    data?.url;
                                  if (pdfUrl) {
                                    window.open(pdfUrl, "_blank");
                                  } else {
                                    Toast.error("Invoice not available");
                                  }
                                } catch (err) {
                                  console.error("[Invoice] Error:", err);
                                  Toast.error("Invoice not available for this transaction");
                                } finally {
                                  setInvoiceLoadingId(null);
                                }
                              }}
                              title="Download Invoice"
                            >
                              {invoiceLoadingId === transaction._id ? (
                                <span className={styles.btnSpinner} />
                              ) : (
                                <Download size={16} />
                              )}
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isFetchingTransactions && (
                    <div className={styles.loadingMore}>
                      <p>Loading more...</p>
                    </div>
                  )}
                </>
              ) : isFetchingTransactions ? (
                <div className={styles.loadingState}>
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No transactions yet</p>
                </div>
              )}
            </div>

            {/* Sticky Contact Support Button */}
            <div className={styles.stickyButtonContainer}>
              <button
                className={styles.contactSupportButton}
                onClick={() => navigate("/customer-support")}
              >
                Contact Support
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === "Support" && (
          <div className={styles.supportContent}>
            {/* Support Grid Cards */}
            <div className={styles.supportGrid}>
              <div
                className={styles.supportGridCard}
                onClick={() =>
                  navigate("/customer-support", {
                    state: { fromTab: "Support" },
                  })
                }
              >
                <div className={styles.supportGridIconWrap}>
                  <div className={styles.supportGridIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="21" viewBox="0 0 20 18" fill="none">
                      <path d="M19 9.22C19 3.73 14.74 0 10 0C5.31 0 1 3.65 1 9.28C0.4 9.62 0 10.26 0 11V13C0 14.1 0.9 15 2 15C2.55 15 3 14.55 3 14V9.19C3 5.36 5.95 2.01 9.78 1.9C13.74 1.78 17 4.96 17 8.9V16H10C9.45 16 9 16.45 9 17C9 17.55 9.45 18 10 18H17C18.1 18 19 17.1 19 16V14.78C19.59 14.47 20 13.86 20 13.14V10.84C20 10.14 19.59 9.53 19 9.22Z" fill="url(#paint0_linear_16578_35306)"/>
                      <path d="M7 11C7.55228 11 8 10.5523 8 10C8 9.44771 7.55228 9 7 9C6.44772 9 6 9.44771 6 10C6 10.5523 6.44772 11 7 11Z" fill="url(#paint1_linear_16578_35306)"/>
                      <path d="M13 11C13.5523 11 14 10.5523 14 10C14 9.44771 13.5523 9 13 9C12.4477 9 12 9.44771 12 10C12 10.5523 12.4477 11 13 11Z" fill="url(#paint2_linear_16578_35306)"/>
                      <path d="M16 8.03C15.52 5.18 13.04 3 10.05 3C7.02 3 3.76 5.51 4.02 9.45C6.49 8.44 8.35 6.24 8.88 3.56C10.19 6.19 12.88 8 16 8.03Z" fill="url(#paint3_linear_16578_35306)"/>
                      <defs>
                        <linearGradient id="paint0_linear_16578_35306" x1="0" y1="9" x2="20" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_16578_35306" x1="0" y1="9" x2="20" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                        <linearGradient id="paint2_linear_16578_35306" x1="0" y1="9" x2="20" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                        <linearGradient id="paint3_linear_16578_35306" x1="0" y1="9" x2="20" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h4 className={styles.supportGridTitle}>Customer Support</h4>
                  </div>
                  <p className={styles.supportGridDesc}>
                    Chat with our team for quick help on app or consultation
                    queries.
                  </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() =>
                  navigate("/faq", { state: { fromTab: "Support" } })
                }
              >
                <div className={styles.supportGridIconWrap}>
                  <div className={styles.supportGridIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M7.66982 7.04C6.86982 6.7 6.52982 5.71 7.00982 4.99C7.97982 3.55 9.59982 2.5 11.7398 2.5C14.0898 2.5 15.6998 3.57 16.5198 4.91C17.2198 6.06 17.6298 8.21 16.5498 9.81C15.3498 11.58 14.1998 12.12 13.5798 13.26C13.4298 13.53 13.3398 13.75 13.2798 14.2C13.1898 14.93 12.5898 15.5 11.8498 15.5C10.9798 15.5 10.2698 14.75 10.3698 13.88C10.4298 13.37 10.5498 12.84 10.8298 12.34C11.5998 10.95 13.0798 10.13 13.9398 8.9C14.8498 7.61 14.3398 5.2 11.7598 5.2C10.5898 5.2 9.82982 5.81 9.35982 6.54C9.00982 7.11 8.27982 7.29 7.66982 7.04ZM13.7498 19.5C13.7498 20.6 12.8498 21.5 11.7498 21.5C10.6498 21.5 9.74982 20.6 9.74982 19.5C9.74982 18.4 10.6498 17.5 11.7498 17.5C12.8498 17.5 13.7498 18.4 13.7498 19.5Z" fill="url(#paint0_linear_16578_38576)"/>
                      <defs>
                        <linearGradient id="paint0_linear_16578_38576" x1="6.78906" y1="12" x2="17.2123" y2="12" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h4 className={styles.supportGridTitle}>FAQs</h4>
                </div>
                <p className={styles.supportGridDesc}>
                  Find quick answers to common astrology and app questions.
                </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() =>
                  navigate(PATH.privateRoutes.RECENT_TICKETS.path, {
                    state: { fromTab: "Support" },
                  })
                }
              >
                <div className={styles.supportGridIconWrap}>
                  <div className={styles.supportGridIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M6 2C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8.83C20 8.3 19.79 7.79 19.41 7.42L14.58 2.59C14.21 2.21 13.7 2 13.17 2H6ZM13 8V3.5L18.5 9H14C13.45 9 13 8.55 13 8Z" fill="url(#paint0_linear_16578_38538)"/>
                      <defs>
                        <linearGradient id="paint0_linear_16578_38538" x1="4" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h4 className={styles.supportGridTitle}>Recent Tickets</h4>
                </div>
                <p className={styles.supportGridDesc}>
                  Track updates on your latest support requests.
                </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() => navigate("/privacy", { state: { activeTab } })}
              >
                <div className={styles.supportGridIconWrap}>
                  <div className={styles.supportGridIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" viewBox="0 0 18 21" fill="none">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 5C0 3.70871 0.82629 2.56229 2.05132 2.15395L8.05131 0.15395C8.66711 -0.0513164 9.33288 -0.051317 9.94868 0.15395L15.9487 2.15395C17.1737 2.56229 18 3.70871 18 5V10.3377C18 15.8397 12.4398 19.1795 10.0601 20.3569C9.38748 20.6896 8.61252 20.6896 7.93993 20.3569C5.56019 19.1795 0 15.8397 0 10.3377V5ZM12 7.33777C12 8.99462 10.6569 10.3378 9 10.3378C7.34315 10.3378 6 8.99462 6 7.33777C6 5.68091 7.34315 4.33777 9 4.33777C10.6569 4.33777 12 5.68091 12 7.33777ZM9.00003 12.3378C10.7944 12.3378 12.431 13.0129 13.6698 14.123C14.0352 14.4504 14.0409 15.0088 13.6998 15.3613C13.6392 15.4238 13.5779 15.4859 13.5157 15.5474C12.0429 17.0048 10.2698 18.0217 9.17318 18.5643C9.05954 18.6205 8.94053 18.6205 8.82688 18.5643C7.73031 18.0217 5.95721 17.0048 4.48435 15.5474C4.42218 15.4859 4.36082 15.4238 4.30031 15.3613C3.95912 15.0088 3.96487 14.4504 4.33023 14.123C5.56904 13.0129 7.20569 12.3378 9.00003 12.3378Z" fill="url(#paint0_linear_16578_38289)"/>
                      <defs>
                        <linearGradient id="paint0_linear_16578_38289" x1="0" y1="10.3032" x2="18" y2="10.3032" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h4 className={styles.supportGridTitle}>Privacy & Security</h4>
                </div>
                <p className={styles.supportGridDesc}>
                  Manage your data and privacy preferences.
                </p>
              </div>

                <div
                className={styles.supportGridCard}
                  onClick={() =>
                    navigate("/community-guidelines", {
                      state: { fromTab: "Support" },
                    })
                  }
                >
                  <div className={styles.supportGridIconWrap}>
                    <div className={styles.supportGridIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28px" height="28px" viewBox="0 0 28 28" version="1.1">
                        <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="ic_fluent_people_community_28_filled" fill="#212121" fill-rule="nonzero">
                                <path d="M17.75,18 C18.7164983,18 19.5,18.7835017 19.5,19.75 L19.5,21.7519766 L19.4921156,21.8604403 C19.1813607,23.9866441 17.2715225,25.0090369 14.0667905,25.0090369 C10.8736123,25.0090369 8.93330141,23.9983408 8.51446278,21.8965776 L8.5,21.75 L8.5,19.75 C8.5,18.7835017 9.28350169,18 10.25,18 L17.75,18 Z M18.2439108,11.9999135 L24.25,12 C25.2164983,12 26,12.7835017 26,13.75 L26,15.7519766 L25.9921156,15.8604403 C25.6813607,17.9866441 23.7715225,19.0090369 20.5667905,19.0090369 L20.3985759,19.007437 C20.0900029,17.9045277 19.1110503,17.0815935 17.9288034,17.0057197 L17.75,17 L16.8277704,17.0007255 C17.8477843,16.1757619 18.5,14.9140475 18.5,13.5 C18.5,12.9740145 18.4097576,12.4691063 18.2439108,11.9999135 Z M3.75,12 L9.75608915,11.9999135 C9.59024243,12.4691063 9.5,12.9740145 9.5,13.5 C9.5,14.8308682 10.0777413,16.0267978 10.996103,16.8506678 L11.1722296,17.0007255 L10.25,17 C8.9877951,17 7.92420242,17.85036 7.60086562,19.0094363 L7.5667905,19.0090369 C4.37361228,19.0090369 2.43330141,17.9983408 2.01446278,15.8965776 L2,15.75 L2,13.75 C2,12.7835017 2.78350169,12 3.75,12 Z M14,10 C15.9329966,10 17.5,11.5670034 17.5,13.5 C17.5,15.4329966 15.9329966,17 14,17 C12.0670034,17 10.5,15.4329966 10.5,13.5 C10.5,11.5670034 12.0670034,10 14,10 Z M20.5,4 C22.4329966,4 24,5.56700338 24,7.5 C24,9.43299662 22.4329966,11 20.5,11 C18.5670034,11 17,9.43299662 17,7.5 C17,5.56700338 18.5670034,4 20.5,4 Z M7.5,4 C9.43299662,4 11,5.56700338 11,7.5 C11,9.43299662 9.43299662,11 7.5,11 C5.56700338,11 4,9.43299662 4,7.5 C4,5.56700338 5.56700338,4 7.5,4 Z" id="🎨-Color">

                                </path>
                            </g>
                        </g>
                      </svg>
                    </div>
                    <h4 className={styles.supportGridTitle}>
                      Community Guidelines
                    </h4>
                  </div>
                  <p className={styles.supportGridDesc}>
                    Learn how to use the platform safely and respectfully.
                  </p>
              </div>

            </div>

            {/* Others Section */}
            {/* <div className={styles.othersSection}>
              <h3 className={styles.othersTitle}>Others</h3>

              <div
                className={styles.otherCard}
                onClick={() =>
                  navigate("/feedback", { state: { fromTab: "Support" } })
                }
              >
                <div className={styles.otherCardLeft}>
                  <h4 className={styles.otherCardTitle}>App Feedback</h4>
                  <p className={styles.otherCardDesc}>
                    Share suggestions to improve your astro experience.
                  </p>
                </div>
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                  className={styles.otherCardIcon}
                />
              </div>

              <div
                className={styles.otherCard}
                onClick={() =>
                  navigate("/community-guidelines", {
                    state: { fromTab: "Support" },
                  })
                }
              >
                <div className={styles.otherCardLeft}>
                  <h4 className={styles.otherCardTitle}>
                    Community Guidelines
                  </h4>
                  <p className={styles.otherCardDesc}>
                    Learn how to use the platform safely and respectfully.
                  </p>
                </div>
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                  className={styles.otherCardIcon}
                />
              </div>
            </div> */}
          </div>
        )}
      </div>

      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile to Continue"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={handleClosePopup}
        astrologer={latestAstrologerData?.data || selectedAstrologer}
        isLoadingAstrologer={isLoadingAstrologer || isFetchingAstrologer}
        onChatStart={(...args) => { setLastConnectionType("chat"); return handleChatStart(...args); }}
        onCallStart={(...args) => { setLastConnectionType(args[1] || "audio"); return handleCallStart(...args); }}
        onEmergencyAvailable={() => {
          setIsConnectPopupOpen(false);
          setShowEmergencyModal(true);
        }}
      />

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={latestAstrologerData?.data || selectedAstrologer}
        onChatNow={(astro) => {
          setShowEmergencyModal(false);
          activeAstroRef.current = astro;
          handleChatStart(astro, true);
        }}
        onCallNow={(astro) => {
          setShowEmergencyModal(false);
          activeAstroRef.current = astro;
          handleCallStart(astro, "audio", true);
        }}
      />

      <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />

      <DeleteConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancelSubscription}
        isLoading={isCancellingSubscription}
        tone="primary"
        title="Are you sure want to cancel?"
        message="You'll lose access to premium AI features and your remaining report quota once your subscription ends."
        confirmText="Yes, Cancel"
        loadingText="Cancelling..."
        cancelText="No, Keep it"
      />

      {/* Recharge Modal for insufficient balance */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={latestAstrologerData?.data || selectedAstrologer}
        connectionType={lastConnectionType}
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfileModal}
        onClose={handleCloseAddProfile}
        onSubmit={handleSubmitProfile}
        isLoading={isCreatingProfile}
        title="Add Profile"
        savedKundlis={savedKundlis}
        showProfileListing={false}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={handleCloseEditProfile}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreatingProfile}
        title="Edit Profile"
        savedKundlis={savedKundlis}
        initialData={getEditInitialData()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={confirmDeleteProfile}
      />

      {/* Email Edit Modal */}
      {showEmailEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailEditModal(false)}>
          <div className={styles.emailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.emailModalHeader}>
              <h3 className={styles.emailModalTitle}>Update Email</h3>
              <button className={styles.emailModalClose} onClick={() => setShowEmailEditModal(false)}>✕</button>
            </div>
            <label className={styles.emailModalLabel}>Email ID <span style={{ color: "red" }}>*</span></label>
            <input
              type="email"
              value={editEmailValue}
              onChange={(e) => { setEditEmailValue(e.target.value); setEmailError(""); }}
              placeholder="Enter your email address"
              className={styles.emailModalInput}
              style={emailError ? { borderColor: "red", marginBottom: "0.25rem" } : {}}
            />
            {emailError && <p style={{ color: "red", fontSize: "0.75rem", margin: "0 0 0.5rem 0" }}>{emailError}</p>}
            <p className={styles.emailModalDesc}>
              Update email ID to receive important notifications and account updates.
            </p>
            <button
              className={styles.emailModalBtn}
              onClick={async () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!editEmailValue.trim()) {
                  setEmailError("Please enter an email address");
                  return;
                }
                if (!emailRegex.test(editEmailValue)) {
                  setEmailError("Please enter a valid email address");
                  return;
                }
                try {
                  await updateUserProfile({ email: editEmailValue });
                  dispatch(setEmail(editEmailValue));
                  // Update localStorage so email persists across sessions
                  const stored = JSON.parse(localStorage.getItem("shubhtalk_user") || "{}");
                  stored.email = editEmailValue;
                  localStorage.setItem("shubhtalk_user", JSON.stringify(stored));
                  setShowEmailEditModal(false);
                  setEmailError("");
                  Toast.success("Email updated successfully");
                } catch (err) {
                  setEmailError(err?.response?.data?.message || "Failed to update email");
                }
              }}
            >
              Update Email
            </button>
          </div>
        </div>
      )}

      {/* Sticky Review Modal */}
      <StickyReview />

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className={styles.filterModalOverlay} onClick={() => setFilterModalOpen(false)}>
          <div className={styles.filterModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.filterModalHeader}>
              <h3 className={styles.filterModalTitle}>Filters</h3>
              <button className={styles.filterModalClose} onClick={() => setFilterModalOpen(false)}>✕</button>
            </div>

            <div className={styles.filterModalBody}>
              <div className={styles.filterTabs}>
                {["Sort", "Month", "Year"].map((tab) => (
                  <button
                    key={tab}
                    className={`${styles.filterTab} ${filterActiveTab === tab ? styles.filterTabActive : ""}`}
                    onClick={() => setFilterActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={styles.filterOptions}>
                {filterActiveTab === "Sort" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Sort Order</span>
                    </div>
                    {[
                      { label: "Newest First", value: "desc" },
                      { label: "Oldest First", value: "asc" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={styles.filterOptionItem}
                        onClick={() => setFilterSortOrder(opt.value)}
                      >
                        <FaCheck
                          size={14}
                          className={filterSortOrder === opt.value ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: filterSortOrder === opt.value ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{opt.label}</span>
                      </div>
                    ))}
                  </>
                )}

                {filterActiveTab === "Month" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Select Month</span>
                      {filterMonth && (
                        <span className={styles.filterClearLink} onClick={() => setFilterMonth("")}>Clear</span>
                      )}
                    </div>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                      <div
                        key={m}
                        className={styles.filterOptionItem}
                        onClick={() => setFilterMonth(filterMonth === String(idx + 1) ? "" : String(idx + 1))}
                      >
                        <FaCheck
                          size={14}
                          className={filterMonth === String(idx + 1) ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: filterMonth === String(idx + 1) ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{m}</span>
                      </div>
                    ))}
                  </>
                )}

                {filterActiveTab === "Year" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Select Year</span>
                      {filterYear && (
                        <span className={styles.filterClearLink} onClick={() => setFilterYear("")}>Clear</span>
                      )}
                    </div>
                    {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                      <div
                        key={y}
                        className={styles.filterOptionItem}
                        onClick={() => setFilterYear(filterYear === y ? "" : y)}
                      >
                        <FaCheck
                          size={14}
                          className={filterYear === y ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: filterYear === y ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{y}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className={styles.filterModalFooter}>
              <button
                className={styles.filterResetBtn}
                onClick={() => {
                  setFilterSortOrder("desc");
                  setFilterMonth("");
                  setFilterYear("");
                  setAppliedSortOrder("");
                  setAppliedMonth("");
                  setAppliedYear("");
                  setFilterModalOpen(false);
                  // Reset to page 1
                  if (orderHistoryTab === "call") setCallHistoryPage(1);
                  else setChatHistoryPage(1);
                }}
              >
                Reset
              </button>
              <button
                className={styles.filterApplyBtn}
                onClick={() => {
                  setAppliedSortOrder(filterSortOrder === "desc" ? "" : filterSortOrder);
                  setAppliedMonth(filterMonth);
                  setAppliedYear(filterYear);
                  // Reset to page 1 on filter apply
                  if (orderHistoryTab === "call") setCallHistoryPage(1);
                  else setChatHistoryPage(1);
                  setFilterModalOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Filter Modal */}
      {txnFilterModalOpen && (
        <div className={styles.filterModalOverlay} onClick={() => setTxnFilterModalOpen(false)}>
          <div className={styles.filterModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.filterModalHeader}>
              <h3 className={styles.filterModalTitle}>Filters</h3>
              <button className={styles.filterModalClose} onClick={() => setTxnFilterModalOpen(false)}>✕</button>
            </div>

            <div className={styles.filterModalBody}>
              <div className={styles.filterTabs}>
                {["Type", "Sort", "Date", "Price"].map((tab) => (
                  <button
                    key={tab}
                    className={`${styles.filterTab} ${txnFilterActiveTab === tab ? styles.filterTabActive : ""}`}
                    onClick={() => setTxnFilterActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={styles.filterOptions}>
                {txnFilterActiveTab === "Type" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Transaction Type</span>
                    </div>
                    {[
                      { label: "All", value: "" },
                      { label: "Chat", value: "chat" },
                      { label: "Call", value: "call" },
                      { label: "Video", value: "video" },
                      { label: "Gift", value: "gift" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={styles.filterOptionItem}
                        onClick={() => setTxnFilterType(opt.value)}
                      >
                        <FaCheck
                          size={14}
                          className={txnFilterType === opt.value ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: txnFilterType === opt.value ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{opt.label}</span>
                      </div>
                    ))}
                  </>
                )}

                {txnFilterActiveTab === "Sort" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Sort Order</span>
                    </div>
                    {[
                      { label: "Latest First", value: "latestFirst" },
                      { label: "Oldest First", value: "oldestFirst" },
                      { label: "Highest Price", value: "highestPrice" },
                      { label: "Lowest Price", value: "lowestPrice" },
                      { label: "Longest Duration", value: "longestDuration" },
                      { label: "Shortest Duration", value: "shortestDuration" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={styles.filterOptionItem}
                        onClick={() => setTxnSortBy(opt.value)}
                      >
                        <FaCheck
                          size={14}
                          className={txnSortBy === opt.value ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: txnSortBy === opt.value ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{opt.label}</span>
                      </div>
                    ))}
                  </>
                )}

                {txnFilterActiveTab === "Date" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Date Range</span>
                      {txnDateRange && (
                        <span className={styles.filterClearLink} onClick={() => setTxnDateRange("")}>Clear</span>
                      )}
                    </div>
                    {[
                      { label: "Today", value: "today" },
                      { label: "Yesterday", value: "yesterday" },
                      { label: "Last 7 Days", value: "last7days" },
                      { label: "Last 30 Days", value: "last30days" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={styles.filterOptionItem}
                        onClick={() => setTxnDateRange(txnDateRange === opt.value ? "" : opt.value)}
                      >
                        <FaCheck
                          size={14}
                          className={txnDateRange === opt.value ? styles.filterCheckActive : styles.filterCheckInactive}
                          style={{ opacity: txnDateRange === opt.value ? 1 : 0.2 }}
                        />
                        <span className={styles.filterOptionLabel}>{opt.label}</span>
                      </div>
                    ))}
                    <div className={styles.filterOptionHeader} style={{ marginTop: "12px" }}>
                      <span>Custom Range</span>
                      {(txnCustomFromDate || txnCustomToDate) && (
                        <span className={styles.filterClearLink} onClick={() => { setTxnCustomFromDate(""); setTxnCustomToDate(""); }}>Clear</span>
                      )}
                    </div>
                    <div className={styles.filterDateInputs}>
                      <DateTimePicker
                        mode="date"
                        selected={txnCustomFromDate ? new Date(txnCustomFromDate) : null}
                        onChange={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const dd = String(date.getDate()).padStart(2, "0");
                            setTxnCustomFromDate(`${yyyy}-${mm}-${dd}`);
                          } else {
                            setTxnCustomFromDate("");
                          }
                        }}
                        placeholder="From date"
                        maxDate={new Date()}
                      />
                      <DateTimePicker
                        mode="date"
                        selected={txnCustomToDate ? new Date(txnCustomToDate) : null}
                        onChange={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const dd = String(date.getDate()).padStart(2, "0");
                            setTxnCustomToDate(`${yyyy}-${mm}-${dd}`);
                          } else {
                            setTxnCustomToDate("");
                          }
                        }}
                        placeholder="To date"
                        minDate={txnCustomFromDate ? new Date(txnCustomFromDate) : undefined}
                        maxDate={new Date()}
                      />
                    </div>
                  </>
                )}

                {txnFilterActiveTab === "Price" && (
                  <>
                    <div className={styles.filterOptionHeader}>
                      <span>Minimum Price to Maximum Price</span>
                    </div>
                    <div className={styles.txnPriceRange}>
                      <div className={styles.txnPriceLabels}>
                        <span className={styles.txnPriceValue}>₹{txnMinPrice || 0}</span>
                        <span className={styles.txnPriceValue}>₹{txnMaxPrice || 1000}</span>
                      </div>
                      <div className={styles.txnRangeSliderWrap}>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          value={txnMinPrice || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val <= (Number(txnMaxPrice) || 1000)) {
                              setTxnMinPrice(String(val));
                            }
                          }}
                          className={styles.txnRangeSlider}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          value={txnMaxPrice || 1000}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val >= (Number(txnMinPrice) || 0)) {
                              setTxnMaxPrice(String(val));
                            }
                          }}
                          className={styles.txnRangeSlider}
                        />
                      </div>
                      <div className={styles.txnPriceLabels}>
                        <span className={styles.txnPriceBound}>₹0</span>
                        <span className={styles.txnPriceBound}>₹1000</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.filterModalFooter}>
              <button
                className={styles.filterResetBtn}
                onClick={() => {
                  setTxnFilterType("");
                  setTxnSortBy("");
                  setTxnDateRange("");
                  setTxnCustomFromDate("");
                  setTxnCustomToDate("");
                  setTxnMinPrice("");
                  setTxnMaxPrice("");
                  setTxnFilterBy("");
                  setTxnAppliedSortBy("");
                  setTxnAppliedDateRange("");
                  setTxnAppliedFromDate("");
                  setTxnAppliedToDate("");
                  setTxnAppliedMinPrice("");
                  setTxnAppliedMaxPrice("");
                  setCurrentPage(1);
                  setAllLoadedTransactions([]);
                  setTxnFilterModalOpen(false);
                }}
              >
                Reset
              </button>
              <button
                className={styles.filterApplyBtn}
                onClick={() => {
                  setTxnFilterBy(txnFilterType);
                  setTxnAppliedSortBy(txnSortBy);
                  setTxnAppliedDateRange(txnDateRange);
                  setTxnAppliedFromDate(txnCustomFromDate);
                  setTxnAppliedToDate(txnCustomToDate);
                  setTxnAppliedMinPrice(txnMinPrice);
                  setTxnAppliedMaxPrice(txnMaxPrice);
                  setCurrentPage(1);
                  setAllLoadedTransactions([]);
                  setTxnFilterModalOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
