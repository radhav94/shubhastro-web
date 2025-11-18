import { useEffect, useState } from "react";
import {
  AstrologerCard,
  DetailsModal,
  PrimaryText,
  RechargeAlertModel,
  Title,
} from "../../../component";
import styles from "./TalkToAstrologer.module.scss";
import { useTalkToAstrologer } from "./useTalkToAstrologer";
import { useGetAstrologersQuery } from "../../../redux/api/astrologer/astrologerApi";
import FilterChips from "../../../component/UI/chips/astrologer/FilterChips";

const TalkToAstrologer = () => {
  const [
    onFollow,
    // data,
    openModal,
    setOpenModal,
    onChat,
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  const astroImages = [
    `https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg`,
    `https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg`,
    `https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg`,
    "https://images.astroyogi.com/english/astrologer/profileimage/tarot-shubh-16511220682.jpg", // astrology chart
    "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg", // zodiac wheel
    "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg", // planets galaxy
    "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg", // constellation
  ];

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const limit = 6;

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
        setPage((prev) => prev + 1); // load next page
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching]);

  return (
    <div>
      <PrimaryText size_24 isExtraBold>
        Talk To Best Astrologers Online
      </PrimaryText>
      <div className=" pt-4" />

      <PrimaryText className="">
        Talk to the best astrologer online and get clear guidance on your
        relationships, career, finances, and other important life choices you’re
        about to make. You get trusted insights, accurate predictions with
        complete privacy, and take the next step in life with confidence. With
        over two decades of expertise and with 5000+ experts available 24/7,
        you’ll always find support and clarity with us on your journey forward.
      </PrimaryText>
      <div className=" pt-4" />
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
              onFollow={() => onFollow(e._id)}
              onChat={() => onChat(e)}
              onProfile={() => onProfile(e)}
              image={astroImages[index % astroImages?.length]}
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
    </div>
  );
};

export default TalkToAstrologer;
