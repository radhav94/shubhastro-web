import { useEffect, useState, useRef } from "react";
import {
  AstrologerCard,
  DetailsModal,
  PrimaryText,
  RechargeAlertModel,
  Title,
  Toast,
} from "../../../component";
import styles from "./TalkToAstrologer.module.scss";
import { useNavigate } from "react-router-dom";
import { useTalkToAstrologer } from "./useTalkToAstrologer";
import { useGetAstrologersQuery } from "../../../redux/api/astrologer/astrologerApi";
import FilterChips from "../../../component/UI/chips/astrologer/FilterChips";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import KundliSelectModal from "./kundliSelect/KundliSelectModal";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { PATH } from "../../../utils/routes/Paths";
import { getToken } from "../../../utils/token";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useCall } from "../../../context/CallContext";
import useRecommendTrigger from "../../../utils/hooks/useRecommendTrigger";
import RecommendCTA from "../../../layouts/recommend/RecommendCTA";
import RecommendModal from "../../../component/UI/modal/RecommendModal/RecommendModal";

const astroImages = [
  "https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-shubh-16511220682.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg",
];

const TalkToAstrologer = () => {
  const navigate = useNavigate();
  const showCTA = useRecommendTrigger(0.7);
  const [open, setOpen] = useState(false);
  const [showRecommend, setShowRecommend] = useState(true);

  const [
    onFollow,
    openModal,
    setOpenModal,
    onChat,
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [activeCallAstro, setActiveCallAstro] = useState(null);
  const [waitingPopup, setWaitingPopup] = useState(false); // ⭐ Added popup state
  const [callType, setCallType] = useState(null); // audio | video

  const { activeCall, setActiveCall } = useCall();

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null); // selected kundliId

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [callRoomId, setCallRoomId] = useState(null);

  const limit = 9;

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const { data: astrodata, isFetching } = useGetAstrologersQuery({
    page,
    limit,
    specialties: specialty,
  });

  const data = astrodata?.data || [];
  const token = getToken();
  const { balance } = useWalletBalance();

  useEffect(() => {
    window.scrollTo(0, 0);
    setPage(1);
    setAllAstrologers([]);
    setHasMore(true);
  }, []);

  // MERGE API DATA
  useEffect(() => {
    if (!data) return;

    // If same data count as current list → stop update → stop loop
    if (page === 1) {
      if (allAstrologers.length === data.length) return;
      setAllAstrologers(data);
    } else {
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newOnes = data.filter((i) => !existingIds.has(i._id));
        if (newOnes.length === 0) return prev;
        return [...prev, ...newOnes];
      });
    }

    setHasMore(data.length >= limit);
  }, [data, page]); // 👈 MUST add page here!!

  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetching);
  const loadMoreRef = useRef(null);

  // Keep refs updated
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isFetchingRef.current = isFetching;
  }, [hasMore, isFetching]);

  // Auto-load if no scrollbar exists (important!)
  useEffect(() => {
    if (
      document.documentElement.scrollHeight <= window.innerHeight &&
      hasMoreRef.current &&
      !isFetchingRef.current
    ) {
      setPage((prev) => prev + 1);
    }
  }, [allAstrologers]);

  useEffect(() => {
    if (isFetching || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [isFetching, hasMore]);

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

    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    if (!selectedAstrologer?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      const res = await createChatRoom({
        userId: userIdLocal,
        astrologerId: astro._id,
      });

      const roomId = res?.data?.data;
      if (!roomId) return Toast.error("Room ID missing");

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
    if (!astro) return Toast.error("Astrologer missing");
    if (!userIdLocal) return Toast.error("User ID missing");

    // 💰 Balance check
    const price = astro?.price?.amount || 0;
    if (balance < price) {
      setSelectedAstrologer(astro);
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    // 📞 Already on call
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    // ✅ Store active call info
    activeCallAstroRef.current = astro;
    setActiveCallAstro(astro);
    setCallType(type);
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

    /* CALL ACCEPTED → NO NAVIGATION ANYMORE */
    // const handleCallAccepted = ({ roomId, token, type }) => {
    //   setWaitingPopup(false);

    //   setActiveCall({
    //     roomId,
    //     agoraToken: token,
    //     callerName: activeCallAstroRef.current?.firstName,
    //     isUserSide: true,
    //     callType: type,
    //   });

    // };

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
        Toast.error("Failed to start chat");
      }
    };

    /* REJECTED */
    const handleCallRejected = (data) => {
      Toast.error(data?.sessionData?.sessionEndReason || "Call rejected");
      setWaitingPopup(false);
      voiceSocket.disconnect();
    };

    /* ERROR */
    const handleSocketError = (err) => {
      Toast.error(err?.message || "Connection error");
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

  const handleClick = () => {
    setOpen(true);
    setShowRecommend(false);
  };

  /* ------------------------------------------------------------------- */

  return (
    <div className={styles.mainContainer}>
      <PrimaryText size_24 isExtraBold>
        Talk To Best Astrologers Online
      </PrimaryText>

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

      <div className="pt-4" />
      <Title title="Trial Offer ( 3 left )" showDivider />

      <FilterChips
        onSelect={(filterName) => {
          setSpecialty(filterName);
          setPage(1);
          setAllAstrologers([]);
          setHasMore(true);
        }}
      />

      <div className={styles.cardsContainer}>
        {allAstrologers.map((astro, index) => (
          <div key={astro._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astro}
              image={astroImages[index % astroImages.length]}
              onFollow={() => onFollow(astro._id)}
              onChat={() => openKundliPopup(astro)}
              onProfile={() => onProfile(astro)}
              onAudioCall={() => handleAudioCall(astro)}
              onVideoCall={() => handleVideoCall(astro)}
            />
          </div>
        ))}

        {isFetching && (
          <div className={styles.loaderWrapper}>
            <PrimaryLoader />
          </div>
        )}

        {!isFetching && allAstrologers.length === 0 && (
          <div className={styles.emptyState}>
            <PrimaryText>No astrologers found.</PrimaryText>
          </div>
        )}
      </div>

      <div ref={loadMoreRef} className={styles.loaderWrapper}>
        {isFetching && <PrimaryLoader />}
      </div>

      <DetailsModal
        onClose={() => setOpenModal((prev) => ({ ...prev, details: false }))}
        isOpen={openModal.details}
        handleSubmit={handleSubmit}
      />

      {/* <RechargeAlertModel
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        isOpen={openModal.recharge}
        handleSubmit={onRechargeNow}
        astrologer={selectedAstrologer}
      /> */}

      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      {openModal.recharge && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText isCenter className=" pt-4">
              Minimum balance of 5 minutes (₹{" "}
              {(selectedAstrologer?.price?.amount || 1) * 5}) is required to
              start chat with
              {` ${selectedAstrologer?.firstName || "Astrologer"}`}.
            </PrimaryText>

            <div className={styles.modalButtons}>
              <button
                className={styles.rejectBtn}
                onClick={() =>
                  setOpenModal((prev) => ({ ...prev, recharge: false }))
                }
              >
                Cancel
              </button>
              <button
                className={styles.acceptBtn}
                onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
              >
                Recharge
              </button>
            </div>
          </div>
        </div>
      )}
      {showCTA && showRecommend && (
        <RecommendCTA
          mode="chat"
          onClick={handleClick} // Chat Now
          onClose={() => setShowRecommend(false)} //  Close
        />
      )}

      <RecommendModal
        open={open}
        onClose={() => setOpen(false)}
        mode="chat"
        data={allAstrologers.slice(0, 8)}
      />
    </div>
  );
};

export default TalkToAstrologer;
