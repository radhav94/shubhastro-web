import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";

export const useTithi = () => {
  const navigate = useNavigate();
  const data = {
    bannerImg:
      "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Vaar_8d062e785a.webp",
    bannerName: "Today Tithi",
    bannerDiscription:
      "In the Hindu calendar or Panchang, tithi or thithi is a full lunar day or the time taken by the longitudinal angle between the sun and moon to increase by 12°. There are a total of 30 tithis in a month defined in Vedic Astrology.",
    cards: [
      {
        id: 1,
        name: "Panchang",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Panchang_6a39293e2a.svg",
        link: PATH.privateRoutes.PANCHANG.path,
        description: "",
        isSelected: false,
      },
      {
        id: 2,
        name: "Today",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Panchang_6a39293e2a.svg",
        link: PATH.privateRoutes.PANCHANG_TODAY.path,
        description: "",
        isSelected: false,
      },
      {
        id: 3,
        name: "Tithi",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Tithi_aaabd7ecf3.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: true,
      },
      {
        id: 4,
        name: "Day",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Vaar_b74f1f78df.svg",
        link: PATH.privateRoutes.PANCHANG_VAAR,
        description: "",
        isSelected: false,
      },
      {
        id: 5,
        name: "Muhurat",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Shubh_Muhurat_382b291b98.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 6,
        name: "Nakshatra",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Nakshatra_76f2e22ce2.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 7,
        name: "Choghadiya",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Choghadiya_3cfd3004ee.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 8,
        name: "Rahu Kaal",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Rahu_Kaal_10f423a8b6.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 9,
        name: "Shubh Hora",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Shubh_Hora_82eff94a27.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 10,
        name: "Yoga",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Yoga_0934cba27f.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 11,
        name: "Karana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Karana_40989cf6b4.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
      {
        id: 12,
        name: "Festival",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Festival_f0f7d3c92a.svg",
        link: PATH.privateRoutes.PANCHANG_TITHI.path,
        description: "",
        isSelected: false,
      },
    ],
  };

  const zodiacDetails = [
    {
      id: 1,
      label: "Location & Date",
      value: "Ujjain, Wednesday, 08 October 2025",
    },
    { id: 2, label: "Tithi", value: "Krishna Dwitiya" },
    { id: 3, label: "Nakshatra", value: "Ashwini" },
    { id: 4, label: "Karana", value: "Gara" },
    { id: 5, label: "Paksha", value: "Krishna-Paksha" },
    { id: 6, label: "Yoga", value: "Harshan till 01:32:11 AM" },
    { id: 7, label: "Day", value: "Wednesday" },

    // Sun & Moon Calculations
    { id: 8, label: "Sun Rise - Sun Set", value: "06:12:48 AM - 05:56:28 PM" },
    {
      id: 9,
      label: "Moon Rise - Moon Set",
      value: "06:39:41 PM - 07:15:02 AM",
    },
    { id: 10, label: "Ritu", value: "Sharad" },
    { id: 11, label: "Moon Sign", value: "Aries" },

    // Hindu Month & Year
    { id: 12, label: "Shaka Samvat", value: "1947" },
    { id: 13, label: "Vikram Samvat", value: "2082" },
    { id: 14, label: "Month Amanta", value: "Ashwin" },
    { id: 15, label: "Month Purnimanta", value: "Kartika" },

    // Inauspicious Timings
    { id: 16, label: "Rahu Kaal", value: "12:04:37 PM to 01:32:35 PM" },
    { id: 17, label: "Yamaganda", value: "07:40:45 AM to 09:08:43 AM" },
    { id: 18, label: "Gulika Kaal", value: "10:36:40 AM to 12:04:38 PM" },

    // Auspicious Timings
    { id: 19, label: "Abhijit", value: "11:41:00 AM to 12:27:00 PM" },
  ];

  const onCardClick = (data) => {
    if (data.link) {
      navigate(data.link);
    }
  };

  const onSubmit = () => {};

  return [data, onCardClick, onSubmit, zodiacDetails];
};
