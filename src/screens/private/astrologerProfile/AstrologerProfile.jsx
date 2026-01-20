import React, { useEffect, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaPlay, FaStar, FaChevronRight } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import { IoChevronBack, IoPaperPlaneOutline } from "react-icons/io5";
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

const AstrologerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: astrologerData,
    isLoading,
    error,
  } = useGetAstrologerByIdQuery({ id }, { skip: !id });
  
  const isInitiallyFollowing = astrologerData?.data?.isFollowing || false;
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  const [showFullAbout, setShowFullAbout] = useState(false);

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const [createChatRoom] = useCreateChatRoomMutation();
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

  const data = astrologerData?.data;
  
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
            <IoPaperPlaneOutline />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileImageWrapper}>
          <img 
            src={data?.imageUrl} 
            alt={data?.firstName} 
            className={styles.profileImage}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.astrologerName}>{data?.firstName} {data?.lastName}</h1>
          {data?.specialities && data.specialities.length > 0 && (
            <p className={styles.skills}>{data.specialities.join(" • ")}</p>
          )}
          {data?.expertise && data.expertise.length > 0 && (
            <p className={styles.expertise}>{data.expertise.join(" • ")}</p>
          )}
          {data?.languagePreference && data.languagePreference.length > 0 && (
            <div className={styles.languages}>
              {data.languagePreference.map((lang, i) => (
                <span key={i} className={styles.languageTag}>{lang}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statItem}>
          <PiBookOpenTextLight className={styles.statIcon} />
          <div className={styles.statValue}>{data?.experience || 0}+</div>
          <div className={styles.statLabel}>Experience</div>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <PiUsersThreeBold className={styles.statIcon} />
          <div className={styles.statValue}>{data?.totalConsultations || 0}</div>
          <div className={styles.statLabel}>Consultations</div>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <FaStar className={styles.statIcon} />
          <div className={styles.statValue}>{data?.rating || 0}</div>
          <div className={styles.statLabel}>Rating</div>
        </div>
      </div>

      {/* Consultation Hours */}
      <div className={styles.consultationHours}>
        <div className={styles.hoursHeader}>
          <IoMdTime className={styles.clockIcon} />
          <span className={styles.hoursTitle}>Consultation Hours</span>
        </div>
        <div className={styles.hoursContent}>
          <div className={styles.timeSlots}>
            <div className={styles.timeSlot}>11 AM - 4 PM</div>
            <div className={styles.timeSlot}>7 PM - 10 PM</div>
          </div>
          <button className={styles.reminderBtn}>
            <MdNotifications />
            Set Reminder
          </button>
        </div>
      </div>

      {/* Minutes Section */}
      <div className={styles.minutesSection}>
        <div className={styles.minuteItem}>
          <BiMessageDetail className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{data?.chatMinutes || 0}</div>
          <div className={styles.minuteLabel}>Chat Minutes</div>
        </div>
        <div className={styles.minuteDivider}></div>
        <div className={styles.minuteItem}>
          <BiPhone className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{data?.callMinutes || 0}</div>
          <div className={styles.minuteLabel}>Call Minutes</div>
        </div>
        <div className={styles.minuteDivider}></div>
        <div className={styles.minuteItem}>
          <BiVideo className={styles.minuteIcon} />
          <div className={styles.minuteValue}>{data?.videoMinutes || 0}</div>
          <div className={styles.minuteLabel}>Video Minutes</div>
        </div>
      </div>

      {/* About Section */}
      {data?.description && (
        <div className={styles.aboutSection}>
          <h3 className={styles.sectionTitle}>About</h3>
          <p className={`${styles.aboutText} ${showFullAbout ? styles.expanded : ""}`}>
            {data.description}
          </p>
          {data.description.length > 150 && (
            <button className={styles.readMoreBtn} onClick={() => setShowFullAbout(!showFullAbout)}>
              {showFullAbout ? "Read Less" : "Read More"}
            </button>
          )}
        </div>
      )}

      {/* Video Gallery */}
      {data?.gallery && data.gallery.length > 0 && (
        <div className={styles.videoGallery}>
          {data.gallery.slice(0, 3).map((video, index) => (
            <div key={index} className={styles.videoThumbnail}>
              <img src={video} alt={`Video ${index + 1}`} />
              <div className={styles.playButton}>
                <FaPlay />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send a Gift Section */}
      <div className={styles.giftSection}>
        <div className={styles.giftContent}>
          <h3 className={styles.giftTitle}>Send a Gift</h3>
          <p className={styles.giftSubtitle}>Show your appreciation to your favorite astrologer.</p>
          <button className={styles.sendNowBtn}>Send Now</button>
        </div>
        <div className={styles.giftImage}>
          {/* Gift icon or image can be added here */}
        </div>
      </div>

      {/* User Reviews */}
      {data?.rating && (
        <div className={styles.reviewsSection}>
          <h3 className={styles.sectionTitle}>USER REVIEWS</h3>
          <div className={styles.reviewsSummary}>
            <StarRating rating={data.rating} />
            <p className={styles.reviewsCount}>{data.rating} out of 5 • {data?.totalReviews || 0} total ratings</p>
          </div>

          {data?.reviews && data.reviews.length > 0 && (
            <div className={styles.reviewsList}>
              {data.reviews.slice(0, 4).map((review, index) => (
                <div key={index} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewDate}>📅 {review.date}</span>
                    <div className={styles.reviewRating}>
                      <FaStar className={styles.reviewStar} />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                  <h4 className={styles.reviewerName}>{review.user}</h4>
                  <p className={styles.reviewText}>{review.text}</p>
                </div>
              ))}
            </div>
          )}

          <button className={styles.shareReviewBtn}>Share a Review</button>
        </div>
      )}

      {/* Astrologer Shop */}
      {data?.products && data.products.length > 0 && (
        <div className={styles.shopSection}>
          <div className={styles.shopHeader}>
            <h3 className={styles.sectionTitle}>Check out Astrologers Shop</h3>
            <FaChevronRight className={styles.chevronIcon} />
          </div>
          <div className={styles.productGrid}>
            {data.products.slice(0, 3).map((product, index) => (
              <div key={index} className={styles.productCard}>
                {product.isPopular && (
                  <div className={styles.productBadge}>
                    <FaStar className={styles.badgeStar} />
                    Most Popular
                  </div>
                )}
                <img src={product.image} alt={product.name} className={styles.productImage} />
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
            ))}
          </div>
        </div>
      )}

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
