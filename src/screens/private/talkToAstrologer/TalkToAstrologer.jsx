import { useEffect, useState } from "react";
import {
  AstrologerCard,
  DetailsModal,
  PrimaryText,
  RechargeAlertModel,
  Title,
} from "../../../component";
import styles from "./TalkToAstrologer.module.scss";
import { useNavigate } from "react-router-dom";
import { useTalkToAstrologer } from "./useTalkToAstrologer";
import { useGetAstrologersQuery } from "../../../redux/api/astrologer/astrologerApi";
import FilterChips from "../../../component/UI/chips/astrologer/FilterChips";
import VoiceCall from "../../../component/call/VoiceCall";
import callServices from "../../../services/callServices";
import axios from "axios";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import KundliSelectModal from "./kundliSelect/KundliSelectModal";

// const allAstrologers = [
//   {
//     _id: "692012fe836eaeb7310db199",
//     firstName: "Astrologer",
//     lastName: "Sanket",
//     dateOfBirth: "1990-09-10",
//     phoneNumber: "7977620389",
//     otp: 554330,
//     otpExpireAt: "2025-11-21T10:29:16.515Z",
//     isVerified: true,
//     role: "ASTROLOGER",
//     isAccountActive: true,
//     languagePreference: ["Hindi", "Marathi", "English"],
//     specialities: [
//       "Vedic Astrology",
//       "Kundli Matching",
//       "Numerology",
//       "Tarot Reading",
//     ],
//     astrologer_id: "725bd6d4-aec8-4862-a3a3-916bb0e61dd8",
//     availability: [
//       {
//         day: "Monday",
//         slots: [
//           { start: "09:00 AM", end: "12:00 PM" },
//           { start: "02:00 PM", end: "05:00 PM" },
//         ],
//       },
//       {
//         day: "Friday",
//         slots: [
//           { start: "10:00 AM", end: "01:00 PM" },
//           { start: "03:00 PM", end: "06:00 PM" },
//         ],
//       },
//     ],
//     createdAt: "2025-11-20T13:12:12.744Z",
//     updatedAt: "2025-11-21T10:24:16.544Z",
//     __v: 0,
//     email: "sanketPatil@gmail.com",
//     gender: "male",

//     description:
//       "Sanket Patil is an experienced astrologer specializing in Vedic Astrology, Kundli Matching, and Numerology. He helps clients with personalized horoscope readings and predictions. He also provides Tarot reading sessions for life guidance.",
//     price: {
//       unit: "minute",
//       currency: "INR",
//       amount: "150",
//       service: {
//         free: false,
//         call: true,
//         videoCall: true,
//         chat: false,
//       },
//     },
//     imageUrl:
//       "https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg",
//     rating: 4.8,
//     wallet: 3000,
//     is_AI: false,
//   },
//   {
//     _id: "691b0e142f7a64f0520e5feb",
//     firstName: "Astrologer",
//     lastName: "Shivam",
//     dateOfBirth: "1985-05-12",
//     time: "10:30 AM",
//     place: "Jaipur, India",
//     phoneNumber: "9561759639",

//     email: "rahul.sharma@example.com",
//     gender: "Male",
//     otp: 123456,
//     otpExpireAt: "2025-11-21T07:05:25.565Z",
//     isVerified: true,
//     role: "ASTROLOGER",
//     isAccountActive: true,
//     experience: 12,
//     languagePreference: ["Hindi", "English"],
//     specialities: ["Vedic Astrology", "Palm Reading", "Numerology"],
//     description:
//       "Experienced astrologer with expertise in Vedic astrology and palmistry.",
//     price: {
//       unit: "minute",
//       currency: "INR",
//       amount: "25",
//       service: { call: true, videoCall: false, chat: true },
//     },
//     imageUrl:
//       "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg",
//     availability: [
//       {
//         day: "Monday",
//         slots: [
//           { start: "09:00", end: "12:00" },
//           { start: "15:00", end: "18:00" },
//         ],
//       },
//       {
//         day: "Wednesday",
//         slots: [{ start: "10:00", end: "14:00" }],
//       },
//     ],
//     rating: { average: 4.7, reviewCount: 230 },
//     wallet: 1500,
//     is_AI: false,
//   },
// ];

const astroImages = [
  `https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg`,
  `https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg`,
  `https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg`,
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

  const [activeCaller, setActiveCaller] = useState(null);
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const limit = 6;

  const [createChatRoom] = useCreateChatRoomMutation();

  const { data: astrodata, isFetching } = useGetAstrologersQuery({
    page,
    limit,
    specialties: specialty,
  });

  const data = astrodata?.data || [];

  const [allAstrologers, setAllAstrologers] = useState([]);

  useEffect(() => {
    if (data) {
      setAllAstrologers((prev) => [...prev, ...data]);
    }
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (isBottom && !isFetching) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching]);

  //  const handleStartCall = (astro) => {
  //   const channel = "order_" + Date.now();

  //   // 2. show UI: waiting for astrologer to accept
  //   setActiveCaller({
  //     ...astro,
  //     channelName: channel,
  //   });
  // };

  // const handleEndCall = () => {
  //   setActiveCaller(null);
  // };

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const openKundliPopup = (astro) => {
    setSelectedAstrologer(astro);
    setKundliModalOpen(true);
  };

  const handleChatAfterKundliSelect = async (kundli) => {
    setKundliModalOpen(false);

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    // Create chat room
    const res = await createChatRoom({
      userId: userIdLocal,
      astrologerId: astro._id,
    });

    const roomId = res?.data?.data;

    navigate(`/talk-to-astrologers/${astro._id}`, {
      state: {
        userId: userIdLocal,
        astrologerId: astro._id,
        fullName: astro.firstName,
        roomId,
        isUserSide: true,
        kundliId:kundli._id
      },
    });
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
        }}
      />

      <div className={styles.cardsContainer}>
        {allAstrologers?.map((e, index) => (
          <div key={e._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={e}
              image={astroImages[index % astroImages.length]}
              onFollow={() => onFollow(e._id)}
              onChat={() => openKundliPopup(e)}
              onProfile={() => onProfile(e)}
              // onAudioCall={() => handleStartCall(e)}
            />
          </div>
        ))}
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
        onSelect={(kundli) => handleChatAfterKundliSelect(kundli)}
      />
    </div>
  );
};

export default TalkToAstrologer;
