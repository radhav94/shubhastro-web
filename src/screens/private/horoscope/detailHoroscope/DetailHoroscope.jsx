import React, { useState } from "react";
import HoroScopeBanner from "../horoscopeComp/HoroScopeBanner";
import { useLocation, useNavigate } from "react-router-dom";
import Astrologers from "../../home/components/astrologers/Astrologers";
import Blogs from "../../home/components/blogs/Blogs";
import { ContentCard } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { HoroTimmingList } from "../horoscopeComp/MoreHscope";

const DetailHoroscope = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.data;
  // src/data/zodiacDetails.js
  const generateZodiacDetails = (zodiac) => {
    return {
      ...zodiac,
      zodiacSigns: [
        {
          id: 1,
          name: `${zodiac.name} Daily`,
          description: "Daily predictions for your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/ARIES_04bdeca59e.svg",
          isSelected: false,
        },
        {
          id: 2,
          name: `${zodiac.name} Love`,
          description: "Love life insights and relationship advice.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Lover_6f61cbc92e.svg",
          isSelected: false,
        },
        {
          id: 3,
          name: `${zodiac.name} Career`,
          description: "Career guidance and work-related predictions.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Todays_Prediction_8e66f3523d.svg",
          isSelected: false,
        },
        {
          id: 4,
          name: `${zodiac.name} Finance`,
          description: "Financial insights and money management tips.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Professional_b2038f1298.svg",
          isSelected: false,
        },
        {
          id: 5,
          name: `${zodiac.name} Health`,
          description: "Health advice tailored to your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Todays_Prediction_8e66f3523d.svg",
          isSelected: false,
        },
        {
          id: 6,
          name: `${zodiac.name} Sign`,
          description: "Overview of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_15a53db963.svg",
          isSelected: false,
        },
        {
          id: 7,
          name: `${zodiac.name} Personality`,
          description: "Personality traits of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Personality_a8cdffbd86.svg",
          isSelected: false,
        },
        {
          id: 8,
          name: `${zodiac.name} Lover`,
          description: "Romantic nature of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Lover_6f61cbc92e.svg",
          isSelected: false,
        },
        {
          id: 9,
          name: `${zodiac.name} Man`,
          description: "Characteristics of men of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Man_4f2eca92f4.svg",
          isSelected: false,
        },
        {
          id: 10,
          name: `${zodiac.name} Traits`,
          description: "Key traits of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Trait_8101d568a7.svg",
          isSelected: false,
        },
        {
          id: 11,
          name: `${zodiac.name} Moon`,
          description: "Moon-related influences for your sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Moon_ab04dcf4de.svg",
          isSelected: false,
        },
        {
          id: 12,
          name: `${zodiac.name} Professional`,
          description: "Professional life predictions.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Seasons_b0619d2142.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Professional_b2038f1298.svg",
          isSelected: false,
        },
        {
          id: 13,
          name: `${zodiac.name} Woman`,
          description: "Characteristics of women of your zodiac sign.",
          bannerImg:
            "https://images.astroyogi.com/strapicmsprod/assets/Traits_ee14f625a9.webp",
          img: "https://images.astroyogi.com/strapicmsprod/assets/Aries_Woman_d09bd30095.svg",
          isSelected: false,
        },
      ],
    };
  };

  const [zodiacDetails, setZodiacDetails] = useState(
    data ? generateZodiacDetails(data) : null
  );

  const onClickSign = (data) => {
    const updatedSigns = zodiacDetails.zodiacSigns.map((sign) => ({
      ...sign,
      isSelected: sign.id === data.id,
    }));

    setZodiacDetails({
      ...zodiacDetails,
      zodiacSigns: updatedSigns,
    });
  };

  const onChat = (data) => {
    navigate(`/astrologer/expert/${data.FirstName}`, {
      state: { data: data },
    });
  };
  const zodiacData = [
    { label: "Positivity", value: "78%" },
    { label: "Lucky Number", value: "7" },

    { label: "Mood of the Day", value: "Optimistic" },
    { label: "Lucky Color", value: "Green" },
  ];
  return (
    <div>
      <HoroScopeBanner data={zodiacDetails} onClickSign={onClickSign} />
      <HoroTimmingList />
      <ContentCard
        title={data.name + " Daily Horoscope"}
        showDate
        bgColor={appColors.sec}
        description={data.description}
        zodiacData={zodiacData}
        isDailyHoroscope
      />

      <Astrologers onChat={onChat} />
      <Blogs />
    </div>
  );
};

export default DetailHoroscope;
