import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
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
import {
  useGetAstrologersQuery,
  useGetRecommendedAstrologersQuery,
} from "../../../redux/api/astrologer/astrologerApi";
import FilterChips from "../../../component/UI/chips/astrologer/FilterChips";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import ProfileModals from "../kundli/components/ProfileModals";
import { useProfileManager } from "../kundli/hooks/useProfileManager";
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
import ChatAstrologerCard from "../../../component/UI/cards/ChatAstrologerCard";
import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import RecommendedAstrologerCard from "../../../component/UI/cards/RecommendedAstrologerCard";
import TopAstrologerCard from "../../../component/UI/cards/TopAstrologerCard";

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
  const dispatch = useDispatch();
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showRecommend, setShowRecommend] = useState(true);
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);

  const location = useLocation(); //  get current URL
  // const isChatMode = location.pathname === "/chat-with-astrologers";
  console.log("location location", location);
  const currentPath = location.pathname.split("/").pop();

  const showCTA = useRecommendTrigger(120, resetTrigger);
  /* ---------------------- URL BASED LOGIC ---------------------- */

  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleName = pathParts[0]; // talk-to-astrologers | chat-with-astrologers
  const secondParam = pathParts[1]; // online | undefined
  const isOnlineFromURL = secondParam === "online";
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
    getActiveConfigFromURL(),
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

  // Use the astrologer connect hook
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  // Use profile manager hook (same as Home page)
  const {
    selectedProfile: profileManagerSelectedProfile,
    profiles,
    profilesLoading,
    isCreating,
    showSelectProfile,
    showAddProfile,
    showEditProfile,
    formData,
    editFormData,
    setShowSelectProfile,
    setShowAddProfile,
    setShowEditProfile,
    setFormData,
    setEditFormData,
    handleAddProfile,
    handleEditProfile,
    handleSubmitProfile,
    handleSubmitEditProfile,
    formatProfileDisplay,
  } = useProfileManager(dispatch);

  // Local state for selected profile (to avoid closing modal)
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [activeCallAstro, setActiveCallAstro] = useState(null);

  const {
    activeCall,
    setActiveCall,
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setLastCallType,
    setLastSelectedKundli,
    setLastRequestedAstro: setLastRequestedCallAstro,
  } = useCall();
  const {
    setActiveChat,
    setWaitingList,
    WaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
    setChatSeconds,
  } = useChat();

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null); // selected kundliId

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [topTenAstrologers, setTopTenAstrologers] = useState([]);
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const limit = 9;

  // const [createChatRoom] = useCreateChatRoomMutation();
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

  const { data: astrodata, isFetching } = useGetAstrologersQuery(
    {
      page,
      limit,
      specialties: specialty || "",
      isActiveType,
      ...(isActiveOnline === true && { isActive: true }),
    },
    {
      skip: isFiltered, // Skip normal API when in filtered mode
    },
  );

  const { data: recommendedData, isLoading: isLoadingRecommended } =
    useGetRecommendedAstrologersQuery();

  const data = astrodata?.data?.result || [];
  const recommendedAstrologers = recommendedData?.data || [];
  const token = getToken();
  const { balance } = useWalletBalance();
  const [getBalance] = useGetBalanceMutation();

  useEffect(() => {
    const incomingTopTen = astrodata?.data?.topTenAstrologer;

    if (
      incomingTopTen &&
      incomingTopTen.length > 0 &&
      topTenAstrologers.length === 0
    ) {
      setTopTenAstrologers(incomingTopTen);
    }
  }, [astrodata?.data?.topTenAstrologer]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPage(1);
    setAllAstrologers([]);
    setHasMore(true);
    setIsFiltered(false);
  }, []);

  // MERGE API DATA - only for normal (non-filtered) mode
  useEffect(() => {
    if (isFiltered) return; // Don't process normal API data when in filtered mode
    if (!data || data.length === 0) return;

    if (page === 1) {
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
  }, [data, page, isFiltered]);

  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetching);
  const isFilteredRef = useRef(isFiltered);
  const loadMoreRef = useRef(null);
  const initialLoadComplete = useRef(false);

  // Keep refs updated
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isFetchingRef.current = isFetching;
    isFilteredRef.current = isFiltered;
  }, [hasMore, isFetching, isFiltered]);

  // Mark when initial data is loaded
  useEffect(() => {
    if (allAstrologers.length > 0 && page === 1 && !isFiltered) {
      initialLoadComplete.current = true;
    }
  }, [allAstrologers.length, page, isFiltered]);

  // Intersection Observer for infinite scroll - only in normal mode
  useEffect(() => {
    // Don't set up observer until initial data is loaded
    if (isFiltered || !hasMore || isFetching || !initialLoadComplete.current)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isFilteredRef.current &&
          !isFetchingRef.current
        ) {
          setPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isFetching, hasMore, isFiltered, allAstrologers.length]);

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
      // Reset to normal pagination mode
      resetFilters();
    } else {
      setSpecialty(category);
      setIsFiltered(true);
      setPage(1);
      setAllAstrologers([]);
      setHasMore(true);
    }
  };

  const handleApplyFilters = (payload) => {
    const {
      result: { result: filteredData },
      append = false,
    } = payload || {};

    setIsFiltered(true);

    if (!append) {
      // First page OR new filter → reset list
      setAllAstrologers(filteredData || []);
    } else {
      // Scroll load → append only new items
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newOnes = (filteredData || []).filter(
          (i) => !existingIds.has(i._id),
        );
        return [...prev, ...newOnes];
      });
    }

    setHasMore((filteredData || []).length >= limit);
  };

  // Custom handler for profile selection (doesn't close modal)
  const handleProfileSelect = (profile) => {
    console.log("✅ TALK_TO_ASTROLOGER: Profile selected", profile);
    setLocalSelectedProfile(profile);
  };

  // Handler for Continue button (triggers socket emit)
  const handleContinueAfterKundliSelect = () => {
    if (localSelectedProfile) {
      console.log(
        "✅ TALK_TO_ASTROLOGER: Continue clicked with profile",
        localSelectedProfile,
      );
      hookHandleAfterKundliSelect(localSelectedProfile);
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
    setCallRoomId(null);
    setChatRoomId(null);
    setActiveCallAstro(null);

    activeCallAstroRef.current = null;
    kundliRef.current = null;

    setActiveCall(null);
  };

  useEffect(() => {
    if (!userIdLocal || isRecommendModalOpen) return;

    /* Room ready event */
    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setCallWaitingList(5); // Show waiting for call
    };

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      // setWaitingPopup(false);
      setWaitingList(data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      type,
      remainingTime,
    }) => {
      resetCallFlow();
      const astro = activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        // const res = await createChatRoom({
        //   userId: userIdLocal,
        //   astrologerId: astro._id,
        // });

        // const chatRoomId = res?.data?.data;
        // if (!chatRoomId) throw new Error();

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
          astrologerID: astro?.astrologer_ID,
          remainingTime,
        });
      } catch {
        Toast.error("Failed to start call");
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
          remainingTime: data?.remainingTime,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: astro.firstName,
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
          },
        });
      } catch (e) {
        console.log("e", e);
        Toast.error("Failed to start chat");
      }
    };
    /* REJECTED */
    const handleCallRejected = (data) => {
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected" &&
        data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      Toast.error(errorMsg);
      resetCallState();
      resetChatFlow();
      resetCallFlow();
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
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:rejected", handleCallRejected);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call:ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:rejected", handleCallRejected);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call:ended", handleCallEnded);
    };
  }, [userIdLocal, isRecommendModalOpen]);

  //JSX
  return (
    <div className={styles.mainContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Chat With Best <span className={styles.highlight}>Astrologers</span>{" "}
          Online
        </h1>
      </div>

      <FilterChips
        onSelect={handleSelect}
        isActiveType={activeType}
        onApplyFilters={handleApplyFilters}
        isOnlineFromURL={isOnlineFromURL}
        selectedType={location.state?.selectedType}
      />

      {/* Top Astrologers Section - New Design */}
      {topTenAstrologers.length > 0 && (
        <>
          <div className={styles.sectionDivider}>
            <h2 className={styles.sectionTitle}>TOP ASTROLOGERS FOR YOU</h2>
            <div className={styles.dividerContainer}>
              <div className={styles.dividerLine}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="104"
                  height="1"
                  viewBox="0 0 104 1"
                  fill="none"
                >
                  <path
                    d="M103.803 0.406393C103.803 0.630933 101.504 0.812789 98.669 0.812789C95.8336 0.812789 0 0.630933 0 0.406393C0 0.181853 95.8342 0 98.669 0C101.504 0 103.803 0.181853 103.803 0.406393Z"
                    fill="#030303"
                  />
                </svg>
              </div>
              <span className={styles.dividerMoon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="16"
                  viewBox="0 0 4 5"
                  fill="none"
                >
                  <path
                    d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                    fill="#030303"
                  />
                </svg>
              </span>
              <div className={styles.dividerLine}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="104"
                  height="1"
                  viewBox="0 0 104 1"
                  fill="none"
                >
                  <path
                    d="M-4.48009e-06 0.406393C-4.48009e-06 0.630933 2.29856 0.812789 5.13401 0.812789C7.96946 0.812789 103.803 0.630933 103.803 0.406393C103.803 0.181853 7.96885 0 5.13401 0C2.29856 0 -4.48009e-06 0.181853 -4.48009e-06 0.406393Z"
                    fill="#030303"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.topAstrologersGrid}>
            {topTenAstrologers.map((astro) => (
              <TopAstrologerCard
                key={astro._id}
                data={astro}
                onConnect={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                  activeCallAstroRef.current = astro;
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Explore Astrologers Section - Original Design */}

      <div className={styles.sectionDivider}>
        <h2 className={styles.sectionTitle}>EXPLORE ASTROLOGERS</h2>
        <div className={styles.dividerContainer}>
          <div className={styles.dividerLine}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="104"
              height="1"
              viewBox="0 0 104 1"
              fill="none"
            >
              <path
                d="M103.803 0.406393C103.803 0.630933 101.504 0.812789 98.669 0.812789C95.8336 0.812789 0 0.630933 0 0.406393C0 0.181853 95.8342 0 98.669 0C101.504 0 103.803 0.181853 103.803 0.406393Z"
                fill="#030303"
              />
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="16"
              viewBox="0 0 4 5"
              fill="none"
            >
              <path
                d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                fill="#030303"
              />
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="104"
              height="1"
              viewBox="0 0 104 1"
              fill="none"
            >
              <path
                d="M-4.48009e-06 0.406393C-4.48009e-06 0.630933 2.29856 0.812789 5.13401 0.812789C7.96946 0.812789 103.803 0.630933 103.803 0.406393C103.803 0.181853 7.96885 0 5.13401 0C2.29856 0 -4.48009e-06 0.181853 -4.48009e-06 0.406393Z"
                fill="#030303"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.cardsContainer}>
        {allAstrologers?.map((astro, index) => (
          <div key={astro._id} className={styles.cardWrapper}>
            {isChatMode ? (
              <ChatAstrologerCard
                data={astro}
                onConnect={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                  activeCallAstroRef.current = astro;
                }}
              />
            ) : (
              <AstrologerCard
                isActiveType={activeType}
                data={astro}
                image={astroImages[index % astroImages.length]}
                onFollow={() => onFollow(astro._id)}
                onChat={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
                onProfile={() => onProfile(astro)}
                onAudioCall={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
                onVideoCall={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
              />
            )}
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

      {!hasMore && allAstrologers.length > 0 && (
        <div className={styles.matchSection}>
          <h2 className={styles.matchTitle}>
            NOT SURE?
            <br />
            LET US MATCH YOU.
          </h2>
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="104"
                height="1"
                viewBox="0 0 104 1"
                fill="none"
              >
                <path
                  d="M103.803 0.406393C103.803 0.630933 101.504 0.812789 98.669 0.812789C95.8336 0.812789 0 0.630933 0 0.406393C0 0.181853 95.8342 0 98.669 0C101.504 0 103.803 0.181853 103.803 0.406393Z"
                  fill="#030303"
                />
              </svg>
            </div>
            <span className={styles.dividerMoon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="16"
                viewBox="0 0 4 5"
                fill="none"
              >
                <path
                  d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
                  fill="#030303"
                />
              </svg>
            </span>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="104"
                height="1"
                viewBox="0 0 104 1"
                fill="none"
              >
                <path
                  d="M-4.48009e-06 0.406393C-4.48009e-06 0.630933 2.29856 0.812789 5.13401 0.812789C7.96946 0.812789 103.803 0.630933 103.803 0.406393C103.803 0.181853 7.96885 0 5.13401 0C2.29856 0 -4.48009e-06 0.181853 -4.48009e-06 0.406393Z"
                  fill="#030303"
                />
              </svg>
            </div>
          </div>

          {isLoadingRecommended ? (
            <div className={styles.loaderWrapper}>
              <PrimaryLoader />
            </div>
          ) : (
            <div className={styles.recommendedGrid}>
              {recommendedAstrologers.map((astro) => (
                <div key={astro._id} className={styles.notSureCard}>
                  <RecommendedAstrologerCard
                    data={astro}
                    onConnect={() => handleChatStart(astro)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

      {/* Kundli modal - using ProfileModals like Home page */}
      <ProfileModals
        showSelectProfile={hookOpenModal.kundli}
        showAddProfile={showAddProfile}
        showEditProfile={showEditProfile}
        profiles={profiles}
        selectedProfile={localSelectedProfile}
        formData={formData}
        editFormData={editFormData}
        isCreating={isCreating}
        onCloseSelect={() => {
          hookSetOpenModal((prev) => ({ ...prev, kundli: false }));
          setLocalSelectedProfile(null);
        }}
        onCloseAdd={() => setShowAddProfile(false)}
        onCloseEdit={() => setShowEditProfile(false)}
        onSelectProfile={handleProfileSelect}
        onAddProfile={handleAddProfile}
        onSubmitProfile={handleSubmitProfile}
        onSubmitEditProfile={handleSubmitEditProfile}
        setFormData={setFormData}
        setEditFormData={setEditFormData}
        formatProfileDisplay={formatProfileDisplay}
        showContinueButton={true}
        onContinue={handleContinueAfterKundliSelect}
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

      {/* Recharge modal from hook for popup flow */}
      {hookOpenModal.recharge && (
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
                  hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
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

      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={selectedAstrologer}
        onChatStart={hookHandleChatStart}
        onCallStart={hookHandleCallStart}
      />

      {/* Waiting Modal - shows for both chat and call */}
      {(WaitingList || callWaitingList) && (
        <WaitingModal
          callRoomId={callRoomId || chatRoomId}
          resetCallState={resetCallState}
          connectionType={WaitingList ? "chat" : "audio"}
        />
      )}
    </div>
  );
};

export default TalkToAstrologer;
