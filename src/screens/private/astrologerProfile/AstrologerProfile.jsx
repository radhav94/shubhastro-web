import React, { useEffect, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaPlay, FaStar, FaChevronRight } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import {
  IoChevronBack,
  IoPaperPlaneOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import { MdNotifications } from "react-icons/md";
import { BiMessageDetail, BiPhone, BiVideo } from "react-icons/bi";
import { PiBookOpenTextLight, PiUsersThreeBold } from "react-icons/pi";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
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
import { useGetAstrologerReviewsQuery } from "../../../redux/api/review/reviewApi";
import StickyReview from "../home/components/call/StickyReview";
import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useChat } from "../../../context/ChatContext";
import { ProfileManager } from "../../../component/UI/Profile";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";

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
import { getAstrologerDefaultImage } from "../../../utils/appImages";
import GiftModal from "../../../component/call/GiftModal";

const AstrologerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: astrologerData,
    isLoading,
    error,
  } = useGetAstrologerByIdQuery({ id }, { skip: !id });

  const data = astrologerData?.data;
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

  const { data: followingData } = useCheckFollowingStatusQuery(
    { astrologerId: data?._id },
    { skip: !data?._id }
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

  const { activeCall, setActiveCall, setOpenReview, setReviewData } = useCall();
  
  const {
    waitingList: WaitingList,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setActiveChat,
    setChatSeconds,
  } = useChat();
  
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
    
    // Check if already in waiting state
    if (WaitingList || callWaitingList) {
      toast.error(
        "You are already waiting for an astrologer. Please cancel the current request first.",
      );
      return;
    }
    
    activeCallAstroRef.current = data;
    setIsConnectPopupOpen(true);
  };

  const handleChatStart = async (astro) => {
    activeCallAstroRef.current = astro;
    const result = await hookHandleChatStart(astro);
    if (result) {
      setIsConnectPopupOpen(false);
    }
    return result;
  };

  const handleCallStart = async (astro, type) => {
    activeCallAstroRef.current = astro;
    const result = await hookHandleCallStart(astro, type);
    if (result) {
      setIsConnectPopupOpen(false);
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
    setReviewData({
      astrologerID: data?.astrologer_ID,
      fullName: `${data?.firstName || ""} ${data?.lastName || ""}`.trim(),
    });
    setOpenReview(true);
  };

  const handleSetReminder = () => {
    try {
      const astrologerName =
        `${displayData.firstName} ${displayData.lastName}`.trim();
      const availability = displayData.availability[0]; // Get first available slot
      
      // Parse the time slot (e.g., "11 AM - 4 PM")
      const timeSlot = availability.time.split(' - ')[0]; // Get start time
      
      // Get today's date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      // Parse time and convert to 24-hour format
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(" ");
        let [hours, minutes = "00"] = time.split(":");
        hours = parseInt(hours);

        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
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
        `Reminder for consultation with ${astrologerName}\n\nSpecialties: ${displayData.specialities.join(", ")}\nLanguages: ${displayData.languagePreference.join(", ")}`,
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

      const astro = activeCallAstroRef.current;

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          userId: userId,
          astrologerId: astrologerId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
            roomId,
            isUserSide: true,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
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
      type,
      remainingTime,
      isSwitch,
    }) => {
      // If this is a switch from audio to video, let CallContext handle it
      if (isSwitch && type === "video") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      localStorage.removeItem("waitingState");

      const astro = activeCallAstroRef.current;

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
          chatRoomId,
          agoraToken: token,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
        });
      } catch (error) {
        console.error("Call accepted error:", error);
        toast.error("Failed to start call");
      }
    };

    const handleRejected = (data) => {
      // Check if this is a video switch rejection during an active audio call
      if (data?.switchRejected && data?.type === "audio") {
        console.log("🔄 Video switch rejected - audio call continues");
        // Don't reset anything - the audio call should continue
        return;
      }
      
      // Regular call rejection - end everything
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

  // Use the overall rating from API data (not calculated from limited reviews)
  const averageRating = data?.rating || 0;

  // Helper function to format availability slots
  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return [
        { day: "Monday - Friday", time: "11 AM - 4 PM" },
        { day: "Evening", time: "7 PM - 10 PM" },
      ];
    }

    // Get today's day
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // Find today's availability or use first available day
    const todaySlots =
      availability.find((a) => a.day === today) || availability[0];

    if (!todaySlots || !todaySlots.slots || todaySlots.slots.length === 0) {
      return [
        { day: "Monday - Friday", time: "11 AM - 4 PM" },
        { day: "Evening", time: "7 PM - 10 PM" },
      ];
    }

    // Format slots
    return todaySlots.slots.map((slot) => ({
      day: todaySlots.day,
      time: `${slot.start} - ${slot.end}`,
    }));
  };

  // Fallback data - only used when API data is missing
  const displayData = {
    firstName: data?.firstName || "Astrologer",
    lastName: data?.lastName || "",
    imageUrl:
      data?.imageUrl ||
      data?.aadharCardImgUrl ||
      data?.panCardImgUrl ||
      getAstrologerDefaultImage(data?.gender),
    specialities:
      data?.specialties?.length > 0
        ? data.specialties
        : ["Vedic Kundli", "Tarot", "Palmistry"],
    expertise:
      data?.expertise?.length > 0
        ? data.expertise
        : ["Relationships", "Finance", "Health"],
    languagePreference:
      data?.languagePreference?.length > 0
        ? data.languagePreference
        : ["English", "Hindi"],
    experience: data?.experience ?? 20,
    totalConsultations: data?.totalConsultations ?? 1200,
    rating: data?.rating ?? 4.5,
    totalRatings: data?.totalRatings ?? 1020,
    availability: formatAvailability(data?.availability),
    metrics: {
      chatMinutes: data?.metrics?.chatMinutes ?? 0,
      audioMinutes: data?.metrics?.audioMinutes ?? 0,
      videoMinutes: data?.metrics?.videoMinutes ?? 0,
    },
    description:
      data?.description ||
      "With years of dedicated practice, I've guided thousands of individuals across love, career, health, and life direction. My work combines classical Vedic principles with deep intuitive understanding, helping clients receive...",
    gallery:
      data?.gallery?.length > 0
        ? data.gallery
        : [
            "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+1",
            "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+2",
            "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+3",
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

      <div className={styles.profileContentMain}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
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
            <p className={styles.skills}>
              {displayData.specialities.join(" • ")}
            </p>
            <p className={styles.expertise}>
              {displayData.expertise.join(" • ")}
            </p>
            <div className={styles.languages}>
              {displayData.languagePreference.map((lang, i) => (
                <span key={i} className={styles.languageTag}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <img
              src={ExperienceIcon}
              alt="Experience"
              className={styles.statIcon}
            />
            <div className={styles.statValue}>{displayData.experience}+</div>
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
            <img src={RatingIcon} alt="Rating" className={styles.statIcon} />
            <div className={styles.statValue}>{Number(displayData.rating).toFixed(1)}</div>
            <div className={styles.statLabel}>Rating</div>
          </div>
        </div>

        {/* Consultation Hours */}
        <div className={styles.consultationHours}>
          <div className={styles.hoursHeader}>
            <img src={TimeIcon} alt="Time" className={styles.clockIcon} />
            <span className={styles.hoursTitle}>Consultation Hours</span>
          </div>
          <div className={styles.hoursContent}>
            <div className={styles.timeSlots}>
              {displayData.availability.map((slot, index) => (
                <div key={index} className={styles.timeSlot}>
                  {slot.time}
                </div>
              ))}
            </div>
            <button className={styles.reminderBtn} onClick={handleSetReminder}>
              <img
                src={NotificationIcon}
                alt="Notification"
                className={styles.notificationIcon}
              />
              Set Reminder
            </button>
          </div>
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
        <div className={styles.aboutSection}>
          <h3 className={styles.aboutTitle}>About</h3>
          <p
            className={`${styles.aboutText} ${showFullAbout ? styles.expanded : ""}`}
          >
            {displayData.description}
          </p>
          {displayData.description.length > 150 && (
            <button
              className={styles.readMoreBtn}
              onClick={() => setShowFullAbout(!showFullAbout)}
            >
              {showFullAbout ? "Read Less" : "Read More"}
            </button>
          )}

          {/* Video Gallery */}
          {displayData.gallery.length > 0 && (
            <div className={styles.videoGallery}>
              {displayData.gallery.slice(0, 3).map((video, index) => (
                <div key={index} className={styles.videoThumbnail}>
                  <img
                    src={video || AstrologerNumerologyDefault}
                    alt={`Video ${index + 1}`}
                    onError={(e) => {
                      e.target.src = AstrologerNumerologyDefault;
                    }}
                  />
                  <div className={styles.playButton}>
                    <FaPlay />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send a Gift Section */}
        <div className={styles.giftSection}>
          <div className={styles.giftContent}>
            <h3 className={styles.giftTitle}>Send a Gift</h3>
            <p className={styles.giftSubtitle}>
              Show your appreciation to your favorite astrologer.
            </p>
            <button
              className={styles.sendNowBtn}
              onClick={() => setIsGiftModalOpen(true)}
            >
              Send Now
            </button>
          </div>
          <div className={styles.giftImage}>
            <img src={SendGiftImage} alt="Send Gift" />
          </div>
        </div>

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
              {averageRating.toFixed(1)} out of 5 • {totalReviews} total ratings
            </p>
          </div>

          {reviewsLoading ? (
            <div className={styles.reviewsLoading}>Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.slice(0, 4).map((review) => (
                <div key={review._id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewDate}>
                      <IoCalendarOutline className={styles.calendarIcon} />
                      {new Date(review.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <div className={styles.reviewRating}>
                      <FaStar className={styles.reviewStar} />
                      <span>{Number(review.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  <h4 className={styles.reviewerName}>{review.customerName?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</h4>
                  {review.review && (
                    <p className={styles.reviewText}>{review.review}</p>
                  )}
                </div>
              ))}
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
        <div className={styles.shopSection}>
          <div className={styles.shopHeader}>
            <h3 className={styles.sectionTitle}>Check out Astrologers Shop</h3>
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
                  <p className={styles.productDesc}>{product.description}</p>
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
                  <button className={styles.addToCartBtn}>+ Add to cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Connect Button */}
      {/* <div className={styles.bottomBar}>
        <button
          className={styles.connectNowBtn}
          onClick={handleConnectClick}
        >
          Connect Now
        </button>
      </div> */}

      {/* Modals */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={data}
        onChatStart={handleChatStart}
        onCallStart={handleCallStart}
      />

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
      {hookOpenModal.recharge && (
        <RechargeModal
          isOpen={hookOpenModal.recharge}
          onClose={() =>
            hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
          }
        />
      )}

      <StickyReview />

      {/* Waiting Modal */}
      {/* {(WaitingList || callWaitingList) && (
        <WaitingModal
          isOpen={WaitingList || callWaitingList}
          onClose={resetCallState}
          waitingTime={WaitingList || callWaitingList}
          connectionType={connectionType}
        />
      )} */}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        astrologerId={data?._id}
        astrologerName={`${data?.firstName || ""} ${data?.lastName || ""}`}
      />
    </div>
  );
};

export default AstrologerProfile;
