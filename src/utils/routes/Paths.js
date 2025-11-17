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
  Daily,
  SignScreen,
  Monthly,
  Yesterday,
  Tomorrow,
  MatchMaking,
  Sadesati,
  MatchDetails,
  ChatWindow,
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
      DAILY: {
        path: "/horoscopes/:slug",
        element: SignScreen,
      },
      DAILY_DETAIL: {
        path: "/horoscopes/:slug/:sign",
        element: Daily,
      },
      MONTHLY: {
        path: "/horoscopes/monthly-horoscope",
        element: SignScreen,
      },
      MONTHLY_DETAIL: {
        path: "/horoscopes/monthly-horoscope/:sign",
        element: Monthly,
      },
      YESTERDAY: {
        path: "/horoscopes/yesterday-horoscope/:sign",
        element: Yesterday,
      },
      TOMORROW: {
        path: "/horoscopes/tomorrow-horoscope/:sign",
        element: Tomorrow,
      },
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
    MATCHMAKING: {
      path: "/matchmaking",
      element: MatchMaking,
    },
    MATCHMAKING_DETAILS: {
      path: "/matchmaking/match-making-details",
      element: MatchDetails,
    },

    KUNDLI: {
      path: "/kundli/:slug",
      element: Kundli,
    },
    SADESATI: {
      path: "/sadesati",
      element: Sadesati,
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
      path: "/talk-to-astrologers/expert/:name",
      element: Astrologers,
    },
    CHAT_WITH_ASTROLOGER: {
      path: "/talk-to-astrologers/chat/:id",
      element: ChatWindow,
    },
    STREAMING: {
      path: "/astrolive/streaming",
      element: Streaming,
      header: false,
    },
  },
};
