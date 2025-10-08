import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";

export const usePanchang = () => {
  const navigate = useNavigate();
  const data = {
    bannerImg:
      "https://images.astroyogi.com/strapicmsprod/assets/Panchang_afa5a8602c.webp",
    bannerName: "Horoscope",
    bannerDiscription:
      " Indian scriptures to provide information relevant to astrologers for them to forecast planetary occurrences and mark auspicious and inauspicious time frames for important occasions such as rites, rituals, festivals, marriage, education, investments, and other important activities of life. You can stay informed about the year's events and significant festivals by using the Hindu Panchang and calendars.A Panchang, also known as Panchangam, is a detailed Hindu calendar that resorts to the traditional units of the Indian scriptures to provide information relevant to astrologers for them to forecast planetary occurrences and mark auspicious and inauspicious time frames for important occasions such as rites, rituals, festivals, marriage, education, investments, and other important activities of life. You can stay informed about the year's events and significant festivals by using the Hindu Panchang and calendars.",

    cards: [
      {
        id: 1,
        name: "Panchang",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Panchang_6a39293e2a.svg",
        link: "",
        description: "",
      },
      {
        id: 2,
        name: "Today",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Panchang_6a39293e2a.svg",
        link: PATH.privateRoutes.PANCHANG_TODAY.path,
        description: "",
      },
      {
        id: 3,
        name: "Tithi",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Tithi_aaabd7ecf3.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 4,
        name: "Day",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Vaar_b74f1f78df.svg",
        link: PATH.privateRoutes.PANCHANG_VAAR,
        description: "",
      },
      {
        id: 5,
        name: "Muhurat",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Shubh_Muhurat_382b291b98.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 6,
        name: "Nakshatra",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Nakshatra_76f2e22ce2.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 7,
        name: "Choghadiya",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Choghadiya_3cfd3004ee.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 8,
        name: "Rahu Kaal",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Rahu_Kaal_10f423a8b6.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 9,
        name: "Shubh Hora",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Shubh_Hora_82eff94a27.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 10,
        name: "Yoga",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Yoga_0934cba27f.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 11,
        name: "Karana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Karana_40989cf6b4.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
      {
        id: 12,
        name: "Festival",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Festival_f0f7d3c92a.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
      },
    ],
  };

  const zodiacData = [
    { id: 1, label: "Date", value: "Wednesday, 08 October 2025" },
    {
      id: 2,
      label: "Tithi",
      value: "Krishna Dwitiya",
    },
    {
      id: 3,
      label: "Day",
      value: "Wednesday",
    },
    { id: 4, label: "Paksha", value: "Krishna-Paksha" },
    { id: 5, label: "Sunrise", value: "06:12:48 AM" },
    { id: 6, label: "Sunset", value: "05:56:28 PM" },
    { id: 7, label: "Moonrise", value: "06:39:41 PM" },
    { id: 8, label: "Nakshatra", value: "Ashwini" },
    { id: 9, label: "Yog", value: "Harshan" },
    { id: 10, label: "Yog Till", value: "01:33:59 AM" },
    { id: 11, label: "Nakshatra Till", value: "10:45:01 PM" },
    { id: 12, label: "Karan I", value: "Taitil" },
    { id: 13, label: "Surya Rashi", value: "Virgo" },
    { id: 14, label: "Chandra Rashi", value: "Aries" },
  ];

  const onChat = (data) => {
    navigate(`/astrologer/expert/${data.FirstName}`, {
      state: { data: data },
    });
  };

  const onCardClick = (data) => {
    if (data.link) {
      navigate(data.link);
    }
  };
  return [data, zodiacData, onChat, onCardClick];
};
