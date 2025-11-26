import { useEffect, useState } from "react";
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
    onChat, // if you don't use it, you can remove from the hook return
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const limit = 6;

  const [createChatRoom] = useCreateChatRoomMutation();

  const { data: astrodata, isFetching } = useGetAstrologersQuery({
    page,
    limit,
    specialties: specialty,
  });

  const data = astrodata?.data || [];

  // Merge paginated astrologers into a single list
  useEffect(() => {
    if (!data) return;

    // If we get less than limit, assume no more pages
    if (data.length < limit) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    // If page is 1, we should replace the list (e.g., after filter change)
    if (page === 1) {
      setAllAstrologers(data);
    } else if (data.length > 0) {
      // Avoid simple duplication: merge by _id
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((item) => item._id));
        const newOnes = data.filter((item) => !existingIds.has(item._id));
        return [...prev, ...newOnes];
      });
    }
  }, [data, page, limit]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200;

      if (scrollPosition && !isFetching && hasMore) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching, hasMore]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const openKundliPopup = (astro) => {
    setSelectedAstrologer(astro);
    setKundliModalOpen(true);
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    if (!kundli || !kundli._id) {
      Toast.error("Kundli not selected properly");
      return;
    }

    if (!selectedAstrologer || !selectedAstrologer._id) {
      Toast.error("Astrologer not selected");
      return;
    }

    if (!userIdLocal) {
      Toast.error("User ID not found in localStorage");
      // Optionally redirect to login / show error
      return;
    }

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      const res = await createChatRoom({
        userId: userIdLocal,
        astrologerId: astro._id,
      });

      const roomId = res?.data?.data;

      if (!roomId) {
        Toast.error("Room ID not found in createChatRoom response");
        return;
      }

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
      console.error("Error creating chat room:", error);
    }
  };

  return (
    <div>
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
        {allAstrologers?.map((astro, index) => (
          <div key={astro._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astro}
              image={astroImages[index % astroImages.length]}
              onFollow={() => onFollow(astro._id)}
              onChat={() => openKundliPopup(astro)}
              onProfile={() => onProfile(astro)}
              // onAudioCall={() => handleStartCall(astro)}
            />
          </div>
        ))}

        {isFetching && (
          <div className={styles.loaderWrapper}>
            {/* <PrimaryText>Loading more astrologers...</PrimaryText> */}
            <PrimaryLoader/>
          </div>
        )}

        {!isFetching && allAstrologers.length === 0 && (
          <div className={styles.emptyState}>
            <PrimaryText>No astrologers found.</PrimaryText>
          </div>
        )}
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
