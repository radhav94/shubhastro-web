import { lazy } from "react";

const NotFound = lazy(() => import("../../screens/private/NotFound/NotFound"));

const VideoCalling = lazy(() => import("../../component/call/VideoCall"));
const AgoraVoiceCalling = lazy(() => import("../../component/call/VoiceCall"));
const Onboarding = lazy(() => import("../../screens/public/onboarding/Onboarding"));

const Login = lazy(() => import("../../screens/public/Login"));
const Register = lazy(() => import("../../screens/public/Register"));
const ForgotPassword = lazy(() => import("../../screens/public/ForgotPassword"));
const OtpVerification = lazy(() => import("../../screens/public/OtpVerification"));
const VerifyPassword = lazy(() => import("../../screens/public/VerifyPassword"));
const Horoscope = lazy(() => import("../../screens/private/horoscope/Horoscope"));
const Kundli = lazy(() => import("../../screens/private/kundli/Kundali"));
const Numerology = lazy(() => import("../../screens/private/numerology/Numerology"));
const Tarot = lazy(() => import("../../screens/private/tarot/Tarot"));
const FreeReadings = lazy(() => import("../../screens/private/readings/Readings"));
const AstroLive = lazy(() => import("../../screens/private/astroLive/AstroLive"));
const Video = lazy(() => import("../../screens/private/video/Video"));
const Blog = lazy(() => import("../../screens/private/blog/Blog"));
const SessionDetails = lazy(() => import("../../screens/private/sessionDetails/SessionDetails"));
const Shop = lazy(() => import("../../screens/private/shop/Shop"));
const Profile = lazy(() => import("../../screens/private/profile/Profile"));
const TalkToAstrologer = lazy(() => import("../../screens/private/talkToAstrologer/TalkToAstrologer"));
const Payment = lazy(() => import("../../screens/private/payment/Payment"));
const Astrologers = lazy(() => import("../../screens/private/astrologersold/Astrologers"));
const Streaming = lazy(() => import("../../screens/private/astroLive/streaming/Streaming"));
const DetailHoroscope = lazy(() => import("../../screens/private/horoscope/detailHoroscope/DetailHoroscope"));
const TodayPanchang = lazy(() => import("../../screens/private/panchang/todayPanchang/TodayPanchang"));
const Vaar = lazy(() => import("../../screens/private/panchang/vaar/Vaar"));
const Tithi = lazy(() => import("../../screens/private/panchang/tithi/Tithi"));
const OneCardTarot = lazy(() => import("../../screens/private/tarot/oneCardTarot/OneCardTarot"));
const ThreeCardTarot = lazy(() => import("../../screens/private/tarot/threeCardTarot/ThreeCardTarot"));
const WellNessTarot = lazy(() => import("../../screens/private/tarot/wellNessTarot/WellNessTarot"));
const TarotResult = lazy(() => import("../../screens/private/tarot/resultTarot/ResultTarot"));
const Daily = lazy(() => import("../../screens/private/horoscope/dailyHoroscope/Daily"));
const SignScreen = lazy(() => import("../../screens/private/horoscope/SignScreen"));
const Monthly = lazy(() => import("../../screens/private/horoscope/monthlyHoroscope/Monthly"));
const Yesterday = lazy(() => import("../../screens/private/horoscope/yesterdayhoroscope/Yesterday"));
const Tomorrow = lazy(() => import("../../screens/private/horoscope/tomorrowhoroscope/Tomorrow"));
const MatchMaking = lazy(() => import("../../screens/private/matchmaking/MatchMakingV2"));
const MatchDetails = lazy(() => import("../../screens/private/matchmaking/details/MatchDetailsV2"));
const About = lazy(() => import("../../screens/public/static-pages/About"));
const Disclaimer = lazy(() => import("../../screens/public/static-pages/Disclaimer"));
const PricingPolicy = lazy(() => import("../../screens/public/static-pages/PricingPolicy"));
const PrivacyPolicy = lazy(() => import("../../screens/public/static-pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("../../screens/public/static-pages/RefundPolicy"));
const TermsConditions = lazy(() => import("../../screens/public/static-pages/TermsConditions"));
const Notification = lazy(() => import("../../screens/private/notification/Notification"));
const WalletTranscations = lazy(() => import("../../screens/private/wallet/WalletTranscations"));
const AstrologerProfile = lazy(() => import("../../screens/private/astrologerProfile/AstrologerProfile"));

const SingleBlogDetails = lazy(() => import("../../screens/private/blog/blogHeader/SingleBlog"));

const AgeCalc = lazy(() => import("../../screens/private/calculator/ageCalculator/AgeCalc"));
const AgeReport = lazy(() => import("../../screens/private/calculator/ageCalculator/AgeReport"));
const AtmakarakaCalculator = lazy(() => import("../../screens/private/calculator/Atmakaraka/AtmakarakaCalculator"));
const AtmakarakaReport = lazy(() => import("../../screens/private/calculator/Atmakaraka/Report"));
const BirthCalc = lazy(() => import("../../screens/private/calculator/birthCalc/BirthCalc"));
const BirthReport = lazy(() => import("../../screens/private/calculator/birthCalc/BirthReport"));
const DashaCalc = lazy(() => import("../../screens/private/calculator/dasha/DashaCalc"));
const DashaReport = lazy(() => import("../../screens/private/calculator/dasha/DashaReport"));
const DestinyCalc = lazy(() => import("../../screens/private/calculator/destiny/DestinyCalc"));
const DestinyReport = lazy(() => import("../../screens/private/calculator/destiny/DestinyReport"));
const FlamesCalc = lazy(() => import("../../screens/private/calculator/flames/FlamesCalc"));
const FlamesReport = lazy(() => import("../../screens/private/calculator/flames/FlamesReport"));
const Friendship = lazy(() => import("../../screens/private/calculator/friendship/Friendship"));
const FriendshipReport = lazy(() => import("../../screens/private/calculator/friendship/FriendshipReport"));
const KaalSarpCalc = lazy(() => import("../../screens/private/calculator/kaalsarp/KaalSarpCalc"));
const KaalSarpReport = lazy(() => import("../../screens/private/calculator/kaalsarp/KaalSarpReport"));
const LoveCalc = lazy(() => import("../../screens/private/calculator/love/LoveCalc"));
const LoveReport = lazy(() => import("../../screens/private/calculator/love/LoveReport"));
const MangalDosha = lazy(() => import("../../screens/private/calculator/mangaldosha/MangalDosha"));
const MangalReport = lazy(() => import("../../screens/private/calculator/mangaldosha/MangalReport"));
const MobileCalc = lazy(() => import("../../screens/private/calculator/mobileNumber/MobileCalc"));
const MobileReport = lazy(() => import("../../screens/private/calculator/mobileNumber/MobileReport"));
const NumerologyCalc = lazy(() => import("../../screens/private/calculator/numerology/NumerologyCalc"));
const NumerologyReport = lazy(() => import("../../screens/private/calculator/numerology/NumerologyReport"));
const RashiCalc = lazy(() => import("../../screens/private/calculator/rashi/RashiCalc"));
const RashiReport = lazy(() => import("../../screens/private/calculator/rashi/RashiReport"));
const RisingSign = lazy(() => import("../../screens/private/calculator/risingsign/RisingSign"));
const RisingSignReport = lazy(() => import("../../screens/private/calculator/risingsign/RisingSignReport"));
const ShaniReport = lazy(() => import("../../screens/private/calculator/shanisadesati/ShaniReport"));
const ShaniSadeSati = lazy(() => import("../../screens/private/calculator/shanisadesati/ShaniSadeSati"));
const SunSignCalc = lazy(() => import("../../screens/private/calculator/sunsign/SunSignCalc"));
const SunSignReport = lazy(() => import("../../screens/private/calculator/sunsign/SunSignReport"));
const VehicleCalc = lazy(() => import("../../screens/private/calculator/vehicleNumber/VehicleCalc"));
const VehicleReport = lazy(() => import("../../screens/private/calculator/vehicleNumber/VehicleReport"));

const CompatibilityLanding = lazy(() => import("../../screens/private/compatibility/CompatibilityLanding"));
const CompatibilityResult = lazy(() => import("../../screens/private/compatibility/CompatibilityResult"));
const SelectPartner = lazy(() => import("../../screens/private/compatibility/SelectPartner"));

const AstrologersDashboard = lazy(() => import("../../screens/private/home/components/astrologers/AstrologersDashboard"));
const ChatList = lazy(() => import("../../screens/private/home/components/astrologers/atrologerchat/ChatList"));
const ChatWindow = lazy(() => import("../../screens/private/home/components/chats/ChatWindow"));
const InteractiveLiveStreaming = lazy(() => import("../../screens/private/home/components/livestream/InteractiveLiveStreaming"));
const LivePlayerPage = lazy(() => import("../../screens/private/home/components/livestream/LivePlayerPage"));

const Weekly = lazy(() => import("../../screens/private/horoscope/weeklyHoroscope/Weekly"));
const Yearly = lazy(() => import("../../screens/private/horoscope/yearlyHoroscope/Yearly"));
const HoroscopeNew = lazy(() => import("../../screens/private/horoscope/Horoscope"));

const LifePathDetails = lazy(() => import("../../screens/private/numerology/lifepath/LifePathDetails"));
const LifePathForm = lazy(() => import("../../screens/private/numerology/lifepath/LifePathForm"));

const AIWow = lazy(() => import("../../screens/private/aiwow/AIWow"));
const PalmistryLanding = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryLanding"));
const PalmistryHandSelection = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryHandSelection"));
const PalmistryInstructions = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryInstructions"));
const PalmistryCamera = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryCamera"));
const PalmistryAnalysis = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryAnalysis"));
const PalmistryResult = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryResult"));
const FaceReadingLanding = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingLanding"));
const FaceReadingInstructions = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingInstructions"));
const FaceReadingCamera = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingCamera"));
const FaceReadingAnalysis = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingAnalysis"));
const FaceReadingResult = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingResult"));
const SignatureLanding = lazy(() => import("../../screens/private/aiwow/signature/SignatureLanding"));
const SignatureInstructions = lazy(() => import("../../screens/private/aiwow/signature/SignatureInstructions"));
const SignatureCamera = lazy(() => import("../../screens/private/aiwow/signature/SignatureCamera"));
const SignatureAnalysis = lazy(() => import("../../screens/private/aiwow/signature/SignatureAnalysis"));
const SignatureResult = lazy(() => import("../../screens/private/aiwow/signature/SignatureResult"));
const GemstoneLanding = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneLanding"));
const GemstoneInstructions = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneInstructions"));
const GemstoneCamera = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneCamera"));
const GemstoneAnalysis = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneAnalysis"));
const GemstoneResult = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneResult"));
const ClothColorLanding = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorLanding"));
const ClothColorForm = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorForm"));
const ClothColorInstructions = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorInstructions"));
const ClothColorCamera = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorCamera"));
const ClothColorAnalysis = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorAnalysis"));
const ClothColorResult = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorResult"));
const TalkToKundliChat = lazy(() => import("../../screens/private/aiwow/talktokundli/TalkToKundliChat"));
const CosmicChat = lazy(() => import("../../screens/private/aiwow/cosmicchat/CosmicChat"));
const DailyCosmicBriefing = lazy(() => import("../../screens/private/aiwow/dailycosmicbriefing/DailyCosmicBriefing"));
const DreamInterpreter = lazy(() => import("../../screens/private/aiwow/dreaminterpreter/DreamInterpreter"));
const AgenticCalendar = lazy(() => import("../../screens/private/aiwow/agenticcalendar/AgenticCalendar"));
const SmartMatchmaking = lazy(() => import("../../screens/private/aiwow/smartmatchmaking/SmartMatchmaking"));
const KarmicDebtTracker = lazy(() => import("../../screens/private/aiwow/karmicdebt/KarmicDebtTracker"));
const AstroVitals = lazy(() => import("../../screens/private/aiwow/astrovitals/AstroVitals"));
const AuraLanding = lazy(() => import("../../screens/private/aiwow/aura/AuraLanding"));
const AuraInstructions = lazy(() => import("../../screens/private/aiwow/aura/AuraInstructions"));
const AuraCamera = lazy(() => import("../../screens/private/aiwow/aura/AuraCamera"));
const AuraAnalysis = lazy(() => import("../../screens/private/aiwow/aura/AuraAnalysis"));
const AuraResult = lazy(() => import("../../screens/private/aiwow/aura/AuraResult"));

const SingleCallHistory = lazy(() => import("../../screens/private/orderHistory/components/Call/SingleCallHistory"));
const SingleChatHistory = lazy(() => import("../../screens/private/orderHistory/components/Chat/SingleChatHistory"));
const OrderHistory = lazy(() => import("../../screens/private/orderHistory/OrderHistory"));
const OrderDetails = lazy(() => import("../../screens/private/orderHistory/OrderDetails"));

const FinalPay = lazy(() => import("../../screens/private/payment/FinalPay"));

const ConsultantList = lazy(() => import("../../screens/private/shop/consultant/ConsultantList"));
const PaymentScreen = lazy(() => import("../../screens/private/shop/consultant/PaymentScreen"));
const PlayScreen = lazy(() => import("../../screens/private/shop/detail/playscreen/PlayScreen"));
const ProductDetail = lazy(() => import("../../screens/private/shop/detail/ProductDetail"));
const ProductList = lazy(() => import("../../screens/private/shop/product/ProductList"));

const BuisnessBreakupTarot = lazy(() => import("../../screens/private/tarot/buisnessBreakupTarot/BuisnessBreakupTarot"));
const CareerSelectTarot = lazy(() => import("../../screens/private/tarot/careerSelectTarot/CareerSelectTarot"));
const DailyTarot = lazy(() => import("../../screens/private/tarot/dailyTarot/DailyTarot"));
const EroticLove = lazy(() => import("../../screens/private/tarot/eroticLove/EroticLove"));
const FlirtTarot = lazy(() => import("../../screens/private/tarot/flirtTarot/FlirtTarot"));
const InDepthLove = lazy(() => import("../../screens/private/tarot/inDepthLove/InDepthLove"));
const LoveTriangleTarot = lazy(() => import("../../screens/private/tarot/loveTriangleTarot/LoveTriangleTarot"));
const MadeForEachOther = lazy(() => import("../../screens/private/tarot/madeForEachOther/MadeForEachOther"));
const RomanticBreakUpTarot = lazy(() => import("../../screens/private/tarot/romanticBreakupTarot/RomanticBreakUpTarot"));
const YesNoTarot = lazy(() => import("../../screens/private/tarot/yesNoTarot/YesNoTarot"));

const TarotReadingPage = lazy(() => import("../../screens/private/v2/tarot/TarotReadingPage"));
const TarotCardDetailPage = lazy(() => import("../../screens/private/v2/tarot/TarotCardDetailPage"));
const TarotCardSelectionPage = lazy(() => import("../../screens/private/v2/tarot/TarotCardSelectionPage"));
const LoveTriangleSelectionPage = lazy(() => import("../../screens/private/v2/tarot/LoveTriangleSelectionPage"));
const LoveTriangleResultPage = lazy(() => import("../../screens/private/v2/tarot/LoveTriangleResultPage"));

const Home = lazy(() => import("../../screens/v2/home/Home"));
const ProfileV2 = lazy(() => import("../../screens/v2/user/Profile"));
const Explore = lazy(() => import("../../screens/private/explore/Explore"));
const AddProfile = lazy(() => import("../../screens/v2/user/AddProfile"));
const EditProfile = lazy(() => import("../../screens/v2/user/EditProfile"));
const LiveLanding = lazy(() => import("../../screens/private/live/LiveLanding"));
const FAQ = lazy(() => import("../../screens/v2/user/FAQ"));
const CustomerSupport = lazy(() => import("../../screens/v2/user/CustomerSupport"));
const RecentTickets = lazy(() => import("../../screens/v2/user/RecentTickets"));
const TicketDetails = lazy(() => import("../../screens/v2/user/TicketDetails"));
const PrivacySecurity = lazy(() => import("../../screens/v2/user/PrivacySecurity"));
const TermsConditionsView = lazy(() => import("../../screens/v2/user/TermsConditionsView"));
const AppLicense = lazy(() => import("../../screens/v2/user/AppLicense"));

export const PATH = {
  // DEFAULT: {
  //     path: "/",
  //     pageName: "Home",
  // },
  publicRoutes: {
    ONBOARDING: {
      // path: "/onboarding",
      // element: Onboarding,
    },
    LOGIN: {
      path: "/login",
      element: Onboarding,
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
    NOT_FOUND:{
      path: "*",
      element: NotFound,
    }
  },

  privateRoutes: {
    HOME: {
      path: "/",
      element: Home,
      header: true,
      footer: true,
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
    },

    LIVE_LANDING: {
      path: "/live-landing",
      element: LiveLanding,
      header: false,
      footer: false,
    },

    AUDIENCE_LIVE_STREAMING: {
      path: "/live",
      element: LivePlayerPage,
      // header: false,
      footer: false,
    },

    PROFILE: {
      path: "/profile",
      element: ProfileV2,
      header: false,
      footer: true,
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
      DAILY_NEW: {
        path: ["/horoscopes/daily-horoscope/:sign", "/horoscopes/daily-horoscope"],
        element: HoroscopeNew,
      },
      WEEKLY_NEW: {
        path: ["/horoscopes/weekly-horoscope/:sign", "/horoscopes/weekly-horoscope"],
        element: HoroscopeNew,
      },
      YEARLY_NEW: {
        path: ["/horoscopes/yearly-horoscope/:sign", "/horoscopes/yearly-horoscope"],
        element: HoroscopeNew,
      },
      TODAY_NEW: {
        path: ["/horoscopes/todays-horoscope/:sign", "/horoscopes/todays-horoscope"],
        element: HoroscopeNew,
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
      header: false,
    },
    MATCHMAKING_DETAILS: {
      path: "/matchmaking/match-making-details",
      element: MatchDetails,
    },

    KUNDLI: {
      path: "/kundli",
      element: Kundli,
      header: false,
    },
    KUNDLI_BY_ID: {
      path: "/kundli/:kundliId",
      element: Kundli,
      header: true,
      footer: false,
    },

    // SADESATI: {
    //   path: "/sadesati",
    //   element: Sadesati,
    // },
    NUMEROLOGY: {
      path: "/numerology",
      element: Numerology,
      header: false,
    },
    LOVE_CALC: {
      path: "/love-calculator",
      element: LoveCalc,
    },
    LOVE_REPORT: {
      path: "/love-calculator/report",
      element: LoveReport,
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
    FLAMES_CALC: {
      path: "/flames-calculator",
      element: FlamesCalc,
    },
    FLAMES_REPORT: {
      path: "/flames-calculator/report",
      element: FlamesReport,
    },
    LUCKY_VEHICLE_CALC: {
      path: "/lucky-vehicle-number-calculator",
      element: VehicleCalc,
    },
    LUCKY_VEHICLE_REPORT: {
      path: "/lucky-vehicle-number-calculator/report",
      element: VehicleReport,
    },
    FRIENDSHIP_CALC: {
      path: "/friendship-calculator",
      element: Friendship,
    },
    FRIENDSHIP_REPORT: {
      path: "/friendship-calculator/report",
      element: FriendshipReport,
    },
    AGE_CALC: {
      path: "/age-calculator",
      element: AgeCalc,
    },
    AGE_REPORT: {
      path: "/age-calculator/report",
      element: AgeReport,
    },
    MOBILE_NUMBER_CALC: {
      path: "/mobile-number-numerology-calculator",
      element: MobileCalc,
    },
    MOBILE_NUMBER_REPORT: {
      path: "/mobile-number-numerology-calculator/report",
      element: MobileReport,
    },
    DESTINY_NUMBER_CALC: {
      path: "/destiny-number-calculator",
      element: DestinyCalc,
    },
    DESTINY_NUMBER_REPORT: {
      path: "/destiny-number-calculator/report",
      element: DestinyReport,
    },
    BIRTH_CHART_CALC: {
      path: "/birth-natal-chart-calculator",
      element: BirthCalc,
    },
    BIRTH_CHART__REPORT: {
      path: "/birth-natal-chart-calculator/report",
      element: BirthReport,
    },
    LIFE_PATH: {
      path: "/numerology/life-path",
      element: LifePathForm,
    },
    LIFE_PATH_DETAIL: {
      path: "/numerology/life-path/life-path-details",
      element: LifePathDetails,
    },

    // AI WOW
    AI_WOW: {
      path: "/aiwow",
      element: AIWow,
      header: false,
      footer: false,
    },
    PALMISTRY_LANDING: {
      path: "/aiwow/ai-palmistry-scanner",
      element: PalmistryLanding,
      header: false,
      footer: false,
    },
    PALMISTRY_HAND_SELECTION: {
      path: "/aiwow/palmistry/hand-selection",
      element: PalmistryHandSelection,
      header: false,
      footer: false,
    },
    PALMISTRY_INSTRUCTIONS: {
      path: "/aiwow/palmistry/instructions",
      element: PalmistryInstructions,
      header: false,
      footer: false,
    },
    PALMISTRY_CAMERA: {
      path: "/aiwow/palmistry/camera",
      element: PalmistryCamera,
      header: false,
      footer: false,
    },
    PALMISTRY_ANALYSIS: {
      path: "/aiwow/palmistry/capture",
      element: PalmistryAnalysis,
      header: false,
      footer: false,
    },
    PALMISTRY_RESULT: {
      path: "/aiwow/palmistry/result",
      element: PalmistryResult,
      header: false,
      footer: false,
    },
    FACE_READING_LANDING: {
      path: "/aiwow/astro-face-reading",
      element: FaceReadingLanding,
      header: false,
      footer: false,
    },
    FACE_READING_INSTRUCTIONS: {
      path: "/aiwow/face-reading/instructions",
      element: FaceReadingInstructions,
      header: false,
      footer: false,
    },
    FACE_READING_CAMERA: {
      path: "/aiwow/face-reading/camera",
      element: FaceReadingCamera,
      header: false,
      footer: false,
    },
    FACE_READING_ANALYSIS: {
      path: "/aiwow/face-reading/capture",
      element: FaceReadingAnalysis,
      header: false,
      footer: false,
    },
    FACE_READING_RESULT: {
      path: "/aiwow/face-reading/result",
      element: FaceReadingResult,
      header: false,
      footer: false,
    },
    SIGNATURE_LANDING: {
      path: "/aiwow/signature-analysis",
      element: SignatureLanding,
      header: false,
      footer: false,
    },
    SIGNATURE_INSTRUCTIONS: {
      path: "/aiwow/signature/instructions",
      element: SignatureInstructions,
      header: false,
      footer: false,
    },
    SIGNATURE_CAMERA: {
      path: "/aiwow/signature/camera",
      element: SignatureCamera,
      header: false,
      footer: false,
    },
    SIGNATURE_ANALYSIS: {
      path: "/aiwow/signature/capture",
      element: SignatureAnalysis,
      header: false,
      footer: false,
    },
    SIGNATURE_RESULT: {
      path: "/aiwow/signature/result",
      element: SignatureResult,
      header: false,
      footer: false,
    },
    GEMSTONE_LANDING: {
      path: "/aiwow/gemstone-authenticity",
      element: GemstoneLanding,
      header: false,
      footer: false,
    },
    GEMSTONE_INSTRUCTIONS: {
      path: "/aiwow/gemstone/instructions",
      element: GemstoneInstructions,
      header: false,
      footer: false,
    },
    GEMSTONE_CAMERA: {
      path: "/aiwow/gemstone/camera",
      element: GemstoneCamera,
      header: false,
      footer: false,
    },
    GEMSTONE_ANALYSIS: {
      path: "/aiwow/gemstone/capture",
      element: GemstoneAnalysis,
      header: false,
      footer: false,
    },
    GEMSTONE_RESULT: {
      path: "/aiwow/gemstone/result",
      element: GemstoneResult,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_LANDING: {
      path: "/aiwow/clothes-colour-analysis",
      element: ClothColorLanding,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_FORM: {
      path: "/aiwow/cloth-color/form",
      element: ClothColorForm,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_INSTRUCTIONS: {
      path: "/aiwow/cloth-color/instructions",
      element: ClothColorInstructions,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_CAMERA: {
      path: "/aiwow/cloth-color/camera",
      element: ClothColorCamera,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_ANALYSIS: {
      path: "/aiwow/cloth-color/capture",
      element: ClothColorAnalysis,
      header: false,
      footer: false,
    },
    CLOTH_COLOR_RESULT: {
      path: "/aiwow/cloth-color/result",
      element: ClothColorResult,
      header: false,
      footer: false,
    },
    TALK_TO_KUNDLI_CHAT: {
      path: "/aiwow/talk-to-your-kundli",
      element: TalkToKundliChat,
      header: false,
      footer: false,
    },
    COSMIC_CHAT: {
      path: "/aiwow/cosmic-chat",
      element: CosmicChat,
      header: false,
      footer: false,
    },
    DAILY_COSMIC_BRIEFING: {
      path: "/aiwow/daily-cosmic-briefing",
      element: DailyCosmicBriefing,
      header: false,
      footer: false,
    },
    DREAM_INTERPRETER: {
      path: "/aiwow/dream-interpreter",
      element: DreamInterpreter,
      header: false,
      footer: false,
    },
    AGENTIC_CALENDAR: {
      path: "/aiwow/agentic-calendar",
      element: AgenticCalendar,
      header: false,
      footer: false,
    },
    SMART_MATCHMAKING: {
      path: "/aiwow/smart-matchmaking",
      element: SmartMatchmaking,
      header: false,
      footer: false,
    },
    // KARMIC_DEBT_TRACKER: {
    //   path: "/aiwow/karmic-debt-tracker",
    //   element: KarmicDebtTracker,
    //   header: false,
    //   footer: false,
    // },
    // ASTRO_VITALS: {
    //   path: "/aiwow/astro-vitals",
    //   element: AstroVitals,
    //   header: false,
    //   footer: false,
    // },
    AURA_LANDING: {
      path: "/aiwow/aura-photography",
      element: AuraLanding,
      header: false,
      footer: false,
    },
    AURA_INSTRUCTIONS: {
      path: "/aiwow/aura/instructions",
      element: AuraInstructions,
      header: false,
      footer: false,
    },
    AURA_CAMERA: {
      path: "/aiwow/aura/camera",
      element: AuraCamera,
      header: false,
      footer: false,
    },
    AURA_ANALYSIS: {
      path: "/aiwow/aura/capture",
      element: AuraAnalysis,
      header: false,
      footer: false,
    },
    AURA_RESULT: {
      path: "/aiwow/aura/result",
      element: AuraResult,
      header: false,
      footer: false,
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
    // TAROT: {
    //   path: "/tarot",
    //   element: Tarot,
    // },
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
    TAROT_CARD_V2: {
      path: "/tarot",
      element: TarotReadingPage,
    },
    TAROT_CARD_SELECTION: {
      path: "/tarot-card-selection",
      element: TarotCardSelectionPage,
    },
    LOVE_TRIANGLE_SELECTION: {
      path: "/love-triangle-selection",
      element: LoveTriangleSelectionPage,
    },
    LOVE_TRIANGLE_RESULT: {
      path: "/love-triangle-result",
      element: LoveTriangleResultPage,
    },
    TAROT_CARD_DETAIL: {
      path: "/tarot-card",
      element: TarotCardDetailPage,
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
      header: false,
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
      path: "/chat-with-astrologers/:id",
      element: ChatWindow,
      footer: false,
    },
    PROFILE_ASTROLOGER: {
      path: "/astrologer/:id",
      element: AstrologerProfile,
      header: true,
      footer: true,
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
      header: true,
      footer: true,
    },
    ABOUT: {
      path: "/aboutus",
      element: About,
      header: true,
    },
    DISCLAIMER: {
      path: "/disclaimer",
      element: Disclaimer,
      header: true,
    },
    PRICING_POLICY: {
      path: "/pricing-policy",
      element: PricingPolicy,
      header: true,
    },
    PRIVACY_POLICY: {
      path: "/privacy-policy",
      element: PrivacyPolicy,
      header: true,
    },
    REFUND_POLICY: {
      path: "/refund-and-cancellation-policy",
      element: RefundPolicy,
      header: true,
    },
    TERMSCONDITIONS: {
      path: "/terms-conditions",
      element: TermsConditions,
      header: true,
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
    OrderHistory: {
      path: "/order-history",
      element: OrderHistory,
    },
    OrderDetails: {
      path: "/profile/order-history/:astrologerId",
      element: OrderDetails,
      header: false,
      footer: false,
    },
    UserChatHistory: {
      path: "/order-history/:roomId",
      element: SingleChatHistory,
    },
    UserCallHistory: {
      path: "/order-history/call",
      element: SingleCallHistory,
    },
    EXPLORE: {
      path: "/explore",
      element: Explore,
      header: false,
    },
    ADDPROFILE: {
      path: "/profile/add",
      element: AddProfile,
    },
    EDITPROFILE: {
      path: "/profile/edit/:id",
      element: EditProfile,
    },
    FAQ: {
      path: "/faq",
      element: FAQ,
      header: false,
      footer: false,
    },
    CUSTOMER_SUPPORT: {
      path: "/customer-support",
      element: CustomerSupport,
      header: false,
      footer: false,
    },
    RECENT_TICKETS: {
      path: "/recent-tickets",
      element: RecentTickets,
      header: false,
      footer: false,
    },
    TICKET_DETAILS: {
      path: "/recent-tickets/:ticketId",
      element: TicketDetails,
      header: false,
      footer: false,
    },
    PRIVACY_SECURITY: {
      path: "/privacy",
      element: PrivacySecurity,
      header: false,
      footer: false,
    },
    TERMS_CONDITIONS_VIEW: {
      path: "/terms-conditions-view",
      element: TermsConditionsView,
      header: false,
      footer: false,
    },
    APP_LICENSE: {
      path: "/app-license",
      element: AppLicense,
      header: false,
      footer: false,
    },
  },
};
