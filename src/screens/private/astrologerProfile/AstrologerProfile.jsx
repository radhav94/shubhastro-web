import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaPlay, FaStar, FaChevronRight } from "react-icons/fa";
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
import { useNavigate, useParams } from "react-router-dom";
import { ErrorText, PrimaryText } from "../../../component";
import toast from "../../../component/toast";
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
import { useGetCallHistoryQuery } from "../../../redux/api/callHistory/callHistory";
import { useGetUserChatMessagesQuery } from "../../../redux/api/chatHistory/chatHistory";
import StickyReview from "../home/components/call/StickyReview";
import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useChat } from "../../../context/ChatContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { ProfileManager } from "../../../component/UI/Profile";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { AppIcons, getAstrologerDefaultImage } from "../../../utils/appImages";

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

const AstrologerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: astrologerData,
    isLoading,
    error,
  } = useGetAstrologerByIdQuery({ id }, { skip: !id, pollingInterval: 10000 });

  const data = astrologerData?.data;

  // Live status
  const isLive = data?.astrologerLiveStatus?.isLive || false;
  const liveRoomId = data?.astrologerLiveStatus?.roomId;

  const handleJoinLive = () => {
    if (liveRoomId) {
      navigate(`/live/${liveRoomId}`, { state: { from: `/astrologer/${id}` } });
    }
  };

  // Fetch top astrologers for left sidebar (desktop only)
  const { data: topAstrologersData } = useGetAstrologersQuery({
    page: 1,
    limit: 10,
    isActive: true,
  });
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
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isVAOpen, setIsVAOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Reviews pagination state
  const [allReviews, setAllReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchMoreReviews] = useLazyGetAstrologerReviewsQuery();

    const { data: vaChatHistoryData } = useGetChatHistoryQuery(

    { userId: data?._id },

    { skip: !data?._id || !getToken() }

  );

  const hasChatHistory = (vaChatHistoryData?.data?.length || 0) > 0;


  const { data: followingData } = useCheckFollowingStatusQuery(
    { astrologerId: data?._id },
    { skip: !data?._id || !getToken() }
  );

  // Check if the current astrologer is in the following list
  const isFollowing = followingData?.data?.some(
    (item) => item.astrologerId === data?._id && item.isFollowing === true
  ) || false;

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const [createChatRoom] = useCreateChatRoomMutation();
  const [setOpenModal] = useTalkToAstrologer();

  // State
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

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

  // Fetch call & chat history to find last roomId for this astrologer
  const { data: callHistoryData } = useGetCallHistoryQuery(
    { userId: userIdLocal, page: 1, limit: 30 },
    { skip: !userIdLocal },
  );
  const { data: chatHistoryData } = useGetUserChatMessagesQuery(
    { userId: userIdLocal, page: 1, limit: 30 },
    { skip: !userIdLocal },
  );

  // Find the most recent roomId for this astrologer from call/chat history
  const lastRoomId = useMemo(() => {
    const astrologerId = data?._id;
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
  }, [data?._id, callHistoryData, chatHistoryData]);
  
  // Use the astrologer connect hook
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  const handleFollow = async () => {
    try {
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      if (!data?._id) return;

      if (!isFollowing) {
        await followAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(
          `We will notify you when ${data?.firstName || ""} goes live or posts an update!`,
        );
      } else {
        await unfollowAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(`You unfollowed ${data?.firstName}`);
      }
    } catch (err) {
      console.log("Follow/Unfollow error:", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${data?.firstName} ${data?.lastName || ""} - Astrologer`,
      text: `Check out ${data?.firstName}'s profile on ShubhTalk`,
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
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
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
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
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



  const handleOpenReviewModal = () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    console.log(data,"123")
    setReviewData({
      astrologerID: data?.astrologer_ID,
      fullName: `${data?.firstName || ""} ${data?.lastName || ""}`.trim(),
      profileImage: data?.profileImgUrl || data?.imageUrl ,
      roomId: lastRoomId,
    });
    setOpenReview(true);
  };

  const handleSetReminder = () => {
    try {
      const astrologerName =
        `${displayData.firstName} ${displayData.lastName}`.trim();

      // Find the next available day from weekly schedule
      const nextAvailable = displayData.weeklySchedule.find((item) => item.time);
      if (!nextAvailable) {
        toast.error("No available consultation hours to set a reminder for.");
        return;
      }

      // Parse the time slot (e.g., "8:00 am - 7:08 pm")
      const timeSlot = nextAvailable.time.split(' - ')[0]; // Get start time
      
      // Get today's date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      // Parse time and convert to 24-hour format
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.trim().split(" ");
        let [hours, minutes = "00"] = time.split(":");
        hours = parseInt(hours);

        if (period === "pm" && hours !== 12) {
          hours += 12;
        } else if (period === "am" && hours === 12) {
          hours = 0;
        }

        return `${String(hours).padStart(2, "0")}${minutes.padStart(2, "0")}`;
      };
      
      const startTime = parseTime(timeSlot);
      
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

      // Format: YYYYMMDDTHHmmss
      const startDateTime = `${year}${month}${day}T${startTime}00`;
      // Add 1 hour duration
      const endHours = String(
        (parseInt(startTime.substring(0, 2)) + 1) % 24,
      ).padStart(2, "0");
      const endDateTime = `${year}${month}${day}T${endHours}${startTime.substring(2, 4)}00`;
      
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
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          userId: userId,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          experience: data?.astrologer?.experience || "",
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
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
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId: lastSelectedKundli?._id,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
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
  const totalReviews = reviewsData?.data?.totalRecords || 0;

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
    firstName: data?.firstName || "Astrologer",
    lastName: data?.lastName || "",
    imageUrl:
      data?.profileImgUrl ||
      getAstrologerDefaultImage(data?.gender),
    specialities:
      data?.specialties?.length > 0
        ? data.specialties.map((s) => (typeof s === "object" ? s.title || s.name : s))
        : ["Vedic Kundli", "Tarot", "Palmistry"],
    expertise:
      data?.expertise?.length > 0
        ? data.expertise.map((e) => (typeof e === "object" ? e.title : e))
        : ["Relationships", "Finance", "Health"],
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

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <ErrorText>Something went wrong!</ErrorText>;
  if (!data) return <ErrorText>Astrologer not found</ErrorText>;

  const StarRating = ({ rating, max = 5 }) => {
    return (
      <div className={styles.starRating}>
        {[...Array(max)].map((_, i) => {
          const starIndex = i + 1;
          if (rating >= starIndex) {
            return <FaStar key={i} className={styles.starFilled} />;
          }
          if (rating >= starIndex - 0.5) {
            return <FaStar key={i} className={styles.starHalf} />;
          }
          return <FaStar key={i} className={styles.starEmpty} />;
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
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
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
                  <Link
                    to={`/astrologer/${astrologer?._id}`}
                    className={styles.cardLink}
                  >
                    <div className={styles.astrologerImageWrapper}>
                      <img
                        src={
                          astrologer.imageUrl ||
                          astrologer?.profileImgUrl ||
                          getAstrologerDefaultImage(astrologer.gender)
                        }
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
                            <g clipPath="url(#clip0_4961_937)">
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
                              <clipPath id="clip0_4961_937">
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
                        {astrologer.firstName} {astrologer.lastName}
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
                  <div className={styles.actionButtons}>
                    {(astrologer?.isActiveType?.includes("all") ||
                      astrologer?.isActiveType?.includes("chat")) && (
                      <div className={styles.buttonWrapper}>
                        <button
                          className={styles.chatBtn}
                          onClick={() => handleChatStart(astrologer)}
                          disabled={!astrologer?.price?.chatRate?.amount}
                        >
                          <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
                        </button>
                        <p className={styles.priceText}>
                          {astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                            <>
                              <span className={styles.originalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{astrologer?.price?.chatRate?.amount || 0}</span> min
                            </>
                          ) : (
                            <>
                              <span className={styles.priceAmount}>₹{astrologer?.price?.chatRate?.amount || 0}</span> min
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    {(astrologer?.isActiveType?.includes("all") ||
                      astrologer?.isActiveType?.includes("audio")) && (
                      <div className={styles.buttonWrapper}>
                        <button
                          className={styles.callBtn}
                          onClick={() => handleCallStart(astrologer, "audio")}
                          disabled={!astrologer?.price?.audioRate?.amount}
                        >
                          <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
                        </button>
                        <p className={styles.priceText}>
                          {astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                            <>
                              <span className={styles.originalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{astrologer?.price?.audioRate?.amount || 0}</span> min
                            </>
                          ) : (
                            <>
                              <span className={styles.priceAmount}>₹{astrologer?.price?.audioRate?.amount || 0}</span> min
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
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
              {data?.astrologerLiveStatus?.isLive && (
                <button
                  className={styles.liveIndicator}
                  onClick={() => navigate(`/live/${data?.astrologerLiveStatus?.roomId || data?._id}`)}
                  aria-label="Astrologer is live, click to watch"
                >
                  <span className={styles.liveDot}></span>
                  LIVE
                </button>
              )}
              <div className={styles.profileImageWrapper}>
                <img
                  src={displayData.imageUrl}
                  alt={displayData.firstName}
                  className={styles.profileImage}
                  onError={(e) => {
                    e.target.src = getAstrologerDefaultImage(data?.gender);
                  }}
                />
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.astrologerName}>
                  {displayData.firstName} {displayData.lastName}
                </h1>
                <p className={styles.expertise}>
                  {displayData.expertise.join(" • ")}
                </p>
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
                <div className={styles.mobileStatusLive} onClick={handleJoinLive}>
                  <Radio size={20} />
                  <span>Live Now</span>
                </div>
              ) : data?.isActive ? (
                <div className={styles.mobileStatusAvailable}>
                  <div className={styles.mobileStatusDot}></div>
                  <span>Available Now</span>
                </div>
              ) : (
                <div className={styles.mobileStatusOffline}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="16" fill="#E0E0E0"/>
                    <path d="M8.34093 7.78665C8.27892 7.72514 8.19507 7.69071 8.10773 7.69089C8.02038 7.69107 7.93667 7.72584 7.87491 7.7876C7.81315 7.84936 7.77838 7.93307 7.7782 8.02042C7.77802 8.10776 7.81245 8.19161 7.87396 8.25362L12.0833 12.4597H12.0537C11.1357 12.4621 10.2527 12.8127 9.58315 13.4408C8.91357 14.0688 8.50724 14.9276 8.44616 15.8436C7.91479 15.9992 7.45737 16.3412 7.15783 16.8069C6.8583 17.2726 6.73676 17.8306 6.81551 18.3787C6.89426 18.9268 7.16802 19.428 7.58656 19.7905C8.00509 20.153 8.54032 20.3524 9.09401 20.3521H19.9758L23.6589 24.0386C23.7213 24.0997 23.8051 24.134 23.8924 24.134C23.9797 24.134 24.0636 24.0997 24.1259 24.0386C24.1875 23.9765 24.2221 23.8926 24.2221 23.8051C24.2221 23.7176 24.1875 23.6337 24.1259 23.5716L8.34093 7.78665Z" fill="#BDBDBD"/>
                    <path d="M23.1163 15.1497C23.355 14.1247 23.2354 13.0488 22.7774 12.1013C22.3194 11.1537 21.5507 10.3916 20.5992 9.94179C19.6478 9.492 18.5709 9.38168 17.548 9.62918C16.5251 9.87669 15.6178 10.4671 14.9772 11.3021C14.6598 11.1658 14.3119 11.1164 13.9691 11.1592C13.6264 11.202 13.3012 11.3353 13.0271 11.5455L21.8338 20.3521H22.577C23.2276 20.3526 23.8553 20.1118 24.3387 19.6762C24.822 19.2407 25.1267 18.6414 25.1938 17.9942C25.2609 17.3471 25.0856 16.698 24.7019 16.1726C24.3181 15.6472 23.7532 15.2827 23.1163 15.1497Z" fill="#BDBDBD"/>
                  </svg>
                  <span>Offline</span>
                </div>
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
              <div className={styles.statItem}>
                <img
                  src={RatingIcon}
                  alt="Rating"
                  className={styles.statIcon}
                />
                <div className={styles.statValue}>
                  {Number(displayData.rating).toFixed(1)}
                </div>
                <div className={styles.statLabel}>Rating</div>
              </div>
            </div>

            {/* Consultation Hours */}
            <div className={styles.consultationHours}>
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
              <button
                className={styles.reminderBtnFull}
                onClick={handleSetReminder}
              >
                <img
                  src={NotificationIcon}
                  alt="Notification"
                  className={styles.notificationIcon}
                />
                Set Reminder
              </button>
            </div>

            {/* Minutes Section */}
            <div className={styles.minutesSection}>
              <div className={styles.minuteItem}>
                <img
                  src={ChatMinutesIcon}
                  alt="Chat"
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.chatMinutes}
                </div>
                <div className={styles.minuteLabel}>Chat Minutes</div>
              </div>
              <div className={styles.minuteDivider}></div>
              <div className={styles.minuteItem}>
                <img
                  src={CallMinutesIcon}
                  alt="Call"
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.audioMinutes}
                </div>
                <div className={styles.minuteLabel}>Call Minutes</div>
              </div>
              <div className={styles.minuteDivider}></div>
              <div className={styles.minuteItem}>
                <img
                  src={VideoMinutesIcon}
                  alt="Video"
                  className={styles.minuteIcon}
                />
                <div className={styles.minuteValue}>
                  {displayData.metrics.videoMinutes}
                </div>
                <div className={styles.minuteLabel}>Video Minutes</div>
              </div>
            </div>

            {/* About Section */}
            {(displayData.description || displayData.gallery?.length > 0) && (
            <div className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>About</h3>

              {displayData.description && (
              <p
                className={`${styles.aboutText} ${
                  showFullAbout ? styles.expanded : ""
                }`}
              >
                {showFullAbout
                  ? displayData.description
                  : displayData.description}
              </p>
              )}

              {displayData.description?.length > 200 && (
                <button
                  className={styles.readMoreBtn}
                  onClick={() => setShowFullAbout((prev) => !prev)}
                >
                  {showFullAbout ? "Read Less" : "Read More"}
                </button>
              )}

              {/* Video Gallery */}
              {displayData.gallery.length > 0 && (
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
                      {/* <div className={styles.playButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                          <path d="M0.490356 6.06335L0.490356 3.73566C0.490356 0.845659 2.53689 -0.337802 5.04113 1.1072L7.06151 2.27104L9.08189 3.43489C11.5861 4.87989 11.5861 7.24681 9.08189 8.69181L7.06151 9.85566L5.04113 11.0195C2.53689 12.4645 0.490356 11.281 0.490356 8.39104L0.490356 6.06335Z" stroke="#FEFEFE" stroke-width="0.980769" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div> */}
                    </div>
                  ))}
                </div>
              )}
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

            {/* User Reviews */}
            <div className={styles.reviewsSection}>
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
                <StarRating rating={averageRating} />
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
                </div>
              ) : (
                <div className={styles.noReviews}>
                  No reviews yet. Be the first to review!
                </div>
              )}

              <button
                className={styles.shareReviewBtn}
                onClick={handleOpenReviewModal}
              >
                Share a Review
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
            <div className={styles.liveCard} onClick={handleJoinLive}>
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
              <button className={styles.joinLiveSidebarBtn} onClick={handleJoinLive}>
                Join
              </button>
            </div>
          ) : data?.isActive ? (
            <div className={styles.availableCard}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>Available Now</span>
            </div>
          ) : (
            <div className={styles.offlineCard}>
              <div className={styles.offlineIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="16" fill="#E0E0E0"/>
                  <path d="M8.34093 7.78665C8.27892 7.72514 8.19507 7.69071 8.10773 7.69089C8.02038 7.69107 7.93667 7.72584 7.87491 7.7876C7.81315 7.84936 7.77838 7.93307 7.7782 8.02042C7.77802 8.10776 7.81245 8.19161 7.87396 8.25362L12.0833 12.4597H12.0537C11.1357 12.4621 10.2527 12.8127 9.58315 13.4408C8.91357 14.0688 8.50724 14.9276 8.44616 15.8436C7.91479 15.9992 7.45737 16.3412 7.15783 16.8069C6.8583 17.2726 6.73676 17.8306 6.81551 18.3787C6.89426 18.9268 7.16802 19.428 7.58656 19.7905C8.00509 20.153 8.54032 20.3524 9.09401 20.3521H19.9758L23.6589 24.0386C23.7213 24.0997 23.8051 24.134 23.8924 24.134C23.9797 24.134 24.0636 24.0997 24.1259 24.0386C24.1875 23.9765 24.2221 23.8926 24.2221 23.8051C24.2221 23.7176 24.1875 23.6337 24.1259 23.5716L8.34093 7.78665Z" fill="#BDBDBD"/>
                  <path d="M23.1163 15.1497C23.355 14.1247 23.2354 13.0488 22.7774 12.1013C22.3194 11.1537 21.5507 10.3916 20.5992 9.94179C19.6478 9.492 18.5709 9.38168 17.548 9.62918C16.5251 9.87669 15.6178 10.4671 14.9772 11.3021C14.6598 11.1658 14.3119 11.1164 13.9691 11.1592C13.6264 11.202 13.3012 11.3353 13.0271 11.5455L21.8338 20.3521H22.577C23.2276 20.3526 23.8553 20.1118 24.3387 19.6762C24.822 19.2407 25.1267 18.6414 25.1938 17.9942C25.2609 17.3471 25.0856 16.698 24.7019 16.1726C24.3181 15.6472 23.7532 15.2827 23.1163 15.1497Z" fill="#BDBDBD"/>
                </svg>
              </div>
              <span className={styles.offlineText}>Offline</span>
            </div>
          )}

          {/* Connect Now Card — hidden when astrologer is live streaming */}
          {!isLive && <div className={styles.connectCard}>
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
                  Emergency Session{(() => {
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
                <div
                  className={`${styles.connectOption} ${(!data?.isActive || !(data?.isActiveType?.includes("all") || data?.isActiveType?.includes("chat")) || !data?.price?.chatRate?.amount) ? styles.connectOptionDisabled : ""}`}
                  onClick={() =>
                    data?.isActive &&
                    (data?.isActiveType?.includes("all") || data?.isActiveType?.includes("chat")) &&
                    data?.price?.chatRate?.amount && handleChatStart(data)
                  }
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
                </div>

                <div
                  className={`${styles.connectOption} ${(!data?.isActive || !(data?.isActiveType?.includes("all") || data?.isActiveType?.includes("audio")) || !data?.price?.audioRate?.amount) ? styles.connectOptionDisabled : ""}`}
                  onClick={() =>
                    data?.isActive &&
                    (data?.isActiveType?.includes("all") || data?.isActiveType?.includes("audio")) &&
                    data?.price?.audioRate?.amount &&
                    handleCallStart(data, "audio")
                  }
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
                </div>

                <div
                  className={`${styles.connectOption} ${(!data?.isActive || !(data?.isActiveType?.includes("all") || data?.isActiveType?.includes("video")) || !data?.price?.videoCallRate?.amount) ? styles.connectOptionDisabled : ""}`}
                  onClick={() =>
                    data?.isActive &&
                    (data?.isActiveType?.includes("all") || data?.isActiveType?.includes("video")) &&
                    data?.price?.videoCallRate?.amount &&
                    handleCallStart(data, "video")
                  }
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
                </div>
              </div>
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
            <button
              className={styles.reminderBtnFull}
              onClick={handleSetReminder}
            >
              <img
                src={NotificationIcon}
                alt="Notification"
                className={styles.notificationIcon}
              />
              Set Reminder
            </button>
          </div>
        </aside>
      </div>
      {/* End 3-Column Layout */}

      {/* Mobile Bottom Bar - Chat & Call */}
      <div className={styles.mobileBottomBar}>
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
            Emergency Session{(() => {
              const eChatRate = Number(data?.emergencyPrice?.chatRate?.amount) || 0;
              const eCallRate = Number(data?.emergencyPrice?.audioRate?.amount) || 0;
              const minRate = eChatRate > 0 && eCallRate > 0 ? Math.min(eChatRate, eCallRate) : eChatRate || eCallRate;
              return minRate > 0 ? ` - ₹${minRate}/min` : '';
            })()}
          </button>
        ) : (
          <>
            <button
              className={styles.mobileChatBtn}
              onClick={() => handleChatStart(data)}
              disabled={!data?.isActive || !(data?.isActiveType?.includes("all") || data?.isActiveType?.includes("chat")) || !data?.price?.chatRate?.amount}
            >
              <img src={ChatMinutesIcon} alt="Chat" className={styles.mobileBtnIcon} />
              <div className={styles.btnContent}>
                <span className={styles.btnLabel}>Chat</span>
                <span className={styles.btnPrice}>
                  ₹{data?.price?.chatRate?.amount || 0}/min
                  {data?.price?.chatRate?.isDiscountActive && data?.price?.chatRate?.beforeDiscountPrice && (
                    <span className={styles.originalPrice}>₹{data?.price?.chatRate?.beforeDiscountPrice}/min</span>
                  )}
                </span>
              </div>
            </button>
            <button
              className={styles.mobileCallBtn}
              onClick={() => handleCallStart(data, "audio")}
              disabled={!data?.isActive || !(data?.isActiveType?.includes("all") || data?.isActiveType?.includes("audio")) || !data?.price?.audioRate?.amount}
            >
              <img src={CallMinutesIcon} alt="Call" className={styles.mobileBtnIcon} />
              <div className={styles.btnContent}>
                <span className={styles.btnLabel}>Call</span>
                <span className={styles.btnPrice}>
                  ₹{data?.price?.audioRate?.amount || 0}/min
                  {data?.price?.audioRate?.isDiscountActive && data?.price?.audioRate?.beforeDiscountPrice && (
                    <span className={styles.originalPrice}>₹{data?.price?.audioRate?.beforeDiscountPrice}/min</span>
                  )}
                </span>
              </div>
            </button>
          </>
        )}
      </div>

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={data}
        onChatNow={(astro) => handleChatStart(astro, true)}
        onCallNow={(astro) => handleCallStart(astro, "audio", true)}
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

      <StickyReview />

      {/* Waiting Modal — commented out to avoid duplicate with FooterWaiting */}
      {/* {(WaitingList || callWaitingList) && (
        <WaitingModal
          callRoomId={connectionType === "chat" ? chatRoomId : callRoomId}
          resetCallState={resetCallState}
          connectionType={connectionType}
          astrologerName={`${data?.firstName || ""} ${data?.lastName || ""}`.trim()}
        />
      )} */}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        astrologerId={data?._id}
        astrologerName={`${data?.firstName || ""} ${data?.lastName || ""}`}
      />

      {/* Virtual Assistant Chat */}
      <VirtualAssistant
        astrologerId={data?._id}
        astrologerName={`${data?.firstName || ""} ${data?.lastName || ""}`.trim()}
        astrologerImage={data?.profileImgUrl || data?.imageUrl}
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
