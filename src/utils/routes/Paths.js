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
} from "../../screens";
import SingleBlogDetails from "../../screens/private/blog/blogHeader/SingleBlog";
import AstrologerIncomingCall from "../../screens/private/home/components/astrologers/AstrologerIncomingCall";
import AstrologersDashboard from "../../screens/private/home/components/astrologers/AstrologersDashboard";
import ChatList from "../../screens/private/home/components/astrologers/atrologerchat/ChatList";
import ChatWindow from "../../screens/private/home/components/astrologers/atrologerchat/ChatWindow";
import LifePathDetails from "../../screens/private/numerology/lifepath/LifePathDetails";
import LifePathForm from "../../screens/private/numerology/lifepath/LifePathForm";
import TarotCards from "../../screens/private/tarot/card/TarotCard";

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
    ASTROLOGER_DASHBOARD: {
      path: "/astrologer-dashboard",
      element: AstrologersDashboard,
    },

    ASTROLOGER_CHAT_USER_LIST: {
      path: "/astrologer-dashboard/astrologer-chat-user-list",
      element: ChatList,
    },
    ASTROLOGER_CHAT_WINDOW: {
      path: "/astrologer-dashboard/astrologer-chat-user-list/:chatId",
      element: ChatWindow,
    },
    ASTROLOGER_CALL_WINDOW: {
      path: "/astrologer-dashboard/astrololger-call",
      element: AstrologerIncomingCall,
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
      path: "/kundli",
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
    LIFE_PATH: {
      path: "/numerology/life-path",
      element: LifePathForm,
    },
    LIFE_PATH_DETAIL: {
      path: "/numerology/life-path/life-path-details",
      element: LifePathDetails,
    },

    // tarot
    TAROT: {
      path: "/tarot",
      element: Tarot,
    },
    YES_NO_TAROT: {
      path: "tarot/yes-no-tarot",
      element: TarotCards,
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
    SINGLEBLOG: {
      path: "/blog/:slug",
      element: SingleBlogDetails,
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
      path: "/talk-to-astrologers/:id",
      element: ChatWindow,
    },
    STREAMING: {
      path: "/astrolive/streaming",
      element: Streaming,
      header: false,
    },
  },
};
