import React, { useEffect, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaPlay, FaStar, FaChevronRight } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import { IoChevronBack, IoPaperPlaneOutline, IoCalendarOutline } from "react-icons/io5";
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
} from "../../../redux/api/astrologer/followAstrologerApi";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useCall } from "../../../context/CallContext";
import { getToken } from "../../../utils/token";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import { useTalkToAstrologer } from "../talkToAstrologer/useTalkToAstrologer";
import { useWalletBalance } from "../wallet/useWalletBalance";
import KundliSelectModal from "../talkToAstrologer/kundliSelect/KundliSelectModal";
import { useAddAstrologerReviewMutation, useGetAstrologerReviewsQuery } from "../../../redux/api/review/reviewApi";
import FeedbackModal from "../home/components/chats/FeedbackModal";

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
import AstrologerPlaceholder from "../../../assets/images/astrologer-square.svg";

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
    { skip: !data?.astrologer_ID }
  );
  
  const isInitiallyFollowing = astrologerData?.data?.isFollowing || false;
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const [createChatRoom] = useCreateChatRoomMutation();
  const [addAstrologerReview, { isLoading: reviewLoading }] = useAddAstrologerReviewMutation();
  const [setOpenModal] = useTalkToAstrologer();

  // State
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [waitingPopup, setWaitingPopup] = useState(false);

  const { activeCall, setActiveCall } = useCall();

  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null);
  const [callRoomId, setCallRoomId] = useState(null);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = getToken();
  const { balance } = useWalletBalance();

  const handleFollow = async () => {
    try {
      if (!data?._id) return;

      if (!isFollowing) {
        await followAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(
          `We will notify you when ${data?.firstName || ""} goes live or posts an update!`
        );
      } else {
        await unfollowAstrologer({ astrologerId: data._id }).unwrap();
        toast.success(`You unfollowed ${data?.firstName}`);
      }

      setIsFollowing(!isFollowing);
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
        console.log("Share error:", err);
        toast.error("Failed to share profile");
      }
    }
  };

  const openKundliPopup = (astro) => {
    setSelectedAstrologer(astro);
    if (token) {
      setKundliModalOpen(true);
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli?._id) return toast.error("Kundli not selected properly");
    if (!selectedAstrologer?._id) return toast.error("Astrologer not selected");
    if (!userIdLocal) return toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      const res = await createChatRoom({
        userId: userIdLocal,
        astrologerId: astro._id,
      });

      const roomId = res?.data?.data;
      if (!roomId) return toast.error("Room ID missing");

      navigate(`/chat-with-astrologers/${astro._id}`, {
        state: {
          userId: userIdLocal,
          astrologerId: astro._id,
          fullName: astro.firstName,
          roomId,
          isUserSide: true,
          kundliId: kundli._id,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const connectSocket = () => {
    if (voiceSocket.connected) voiceSocket.disconnect();

    voiceSocket.io.opts.query = {
      userId: userIdLocal,
      role: "CUSTOMER",
    };

    voiceSocket.connect();
  };

  const initiateCall = (astro, type) => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!astro) return toast.error("Astrologer missing");
    if (!userIdLocal) return toast.error("User ID missing");

    const price = astro?.price?.amount || 0;
    if (balance < price) {
      setSelectedAstrologer(astro);
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    if (activeCall) {
      return toast.error("You are already on a call");
    }

    activeCallAstroRef.current = astro;
    setWaitingPopup(true);

    connectSocket();

    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type,
    });
  };

  const handleAudioCall = (astro) => {
    initiateCall(astro, "audio");
  };

  const handleVideoCall = (astro) => {
    initiateCall(astro, "video");
  };

  const handleReviewSubmit = async ({ rating, review, anonymous }) => {
    try {
      const res = await addAstrologerReview({
        astrologerID: data?.astrologer_ID,
        rating,
        review,
        isAnonymous: anonymous,
      }).unwrap();

      if (res.success) {
        toast.success(res.message || "Review submitted successfully!");
        refetchReviews(); // Refresh reviews after submission
      } else {
        toast.error(res.message || "Failed to submit review");
      }

      setOpenReviewModal(false);
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(error?.data?.message || "Failed to submit review");
    }
  };

  useEffect(() => {
    if (!userIdLocal) return;

    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setWaitingPopup(true);
    };

    const handleCallAccepted = async ({ roomId, token, type }) => {
      setWaitingPopup(false);

      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        const res = await createChatRoom({
          userId: userIdLocal,
          astrologerId: astro._id,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error();

        setActiveCall({
          roomId,
          chatRoomId,
          agoraToken: token,
          callerName: astro.firstName,
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologerID
        });
      } catch {
        toast.error("Failed to start chat");
      }
    };

    const handleCallRejected = (data) => {
      toast.error(data?.sessionData?.sessionEndReason || "Call rejected");
      setWaitingPopup(false);
      voiceSocket.disconnect();
    };

    const handleSocketError = (err) => {
      toast.error(err?.message || "Connection error");
      setWaitingPopup(false);
      voiceSocket.disconnect();
    };

    const handleCallEnded = () => {
      setWaitingPopup(false);
      voiceSocket.disconnect();
    };

    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call_ended", handleCallEnded);
    };
  }, [userIdLocal]);

  const reviews = reviewsData?.data?.getDetail || [];
  const totalReviews = reviewsData?.data?.totalRecords || 0;
  
  // Calculate average rating from reviews
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : data?.rating || 0;
  
  // Helper function to format availability slots
  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return [
        { day: "Monday - Friday", time: "11 AM - 4 PM" },
        { day: "Evening", time: "7 PM - 10 PM" }
      ];
    }

    // Get today's day
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    // Find today's availability or use first available day
    const todaySlots = availability.find(a => a.day === today) || availability[0];
    
    if (!todaySlots || !todaySlots.slots || todaySlots.slots.length === 0) {
      return [
        { day: "Monday - Friday", time: "11 AM - 4 PM" },
        { day: "Evening", time: "7 PM - 10 PM" }
      ];
    }

    // Format slots
    return todaySlots.slots.map(slot => ({
      day: todaySlots.day,
      time: `${slot.start} - ${slot.end}`
    }));
  };

  // Fallback data - only used when API data is missing
  const displayData = {
    firstName: data?.firstName || "Astrologer",
    lastName: data?.lastName || "",
    imageUrl: data?.imageUrl || "",
    specialities: data?.specialties?.length > 0 ? data.specialties : ["Vedic Kundli", "Tarot", "Palmistry"],
    expertise: data?.expertise?.length > 0 ? data.expertise : ["Relationships", "Finance", "Health"],
    languagePreference: data?.languagePreference?.length > 0 ? data.languagePreference : ["English", "Hindi"],
    experience: data?.experience ?? 20,
    totalConsultations: data?.totalConsultations ?? 1200,
    rating: data?.rating ?? 4.5,
    totalRatings: data?.totalRatings ?? 1020,
    availability: formatAvailability(data?.availability),
    chatMinutes: data?.chatMinutes ?? 1500,
    callMinutes: data?.callMinutes ?? 1200,
    videoMinutes: data?.videoMinutes ?? 4.5,
    description: data?.description || "With years of dedicated practice, I've guided thousands of individuals across love, career, health, and life direction. My work combines classical Vedic principles with deep intuitive understanding, helping clients receive...",
    gallery: data?.gallery?.length > 0 ? data.gallery : [
      "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+1",
      "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+2",
      "https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Video+3"
    ],
    reviews: reviews.length > 0 ? reviews.map(r => ({
      date: new Date(r.createdAt).toLocaleDateString('en-GB'),
      rating: r.rating,
      user: r.customerName,
      text: r.review || ""
    })) : [
      {
        date: "25/11/2025",
        rating: 5.0,
        user: "Rahul Sharma",
        text: "The insights provided were life-changing, helping me to see my path clearly."
      },
      {
        date: "26/11/2025",
        rating: 4.8,
        user: "Anjali Verma",
        text: "I felt a deep connection and understood my purpose in life better after our session."
      },
      {
        date: "27/11/2025",
        rating: 4.2,
        user: "Sameer Rao",
        text: "The advice was practical and easy to implement, making a positive impact on my daily routine."
      },
      {
        date: "28/11/2025",
        rating: 4.9,
        user: "Sneha Iyer",
        text: "I appreciated the warmth and empathy shown during our discussion; it truly felt supportive."
      }
    ],
    products: data?.products?.length > 0 ? data.products : [
      {
        name: "Crystal Set",
        description: "Amethyst + Quartz +",
        price: 1500,
        originalPrice: 2200,
        image: "",
        isPopular: true
      },
      {
        name: "Astrology Journal",
        description: "Leather-bound",
        price: 800,
        originalPrice: 1200,
        image: "",
        isPopular: true
      },
      {
        name: "Reading Cards",
        description: "Detailed illustrations",
        price: 3500,
        originalPrice: null,
        image: "",
        isPopular: true
      }
    ]
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
            {followLoading || unfollowLoading ? "..." : isFollowing ? "Following" : "Follow"}
          </button>
          <button className={styles.shareBtn} onClick={handleShare}>
            <img src={ShareIcon} alt="Share" className={styles.shareIcon} />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileImageWrapper}>
          <img 
            src={displayData.imageUrl || AstrologerPlaceholder} 
            alt={displayData.firstName} 
            className={styles.profileImage}
          />
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.astrologerName}>{displayData.firstName} {displayData.lastName}</h1>
          <p className={styles.skills}>{displayData.specialities.join(" • ")}</p>
          <p className={styles.expertise}>{displayData.expertise.join(" • ")}</p>
          <div className={styles.languages}>
            {displayData.languagePreference.map((lang, i) => (
              <span key={i} className={styles.languageTag}>{lang}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statItem}>
          <img src={ExperienceIcon} alt="Experience" className={styles.statIcon} />
          <div className={styles.statValue}>{displayData.experience}+</div>
          <div className={styles.statLabel}>Experience</div>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <img src={ConsultationsIcon} alt="Consultations" className={styles.statIcon} />
          <div className={styles.statValue}>{displayData.totalConsultations}</div>
          <div className={styles.statLabel}>Consultations</div>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <img src={RatingIcon} alt="Rating" className={styles.statIcon} />
          <div className={styles.statValue}>{displayData.rating}</div>
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
              <div key={index} className={styles.timeSlot}>{slot.time}</div>
            ))}
          </div>
          <button className={styles.reminderBtn}>
            <img src={NotificationIcon} alt="Notification" className={styles.notificationIcon} />
            Set Reminder
          </button>
        </div>
      </div>

      {/* Minutes Section */}
      <div className={styles.minutesSection}>
        <div className={styles.minuteItem}>
          <img src={ChatMinutesIcon} alt="Chat" className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{displayData.chatMinutes}</div>
          <div className={styles.minuteLabel}>Chat Minutes</div>
        </div>
        <div className={styles.minuteDivider}></div>
        <div className={styles.minuteItem}>
          <img src={CallMinutesIcon} alt="Call" className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{displayData.callMinutes}</div>
          <div className={styles.minuteLabel}>Call Minutes</div>
        </div>
        <div className={styles.minuteDivider}></div>
        <div className={styles.minuteItem}>
          <img src={VideoMinutesIcon} alt="Video" className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{displayData.videoMinutes}</div>
          <div className={styles.minuteLabel}>Video Minutes</div>
        </div>
      </div>

      {/* About Section */}
      <div className={styles.aboutSection}>
        <h3 className={styles.aboutTitle}>About</h3>
        <p className={`${styles.aboutText} ${showFullAbout ? styles.expanded : ""}`}>
          {displayData.description}
        </p>
        {displayData.description.length > 150 && (
          <button className={styles.readMoreBtn} onClick={() => setShowFullAbout(!showFullAbout)}>
            {showFullAbout ? "Read Less" : "Read More"}
          </button>
        )}

        {/* Video Gallery */}
        {displayData.gallery.length > 0 && (
          <div className={styles.videoGallery}>
            {displayData.gallery.slice(0, 3).map((video, index) => (
              <div key={index} className={styles.videoThumbnail}>
                <img src={video} alt={`Video ${index + 1}`} />
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
          <p className={styles.giftSubtitle}>Show your appreciation to your favorite astrologer.</p>
          <button className={styles.sendNowBtn}>Send Now</button>
        </div>
        <div className={styles.giftImage}>
          <img src={SendGiftImage} alt="Send Gift" />
        </div>
      </div>

      {/* User Reviews */}
      <div className={styles.reviewsSection}>
        <h3 className={styles.sectionTitle}>USER REVIEWS</h3>
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
                    {new Date(review.createdAt).toLocaleDateString('en-GB')}
                  </span>
                  <div className={styles.reviewRating}>
                    <FaStar className={styles.reviewStar} />
                    <span>{review.rating}</span>
                  </div>
                </div>
                <h4 className={styles.reviewerName}>{review.customerName}</h4>
                {review.review && <p className={styles.reviewText}>{review.review}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noReviews}>No reviews yet. Be the first to review!</div>
        )}

        <button className={styles.shareReviewBtn} onClick={() => setOpenReviewModal(true)}>
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
                  <span className={styles.currentPrice}>₹{product.price}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                  )}
                </div>
                <button className={styles.addToCartBtn}>+ Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Connect Button */}
      <div className={styles.bottomBar}>
        <button className={styles.connectNowBtn} onClick={() => openKundliPopup(data)}>
          Connect Now
        </button>
      </div>

      {/* Modals */}
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      <FeedbackModal
        open={openReviewModal}
        onClose={() => setOpenReviewModal(false)}
        handleSubmit={handleReviewSubmit}
        ratedUserName={displayData.firstName}
        reviewerName={userIdLocal || "User"}
        loading={reviewLoading}
      />

      {waitingPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText size_18 isSemiBold>
              ⏳ Connecting to astrologer…
            </PrimaryText>
            <PrimaryText size_14 color="#777">
              Please wait while astrologer accepts the call
            </PrimaryText>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  voiceSocket.emit("cancel_call", { roomId: callRoomId });
                  setWaitingPopup(false);
                  setCallRoomId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologerProfile;
