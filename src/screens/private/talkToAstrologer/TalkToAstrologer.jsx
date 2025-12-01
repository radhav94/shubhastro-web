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


  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

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
  const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
    amount: 0,
  };

  // Merge paginated astrologers
  // RESET when screen mounts
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
    // if (token && storedWallet?.amount >= 135) {
    //   setKundliModalOpen(true);
    // }
    if (token) {
      setKundliModalOpen(true);
    }
    //  else if (token) {
    //   setOpenModal((prev) => ({ ...prev, recharge: true }));
    // }
    else {
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

  // ⬇ FIXED: astro param added
  // const handleAudioCall = async (astro) => {
  //   if (!astro) return;
  //   try {
  //     const res = await createChatRoom({
  //       userId: userIdLocal,
  //       astrologerId: astro._id,
  //     });

  //     const roomId = res?.data?.data;
  //     if (!roomId) return Toast.error("Room ID missing");

  //     navigate(PATH.privateRoutes.VOICE_CALL.path, {
  //       state: { userId: userIdLocal, astrologerId: astro._id, roomId,isUserSide:true },
  //     });
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleAudioCall = (astro) => {
  //   navigate(PATH.privateRoutes.VOICE_CALL.path, {
  //     state: {
  //       userId: userIdLocal,
  //       astrologerId: astro._id,
  //       isUserSide: true,
  //       // roomId: null // temporary
  //     },
  //   });
  // };
//   const handleAudioCall = (astro) => {
//   navigate(PATH.privateRoutes.VOICE_CALL.path, {
//     state: {
//       userId: userIdLocal,
//       astrologerId: astro._id,
//       isUserSide: true,
//       // roomId: null // temporary
//     },
//   });
// };


const handleAudioCall = (astro) => {
    if (!astro) return;
    if (!userIdLocal) return Toast.error("User ID Missing");

    setActiveCallAstro(astro);

    // 1️⃣ ask backend to create call room
    voiceSocket.emit("create_call_room", {
      userId: userIdLocal,
      astrologerId: astro._id,
    });
  };

  // 2️⃣ listen to room creation + call accepted
  useEffect(() => {
    if (!userIdLocal) return;

    const handleReturnCallRoom = ({ roomId }) => {
      // 3️⃣ notify astrologer about incoming call
      voiceSocket.emit("notify_incoming_call", {
        roomId,
         to: activeCallAstro._id, // astrologerId
        from: userIdLocal,  
      });
    };

    const handleCallAccepted = ({ roomId }) => {
      if (!roomId) return;

      const callerName = activeCallAstro?.firstName || "Astrologer";

      // 4️⃣ navigate to voice call screen
      navigate(`/talk-to-astrologers/voice-call/${roomId}`, {
        state: {
          roomId,
          callerName, // astrologer name shown in call UI
          userId: userIdLocal,
          astrologerId: activeCallAstro?._id,
          isUserSide: true,
        },
      });
    };

    voiceSocket.on("return_call_room", handleReturnCallRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);

    return () => {
      voiceSocket.off("return_call_room", handleReturnCallRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
    };
  }, [userIdLocal, activeCallAstro, navigate]);

  const handleVideoCall = async (astro) => {
    if (!astro) return;
    try {
      const res = await createChatRoom({
        userId: userIdLocal,
        astrologerId: astro._id,
      });

      const roomId = res?.data?.data;
      if (!roomId) return Toast.error("Room ID missing");

      navigate(PATH.privateRoutes.VIDEO_CALL.path, {
        state: { userId: userIdLocal, astrologerId: astro._id, roomId },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <PrimaryText size_24 isExtraBold>
        Talk To Best Astrologers Online
      </PrimaryText>

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

      <RechargeAlertModel
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        isOpen={openModal.recharge}
        handleSubmit={onRechargeNow}
        astrologer={selectedAstrologer}
      />

      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />
    </div>
  );
};

export default TalkToAstrologer;
