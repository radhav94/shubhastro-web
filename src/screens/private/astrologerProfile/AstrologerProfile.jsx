import React, { useEffect, useRef, useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaCheckCircle, FaVideo } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaComments } from "react-icons/fa";
import GiftSection from "./GiftSection";
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

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const [createChatRoom] = useCreateChatRoomMutation();
    const [
      setOpenModal,
    ] = useTalkToAstrologer();

    // State
      const [kundliModalOpen, setKundliModalOpen] = useState(false);
      const [selectedAstrologer, setSelectedAstrologer] = useState(null);
      const [waitingPopup, setWaitingPopup] = useState(false); 
    
      const { activeCall, setActiveCall } = useCall();
    
      // ✅ Ref for current calling astrologer (no re-render)
      const activeCallAstroRef = useRef(null);
      const kundliRef = useRef(null); // selected kundliId
      const [callRoomId, setCallRoomId] = useState(null);

      const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
      const token = getToken();
      const { balance } = useWalletBalance();

  const handleFollow = async () => {
    try {
      if (!data?._id) return;

      if (!isFollowing) {
        // FOLLOW API CALL
        await followAstrologer({ astrologerId: data.ID }).unwrap();
        toast.success(
          `We will notify you when ${
            data?.firstName || ""
          } goes live or posts an update!`
        );
      } else {
        // UNFOLLOW API CALL
        await unfollowAstrologer({ astrologerId: data.ID }).unwrap();
        toast.success(`You unfollowed ${data?.firstName}`);
      }

      setIsFollowing(!isFollowing);
    } catch (err) {
      console.log("Follow/Unfollow error:", err);
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
  
        navigate(`/talk-to-astrologers/${astro._id}`, {
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
  
    /* ------------------- SOCKET CALL FLOW (ADDED ONLY) ------------------- */
  
    const connectSocket = () => {
      if (voiceSocket.connected) voiceSocket.disconnect();
  
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
  
      voiceSocket.connect();
    };
  
    const initiateCall = (astro, type) => {
      // 🔐 Auth check
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
  
      // ❌ Validations
      if (!astro) return toast.error("Astrologer missing");
      if (!userIdLocal) return toast.error("User ID missing");
  
      // 💰 Balance check
      const price = astro?.price?.amount || 0;
      if (balance < price) {
        setSelectedAstrologer(astro);
        setOpenModal((prev) => ({ ...prev, recharge: true }));
        return;
      }
  
      // 📞 Already on call
      if (activeCall) {
        return toast.error("You are already on a call");
      }
  
      // ✅ Store active call info
      activeCallAstroRef.current = astro;
      setWaitingPopup(true);
  
      // 🔌 Ensure socket connection
      connectSocket();
  
      // 🚀 Create call room
      voiceSocket.emit("create_call_room", {
        userId: userIdLocal,
        astrologerId: astro._id,
        type, // "audio" | "video"
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
  
      /* Room ready event */
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
          });
        } catch {
          toast.error("Failed to start chat");
        }
      };
  
      /* REJECTED */
      const handleCallRejected = (data) => {
        toast.error(data?.sessionData?.sessionEndReason || "Call rejected");
        setWaitingPopup(false);
        voiceSocket.disconnect();
      };
  
      /* ERROR */
      const handleSocketError = (err) => {
        toast.error(err?.message || "Connection error");
        setWaitingPopup(false);
        voiceSocket.disconnect();
      };
  
      /* CALL ENDED */
      const handleCallEnded = () => {
        setWaitingPopup(false);
        voiceSocket.disconnect();
      };
  
      // Attach events
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
  if (isLoading) return <p>Loading...</p>;
  if (error) return <ErrorText>Something went wrong!</ErrorText>;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.leftBlock}>
          <img
            src={data?.imageUrl}
            className={styles.profileImg}
            alt="profile"
          />

          {/* FOLLOW BUTTON */}
          <button
            className={`${styles.followBtn} ${
              isFollowing ? styles.following : ""
            }`}
            onClick={handleFollow}
            disabled={followLoading || unfollowLoading}
          >
            {followLoading || unfollowLoading
              ? "..."
              : isFollowing
              ? "Following"
              : "Follow"}
          </button>
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1>{data?.firstName + " " + data?.lastName}</h1>
            {data?.isVerified && (
              <FaCheckCircle className={styles.verifyIcon} />
            )}
          </div>

          <p>{data?.specialities?.map((s) => s).join(", ") || ""}</p>
          <p className={styles.light}>
            Languages: {data?.languagePreference?.map((l) => l).join(", ")}
          </p>
          <p className={styles.light}>Exp : {data?.experience} Years </p>

          <h3 className={styles.price}>₹ {data?.price?.callRate?.amount}/min</h3>

          <div className={styles.stats}>
            <span>💬 {data?.chatMinutes || 0} mins</span>
            <span>📞 {data?.callMinutes || 0} mins</span>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.chatBtn} onClick={() => openKundliPopup(data)}>
              <FaComments /> Start Chat
            </button>
            <button className={styles.callBtn} onClick={() => handleAudioCall(data)}>
              <FaPhoneAlt /> Start Call
            </button>
            <button className={styles.videoCallBtn} onClick={() => handleVideoCall(data)}>
              <FaVideo /> Start Video
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {/* <div className={styles.gallery}>
        {data?.gallery?.map((img, index) => (
          <img key={index} src={img} alt="" />
        ))}
      </div> */}

      {/* About */}
      <div className={styles.about}>
        <h2>About me</h2>
        <p>{data.description}</p>
      </div>

      {data?.rating && (
        <div className={styles.ratingAndReview}>
          {/* Rating Section */}
          <div className={styles.ratingSection}>
            <h2>Rating & Reviews</h2>

            <div className={styles.ratingSummary}>
              <div className={styles.ratingValue}>
                <h1>{data.rating} </h1>
                <p>⭐ ⭐ ⭐ ⭐ ⭐</p>
                {/* <p>{data?.ratingTotal || 5} total</p> */}
              </div>

              {/* <div className={styles.ratingBars}>
              {Object.entries(data.ratingDistribution)?.map(
                ([star, percent]) => (
                  <div key={star} className={styles.barRow}>
                    <span>{star}</span>
                    <div className={styles.bar}>
                      <div style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              )}
            </div> */}
            </div>
          </div>

          {/* Reviews */}
          {data?.reviews?.length > 0 && (
            <div className={styles.reviews}>
              <h2>User Reviews</h2>

              {data?.reviews?.map((rev, i) => (
                <div key={i} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <h4>{rev.user}</h4>
                    <span>{"⭐".repeat(rev.rating)}</span>
                  </div>
                  <p>{rev.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <GiftSection astrologerId={data?.ID} />

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
                className={styles.rejectBtn}
                onClick={() => {
                  voiceSocket.emit("cancel_call", {
                    roomId: callRoomId,
                  });
                  setWaitingPopup(false);
                  setCallRoomId(null); // ✅ REQUIRED
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
