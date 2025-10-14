import {
  Login,
  Register,
  ForgotPassword,
  OtpVerification,
  VerifyPassword,
  Home,
  Horoscope,
  Panchang,
  Kundli,
  Numerology,
  Tarot,
  FreeReadings,
  AstroLive,
  Video,
  Blog,
  SessionDetails,
  Shop,
  Profile,
  TalkToAstrologer,
  Payment,
  Astrologers,
  Streaming,
  DetailHoroscope,
  TodayPanchang,
  Vaar,
  Tithi,
  OneCardTarot,
  ThreeCardTarot,
  WellNessTarot,
  TarotResult,
} from "../../screens";

export const PATH = {
  // DEFAULT: {
  //     path: "/",
  //     pageName: "Home",
  // },
  publicRoutes: {
    LOGIN: {
      path: "/login",
      element: Login,
    },
    REGISTER: {
      path: "/register",
      element: Register,
    },
    FORGOT_PASSWORD: {
      path: "/forgot-password",
      element: ForgotPassword,
    },
    OTP_VERIFICATION: {
      path: "/otp-verification",
      element: OtpVerification,
    },
    VERIFY_PASSWORD: {
      path: "/verify-password/:id",
      element: VerifyPassword,
    },
  },

  privateRoutes: {
    HOME: {
      path: "/",
      element: Home,
    },

    PROFILE: {
      path: "/profile",
      element: Profile,
    },
    TALK_TO_ASTROLOGER: {
      path: "/talk-to-astrologers",
      element: TalkToAstrologer,
    },
    HOROSCOPE: {
      path: "/horoscopes",
      element: Horoscope,
    },
    HOROSCOPEDETAILS: {
      path: "/horoscopes/daily/:name-free-horoscope",
      element: DetailHoroscope,
    },

    //panchang
    PANCHANG: {
      path: "/panchang",
      element: Panchang,
    },
    PANCHANG_TODAY: {
      path: "/panchang/today-panchang",
      element: TodayPanchang,
    },
    PANCHANG_VAAR: {
      path: "/panchang/vaar",
      element: Vaar,
    },
    PANCHANG_TITHI: {
      path: "/panchang/tithi",
      element: Tithi,
    },

    KUNDLI: {
      path: "/kundli",
      element: Kundli,
    },
    NUMEROLOGY: {
      path: "/numerology",
      element: Numerology,
    },
    // tarot
    TAROT: {
      path: "/tarot",
      element: Tarot,
    },
    TAROT_ONE_CARD: {
      path: "/tarot/one-card-reading",
      element: OneCardTarot,
    },
    TAROT_THREE_CARD: {
      path: "/tarot/three-card-reading",
      element: ThreeCardTarot,
    },
    TAROT_WELLNESS: {
      path: "/tarot/wellness-tarot",
      element: WellNessTarot,
    },
    TAROT_RESULT: {
      path: "/tarot/result",
      element: TarotResult,
    },

    FREE_READINGS: {
      path: "/readings",
      element: FreeReadings,
    },
    ASTRO_LIVE: {
      path: "/astrolive",
      element: AstroLive,
    },
    VIDEO: {
      path: "/video",
      element: Video,
    },
    BLOG: {
      path: "/blog",
      element: Blog,
    },
    SESSION_DETAILS: {
      path: "/session-details",
      element: SessionDetails,
    },
    SHOP: {
      path: "/shop",
      element: Shop,
    },

    RECHARGE: {
      path: "/callingpack",
      element: Payment,
    },
    ASTROLOGERS: {
      path: "/astrologer/expert/:name",
      element: Astrologers,
    },
    STREAMING: {
      path: "/astrolive/streaming",
      element: Streaming,
      header: false,
    },
  },
};
