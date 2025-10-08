import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";

export const useTodayPanchang = () => {
  const navigate = useNavigate();
  const data = {
    bannerImg:
      "https://images.astroyogi.com/strapicmsprod/assets/Today_s_Panchang_76e383b98b.webp",
    bannerName: "Today Panchang",
    bannerDiscription:
      "As the name suggests, today panchang is a part of the Hindu Panchang or calendar, which is used to find out about the auspicious timings for Muhurat in a day. The daily Panchang is used to determine the best time to begin a new or propitious task.",

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
        isSelected: false,
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

  const onCardClick = (data) => {
    if (data.link) {
      navigate(data.link);
    }
  };

  return [data, onCardClick];
};
