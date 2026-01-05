import VideoCalling from "../../component/call/VideoCall";
import AgoraVoiceCalling from "../../component/call/VoiceCall";
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
  // Sadesati,
  MatchDetails,
  About,
  Disclaimer,
  PricingPolicy,
  PrivacyPolicy,
  RefundPolicy,
  TermsConditions,
  Notification,
  WalletTranscations,
  AstrologerProfile,
} from "../../screens";
import SingleBlogDetails from "../../screens/private/blog/blogHeader/SingleBlog";
import AtmakarakaCalculator from "../../screens/private/calculator/Atmakaraka/AtmakarakaCalculator";
import AtmakarakaReport from "../../screens/private/calculator/Atmakaraka/Report";
import DashaCalc from "../../screens/private/calculator/dasha/DashaCalc";
import DashaReport from "../../screens/private/calculator/dasha/DashaReport";
import KaalSarpCalc from "../../screens/private/calculator/kaalsarp/KaalSarpCalc";
import KaalSarpReport from "../../screens/private/calculator/kaalsarp/KaalSarpReport";
import MangalDosha from "../../screens/private/calculator/mangaldosha/MangalDosha";
import MangalReport from "../../screens/private/calculator/mangaldosha/MangalReport";
import NumerologyCalc from "../../screens/private/calculator/numerology/NumerologyCalc";
import NumerologyReport from "../../screens/private/calculator/numerology/NumerologyReport";
import RashiCalc from "../../screens/private/calculator/rashi/RashiCalc";
import RashiReport from "../../screens/private/calculator/rashi/RashiReport";
import RisingSign from "../../screens/private/calculator/risingsign/RisingSign";
import RisingSignReport from "../../screens/private/calculator/risingsign/RisingSignReport";
import ShaniReport from "../../screens/private/calculator/shanisadesati/ShaniReport";
import ShaniSadeSati from "../../screens/private/calculator/shanisadesati/ShaniSadeSati";
import SunSignCalc from "../../screens/private/calculator/sunsign/SunSignCalc";
import SunSignReport from "../../screens/private/calculator/sunsign/SunSignReport";
import CompatibilityLanding from "../../screens/private/compatibility/CompatibilityLanding";
import CompatibilityResult from "../../screens/private/compatibility/CompatibilityResult";
import SelectPartner from "../../screens/private/compatibility/SelectPartner";
// import AstrologerIncomingCall from "../../screens/private/home/components/astrologers/AstrologerIncomingCall";
import AstrologersDashboard from "../../screens/private/home/components/astrologers/AstrologersDashboard";
import ChatList from "../../screens/private/home/components/astrologers/atrologerchat/ChatList";
import ChatWindow from "../../screens/private/home/components/chats/ChatWindow";
import InteractiveLiveStreaming from "../../screens/private/home/components/livestream/InteractiveLiveStreaming";
import LivePlayerPage from "../../screens/private/home/components/livestream/LivePlayerPage";
// import LivePlayerPage from "../../screens/private/home/components/livestream/LivePlayerPage";
import Weekly from "../../screens/private/horoscope/weeklyHoroscope/Weekly";
import Yearly from "../../screens/private/horoscope/yearlyHoroscope/Yearly";
import LifePathDetails from "../../screens/private/numerology/lifepath/LifePathDetails";
import LifePathForm from "../../screens/private/numerology/lifepath/LifePathForm";
import FinalPay from "../../screens/private/payment/FinalPay";
import ConsultantList from "../../screens/private/shop/consultant/ConsultantList";
import PaymentScreen from "../../screens/private/shop/consultant/PaymentScreen";
import PlayScreen from "../../screens/private/shop/detail/playscreen/PlayScreen";
import ProductDetail from "../../screens/private/shop/detail/ProductDetail";
import ProductList from "../../screens/private/shop/product/ProductList";
import BuisnessBreakupTarot from "../../screens/private/tarot/buisnessBreakupTarot/BuisnessBreakupTarot";
import TarotCards from "../../screens/private/tarot/card/TarotCard";
import CareerSelectTarot from "../../screens/private/tarot/careerSelectTarot/CareerSelectTarot";
import DailyTarot from "../../screens/private/tarot/dailyTarot/DailyTarot";
import EroticLove from "../../screens/private/tarot/eroticLove/EroticLove";
import FlirtTarot from "../../screens/private/tarot/flirtTarot/FlirtTarot";
import InDepthLove from "../../screens/private/tarot/inDepthLove/InDepthLove";
import LoveTriangleTarot from "../../screens/private/tarot/loveTriangleTarot/LoveTriangleTarot";
import MadeForEachOther from "../../screens/private/tarot/madeForEachOther/MadeForEachOther";
import RomanticBreakUpTarot from "../../screens/private/tarot/romanticBreakupTarot/RomanticBreakUpTarot";
import YesNoTarot from "../../screens/private/tarot/yesNoTarot/YesNoTarot";

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

    ASTRO_LIVE_STREAMING: {
      path: "/astrologer-dashboard/live-streaming",
      element: InteractiveLiveStreaming,
      header: false,
      footer: false,
    },

   AUDIENCE_LIVE_STREAMING: {
  path: "/live",
  element: LivePlayerPage,
  header: false,
  footer: false,
},


    PROFILE: {
      path: "/profile",
      element: Profile,
    },
    TALK_TO_ASTROLOGER: {
      path: "/talk-to-astrologers",
      element: TalkToAstrologer,
    },
    TALK_TO_ASTROLOGER_ONLINE: {
      path: "/talk-to-astrologers/online",
      element: TalkToAstrologer,
    },
    Chat_With_ASTROLOGER: {
      path: "/chat-with-astrologers",
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
        path: "/horoscopes/daily-horoscope/:sign",
        element: Daily,
      },
      WEEKLY_DETAIL: {
        path: "/horoscopes/weekly-horoscope/:sign",
        element: Weekly,
      },
      YEARLY_DETAIL: {
        path: "/horoscopes/yearly-horoscope/:sign",
        element: Yearly,
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
      TODAY: {
        path: "/horoscopes/todays-horoscope/:sign",
        element: Daily,
      },
    },
    HOROSCOPEDETAILS: {
      path: "/horoscopes/daily/:name-free-horoscope",
      element: DetailHoroscope,
    },

    //panchang
    PANCHANG: {
      path: "/panchang",
      element: TodayPanchang,
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
    KUNDLI_BY_ID: {
      path: "/kundli/:kundliId",
      element: Kundli,
      header: false,
      footer: false,
    },

    // SADESATI: {
    //   path: "/sadesati",
    //   element: Sadesati,
    // },
    NUMEROLOGY: {
      path: "/numerology",
      element: Numerology,
    },
    ATMAKARAKA_CALC: {
      path: "/atmakaraka-and-darakaraka-calculator",
      element: AtmakarakaCalculator,
    },
    ATMAKARAKA_REPORT: {
      path: "/atmakaraka-and-darakaraka-calculator/report",
      element: AtmakarakaReport,
    },
    SUNSIGN_CALC: {
      path: "/sun-sign-calculator",
      element: SunSignCalc,
    },
    SUNSIGN_REPORT: {
      path: "/sun-sign-calculator/report",
      element: SunSignReport,
    },
    RISINGSIGN_CALC: {
      path: "/rising-ascendant-sign-calculator",
      element: RisingSign,
    },
    RISINGSIGN_REPORT: {
      path: "/rising-ascendant-sign-calculator/report",
      element: RisingSignReport,
    },
    RASHI_CALC: {
      path: "/rashi-moon-sign-calculator",
      element: RashiCalc,
    },
    RASHI_REPORT: {
      path: "/rashi-moon-sign-calculator/report",
      element: RashiReport,
    },
    DASHA_CALC: {
      path: "/dasha-calculator",
      element: DashaCalc,
    },
    DASHA_REPORT: {
      path: "/dasha-calculator/report",
      element: DashaReport,
    },
    MANGAL_DOSHA_CALC: {
      path: "/mangal-kuja-dosha-calculator",
      element: MangalDosha,
    },
    MANGAL_DOSHA_REPORT: {
      path: "/mangal-kuja-dosha-calculator/report",
      element: MangalReport,
    },
    ShaniSadeSati_CALC: {
      path: "/shani-sade-sati-calculator",
      element: ShaniSadeSati,
    },
    ShaniSadeSati_REPORT: {
      path: "/shani-sade-sati-calculator/report",
      element: ShaniReport,
    },
    KaalSarp_CALC: {
      path: "/kaal-sarp-dosh-calculator",
      element: KaalSarpCalc,
    },
    KaalSarp_REPORT: {
      path: "/kaal-sarp-dosh-calculator/report",
      element: KaalSarpReport,
    },
    NUMEROLOGY_CALC: {
      path: "/name-numerology-calculator",
      element: NumerologyCalc,
    },
    NUMEROLOGY_REPORT: {
      path: "/name-numerology-calculator/report",
      element: NumerologyReport,
    },
    LIFE_PATH: {
      path: "/numerology/life-path",
      element: LifePathForm,
    },
    LIFE_PATH_DETAIL: {
      path: "/numerology/life-path/life-path-details",
      element: LifePathDetails,
    },
    //Compatibility
    COMPATIBILITY: {
      path: "/compatibility",
      element: CompatibilityLanding,
    },
    COMPATIBILITY_SelectPartner: {
      path: "/compatibility/select/:p1",
      element: SelectPartner,
    },
    COMPATIBILITY_RESULT: {
      path: "/compatibility/result/:p1/:p2",
      element: CompatibilityResult,
    },

    // tarot
    TAROT: {
      path: "/tarot",
      element: Tarot,
    },
    YES_NO_TAROT: {
      path: "tarot/yes-no-tarot",
      element: YesNoTarot,
    },
    DAILY_TAROT: {
      path: "tarot/daily-tarot",
      element: DailyTarot,
    },
    CAREER_SELECT_TAROT: {
      path: "tarot/career-select",
      element: CareerSelectTarot,
    },
    FLIRT_TAROT: {
      path: "tarot/flirt",
      element: FlirtTarot,
    },
    EROTIC_LOVE_TAROT: {
      path: "tarot/erotic-love",
      element: EroticLove,
    },
    MADE_FOR_EACH_OTHER_TAROT: {
      path: "tarot/made-for-each-other",
      element: MadeForEachOther,
    },
    IN_DEPTH_TAROT: {
      path: "tarot/in-depth-love",
      element: InDepthLove,
    },
    LOVE_TRIANGLE_TAROT: {
      path: "tarot/love-triangle",
      element: LoveTriangleTarot,
    },
    ROMANTIC_BREAKUP_TAROT: {
      path: "tarot/romantic-breakup",
      element: RomanticBreakUpTarot,
    },
    BUISNESS_BREAKUP_TAROT: {
      path: "tarot/buisness-breakup",
      element: BuisnessBreakupTarot,
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
    PRODUCT_LIST: {
      path: "/shop/:slug",
      element: ProductList,
    },
    PRODUCT_DETAIL: {
      path: "/shop/:slug/:productSlug",
      element: ProductDetail,
    },
    CONSULTANT_LIST: {
      path: "/shop/:slug/:productSlug/consultant",
      element: ConsultantList,
    },
    PLAYSCREEN: {
      path: "/shop/:slug/:productSlug/play",
      element: PlayScreen,
    },
    CONSULTANT_PAYMENT: {
      path: "/consultant/payment",
      element: PaymentScreen,
    },

    RECHARGE: {
      path: "/recharge",
      element: Payment,
    },
    FinalPay: {
      path: "/recharge/payment",
      element: FinalPay,
    },
    ASTROLOGERS: {
      path: "/talk-to-astrologers/expert/:name",
      element: Astrologers,
    },
    CHAT_WITH_ASTROLOGER: {
      path: "/talk-to-astrologers/:id",
      element: ChatWindow,
      footer: false,
    },
    PROFILE_ASTROLOGER: {
      path: "/astrologer/:id",
      element: AstrologerProfile,
      header: false,
    },

    VIDEO_CALL: {
      path: "/talk-to-astrologers/video-call/:channelName",
      element: VideoCalling,
    },

    ASTRO_VIDEO_CALL: {
      path: "/astrologer-dashboard/video-call/:channelName",
      element: VideoCalling,
    },

    VOICE_CALL: {
      path: "/talk-to-astrologers/voice-call/:roomId",
      element: AgoraVoiceCalling,
    },

    ASTRO_VOICE_CALL: {
      path: "/astrologer-dashboard/voice-call/:roomId",
      element: AgoraVoiceCalling,
    },
    STREAMING: {
      path: "/astrolive/streaming",
      element: Streaming,
      header: false,
      footer: false,
    },
    ABOUT: {
      path: "/aboutus",
      element: About,
      header: false,
    },
    DISCLAIMER: {
      path: "/disclaimer",
      element: Disclaimer,
      header: false,
    },
    PRICING_POLICY: {
      path: "/pricing-policy",
      element: PricingPolicy,
      header: false,
    },
    PRIVACY_POLICY: {
      path: "/privacy-policy",
      element: PrivacyPolicy,
      header: false,
    },
    REFUND_POLICY: {
      path: "/refund-and-cancellation-policy",
      element: RefundPolicy,
      header: false,
    },
    TERMSCONDITIONS: {
      path: "/terms-conditions",
      element: TermsConditions,
      header: false,
    },

    // Header
    NOTIFICATION: {
      path: "/notification",
      element: Notification,
    },
    WalletTranscations: {
      path: "/wallet-transactions",
      element: WalletTranscations,
    },
  },
};
