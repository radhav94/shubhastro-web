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
import { useNavigate, useLocation } from "react-router-dom";
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
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useChat } from "../../../context/ChatContext";
import { useGetBalanceMutation } from "../../../redux/api/wallet/walletApi";

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
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showRecommend, setShowRecommend] = useState(true);

  const location = useLocation(); //  get current URL
  // const isChatMode = location.pathname === "/chat-with-astrologers";
  const currentPath = location.pathname.split("/").pop();

  const showCTA = useRecommendTrigger(120, resetTrigger);
  /* ---------------------- URL BASED LOGIC ---------------------- */

  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleName = pathParts[0];      // talk-to-astrologers | chat-with-astrologers
  const secondParam = pathParts[1];     // online | undefined
  const isOnlineFromURL = secondParam === "online";
  console.log("moduleName : ",moduleName);
  const getActiveConfigFromURL = () => {
    let isActiveOnline = false;
    let isActiveType = null;

    if (secondParam === "online") {
      isActiveOnline = true;

      if (moduleName === "chat-with-astrologers") {
        isActiveType = "chat";
      }

      if (moduleName === "talk-to-astrologers") {
        isActiveType = "video,audio";
      }
    }

    return { isActiveOnline, isActiveType };
  };

  const [{ isActiveOnline, isActiveType }, setActiveConfig] = useState(
    getActiveConfigFromURL()
  );

  useEffect(() => {
    setActiveConfig(getActiveConfigFromURL());
  }, [location.pathname]);

  const isChatMode = moduleName === "chat-with-astrologers";
  useEffect(() => {
    if (showCTA) {
      setShowRecommend(true);
    }
  }, [showCTA, isChatMode]);

  const [open, setOpen] = useState(false);

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
  const {setActiveChat, setWaitingList, WaitingList, resetChatFlow, setActiveChatRoomId, setLastRequestedAstro, setChatSeconds } = useChat();

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null); // selected kundliId

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const limit = 9;

  const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  // last part of URL

  // Detect type based on URL
  const getTypeFromURL = () => {
    if (moduleName === "chat-with-astrologers") {
      return "chat";
      }

      if (moduleName === "talk-to-astrologers") {
        return "video,audio";
      }
  };

  // 🔥 Set initial activeType from URL
  const [activeType, setActiveType] = useState(getTypeFromURL());

  // 🔄 Update activeType if URL changes
  useEffect(() => {
    setActiveType(getTypeFromURL());
    if (!location.state?.rejoinAstro) return;
    handleChatStart(location.state.rejoinAstro);
    navigate(".", { replace: true, state: null });
  }, [location]);

  const { data: astrodata, isFetching } = useGetAstrologersQuery({
    page,
    limit,
    specialties: specialty || "",
    isActiveType,
    ...(isActiveOnline === true && { isActive: true }),
  });

  const data = astrodata?.data || [];
  const token = getToken();
  const { balance } = useWalletBalance();
  const [getBalance] = useGetBalanceMutation();

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
  }, [data, page, activeType]); // 👈 MUST add page here!!

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
    if (isFiltered) return;

    if (
      document.documentElement.scrollHeight <= window.innerHeight &&
      hasMoreRef.current &&
      !isFetchingRef.current
    ) {
      setPage((prev) => prev + 1);
    }
  }, [allAstrologers, isFiltered]);

  useEffect(() => {
    if (isFiltered || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [isFetching, hasMore, isFiltered]);

  // Filter handlers
  const resetFilters = () => {
    setIsFiltered(false);
    setSpecialty("");
    setPage(1);
    setAllAstrologers([]);
    setHasMore(true);
  };

  const handleSelect = (category) => {
    if (!category) {
      resetFilters();
    } else {
      setSpecialty(category);
      setIsFiltered(true);
      setPage(1);
      setAllAstrologers([]);
      setHasMore(true);
    }
  };

  // const handleApplyFilters = (payload) => {
  //   setIsFiltered(true);
  //   setPage(1);
  //   setAllAstrologers(payload.result || []);
  //   setHasMore(false); // stop infinite scroll
  // };

  const handleApplyFilters = (payload) => {
    const { result = [], append = false } = payload || {};

    setIsFiltered(true);

    if (!append) {
      // 🔹 first page OR new filter → reset list
      setPage(1);
      setAllAstrologers(result);
    } else {
      // 🔹 scroll load → append only new items
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newOnes = result.filter((i) => !existingIds.has(i._id));
        return [...prev, ...newOnes];
      });
    }

    setHasMore(result.length >= limit);
  };

  // Kundli & Chat handlers
  const openKundliPopup = () => {
    if (token) {
      setKundliModalOpen(true);
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  };

  async function handleChatStart(astro) {
    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    //Check if user has minimum required balance
    // 💰 Balance check
    const result = await getBalance({ astrologerId: astro?._id });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    //Check if astro is online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return;
    }

    openKundliPopup();
  }

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli?._id) return Toast.error("Kundli not selected properly");
    if (!selectedAstrologer?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      // 🔐 Auth check
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      // ✅ Store active call info
      activeCallAstroRef.current = astro;
      setWaitingPopup(true);
      kundliRef.current = kundli?._id;

      // 🚀 Create call room
      voiceSocket.emit("chat:initiate", {
        userId: userIdLocal,
        astrologerId: astro._id,
      });
    } catch (error) {
      console.error(error);
    }
  };

  /* ------------------- SOCKET CALL FLOW (ADDED ONLY) ------------------- */

  useEffect(() => {
    if (!userIdLocal || isRecommendModalOpen) return;

    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
      voiceSocket.connect();
    }

    return () => {
      voiceSocket.off();
    };
  }, [userIdLocal, isRecommendModalOpen]);

  const connectSocket = () => {
    if (voiceSocket.connected) voiceSocket.disconnect();

    voiceSocket.io.opts.query = {
      userId: userIdLocal,
      role: "CUSTOMER",
    };

    voiceSocket.connect();
  };

  const resetCallState = () => {
    setWaitingPopup(false);
    setCallRoomId(null);
    setChatRoomId(null);
    setCallType(null);
    setActiveCallAstro(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
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
    // connectSocket();

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
    if (!userIdLocal || isRecommendModalOpen) return;

    /* Room ready event */
    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setWaitingPopup(true);
    };

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingPopup(false);
      setWaitingList(data?.waitingTime || 2);
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
        Toast.error("Failed to start chat");
      }
    };

    const handleChatAccepted = async ({
      astrologerId,
      roomId,
      userId,
      ...data
    }) => {
      setWaitingList(false);
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          chatRoomId,
          callerName: astro.firstName,
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime
        });
        setChatSeconds(Number(data?.remainingTime)*60);

        navigate(`/talk-to-astrologers/${astrologerId}`, {
        state: {
          userId: userId,
          astrologerId,
          fullName: astro.firstName,
          roomId,
          isUserSide: true,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          astroID: data?.astrologer?.astrologer_ID
        },
      });
      } catch(e) {
        console.log('e', e)
        Toast.error("Failed to start chat");
      }
    };
    /* REJECTED */
    const handleCallRejected = (data) => {
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected"
          ? "Astrologer has rejected the chat request"
          : "Call rejected";
      Toast.error(errorMsg);
      resetCallState();
      resetChatFlow();
    };

    /* ERROR */
    const handleSocketError = (err) => {
      console.log("SOCKET ERROR:", err);

      if (err?.message === "Call has already ended") {
        // soft reset only
        resetCallState();
        return;
      }

      Toast.error(err?.message || "Connection error");
      resetCallState();
    };

    /* CALL ENDED */
    const handleCallEnded = () => {
      resetCallState();
    };

    // Attach events
    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleCallRejected);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleCallRejected);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call_ended", handleCallEnded);
    };
  }, [userIdLocal, isRecommendModalOpen]);

  //JSX
  return (
    <div className={styles.mainContainer}>
      <PrimaryText size_24 isExtraBold>
        {activeType === "chat" ? "Chat With " : "Talk To "}Best Astrologers
        Online
      </PrimaryText>

      {waitingPopup && (
        // <WaitingModal callRoomId={callRoomId} resetCallState={resetCallState} />
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
                  if (callRoomId) {
                    voiceSocket.emit("cancel_call", { roomId: callRoomId });
                  }
                  resetCallState();
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
        onSelect={handleSelect}
        isActiveType={activeType}
        onApplyFilters={handleApplyFilters}
        isOnlineFromURL={isOnlineFromURL}
      />

      <div className={styles.cardsContainer}>
        {allAstrologers.map((astro, index) => (
          <div key={astro._id} className={styles.cardWrapper}>
            <AstrologerCard
              isActiveType={activeType}
              data={astro}
              image={astroImages[index % astroImages.length]}
              onFollow={() => onFollow(astro._id)}
              onChat={() => handleChatStart(astro)}
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
              {(selectedAstrologer?.price?.chatRate?.amount || 1) * 5}) is
              required to start chat with
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
      {showCTA && showRecommend && !WaitingList && (
        <RecommendCTA
          mode={isChatMode ? "chat" : "call"}
          onClick={() => {
            setOpen(true);
            setIsRecommendModalOpen(true);
            setShowRecommend(false);
          }}
          onClose={() => {
            setShowRecommend(false); // close now
            setResetTrigger((prev) => prev + 1); // allow next scroll
          }}
        />
      )}

      {open && (
        <RecommendModal
          open={open}
          setOpen={setOpen}
          onClose={() => {
            setOpen(false);
            setIsRecommendModalOpen(false);
          }}
          mode={isChatMode ? "chat" : "call"}
        />
      )}
    </div>
  );
};

export default TalkToAstrologer;
