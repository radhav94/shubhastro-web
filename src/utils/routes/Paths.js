import { lazy, Suspense, createElement } from "react";
import CircleSpinner from "../../component/UI/CircleSpinner";

/*
 * Suspense boundary for the top-level public/open routes.
 *
 * App.jsx maps openRoutes and publicRoutes as top-level router siblings: they
 * render outside HomeLayout, so they do not inherit HomeLayout's <Suspense>
 * around <Outlet />. Now that those screens are lazy() (see the notes on their
 * declarations below), a boundary is required — without one they suspend all
 * the way up to the app-level <Suspense fallback={<PrimaryLoader isLoading />}>
 * in App.jsx, which is a fullscreen blocking loader on /login, one of the
 * highest-traffic pages. That is the exact prerequisite called out in the
 * policy note further down this file.
 *
 * It lives here rather than in App.jsx so the boundary travels with the split
 * that needs it: anything added to publicRoutes/openRoutes gets it for free,
 * with no matching edit in the router.
 *
 * The fallback holds a viewport's worth of height so swapping in the real
 * screen does not shift layout and count towards CLS — same reasoning as
 * HomeLayout's `.routeFallback`. CircleSpinner is already in the entry chunk
 * (HomeLayout imports it), so this adds no bytes.
 */
const publicRouteFallback = createElement(
  "div",
  {
    style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },
  createElement(CircleSpinner)
);

const withPublicSuspense = (Component) => {
  const Wrapped = (props) =>
    createElement(
      Suspense,
      { fallback: publicRouteFallback },
      createElement(Component, props)
    );
  Wrapped.displayName = `withPublicSuspense(${Component.displayName || "Route"})`;
  return Wrapped;
};

/*
 * Route-level code splitting policy for this file.
 *
 * Every screen reached only by navigation is declared with lazy(() =>
 * import(...)) so it ships as its own chunk instead of joining the single entry
 * bundle that every first-time visitor blocks on (JS *and* the render-blocking
 * entry stylesheet, since Vite splits CSS along the same boundaries).
 *
 * Two groups deliberately stay static — do not convert them without doing the
 * matching work in App.jsx first:
 *
 * 1. publicRoutes screens (NotFound, ComingSoon, Onboarding/login, Register,
 *    ForgotPassword, OtpVerification, VerifyPassword). App.jsx maps these as
 *    top-level router siblings, outside HomeLayout, so they have no nearby
 *    Suspense boundary and would suspend all the way up to the app-level
 *    <Suspense fallback={<PrimaryLoader isLoading />}> — a fullscreen blocking
 *    loader on /login, one of the highest-traffic pages. Lazifying these needs a
 *    lightweight boundary around the public-route group first.
 *
 * 2. Home / HomeV2 (the "/" landing). Splitting the landing screen out of the
 *    entry chunk buys a smaller download but adds a second serial request
 *    (entry -> route chunk) before the homepage can paint, which works against
 *    LCP on the page most visitors land on. Note both identifiers resolve to the
 *    same module, so they must be converted together or not at all.
 *
 * Everything private renders as <child.element /> inside the "/" + HomeLayout
 * route, which has its own <Suspense fallback={<CircleSpinner />}> around
 * <Outlet /> (HomeLayout.jsx), so lazy is safe there.
 */
import NotFound from "../../screens/private/NotFound/NotFound";
// Route-split: /coming-soon is navigation-only, and it was dragging formik and
// yup into the entry chunk for every visitor. Rendered inside the openRoutes
// Suspense boundary in App.jsx, so lazy is safe here.
const ComingSoon = withPublicSuspense(lazy(() => import("../../screens/public/coming-soon/ComingSoon")));

// Route-level code splitting for the Agora call screens.
//
// VideoCallContainer already lazy-imports these same two modules. Importing
// them statically here defeated that split entirely (Vite warns: "dynamic
// import will not move module into another chunk"), pulling the Agora RTC SDK
// into the main bundle for every visitor, including those who never place a
// call. Route elements are rendered inside the app-level <Suspense> in App.jsx,
// so lazy components are safe here.
const VideoCalling = lazy(() => import("../../component/call/VideoCall"));
const AgoraVoiceCalling = lazy(() => import("../../component/call/VoiceCall"));
/*
 * The publicRoutes screens, now route-split.
 *
 * These were the last group of navigation-only screens still joining the entry
 * chunk. They were not cheap passengers: Onboarding pulls LoginScreen, OTPScreen
 * and useTruecallerLogin; OtpVerification pulls react-otp-input; and the whole
 * group carried the login/OTP surface into the bundle that every visitor blocks
 * on before the "/" landing screen can paint.
 *
 * The blocker recorded in the policy note at the top of this file — that App.jsx
 * maps these as top-level router siblings with no nearby Suspense boundary, so
 * lazifying them would suspend up to the app-level fullscreen PrimaryLoader —
 * has been addressed: App.jsx now wraps the openRoutes and publicRoutes elements
 * in its own `publicRouteFallback` boundary, which reserves viewport height
 * instead of blanking the app.
 *
 * NotFound is deliberately left static below: CmsNotFoundPage imports it
 * directly and is itself eager from App.jsx, so lazifying it here would add a
 * Suspense hop without removing a single byte from the entry chunk.
 */
const Onboarding = withPublicSuspense(lazy(() => import("../../screens/public/onboarding/Onboarding")));
const Register = withPublicSuspense(lazy(() => import("../../screens/public/Register")));
const ForgotPassword = withPublicSuspense(lazy(() => import("../../screens/public/ForgotPassword")));
const OtpVerification = withPublicSuspense(lazy(() => import("../../screens/public/OtpVerification")));
const VerifyPassword = withPublicSuspense(lazy(() => import("../../screens/public/VerifyPassword")));
const Horoscope = lazy(() => import("../../screens/private/horoscope/Horoscope"));
const Kundli = lazy(() => import("../../screens/private/kundli/Kundali"));
const Numerology = lazy(() => import("../../screens/private/numerology/Numerology"));
const FreeReadings = lazy(() => import("../../screens/private/readings/Readings"));
const AstroLive = lazy(() => import("../../screens/private/astroLive/AstroLive"));
const Video = lazy(() => import("../../screens/private/video/Video"));
// Route-level code split: /blog is only reachable by navigation, so it does not
// belong in the entry bundle every visitor blocks on. Rendered inside the
// <Suspense> boundaries in App.jsx and HomeLayout.jsx, so lazy is safe here.
const Blog = lazy(() => import("../../screens/private/blog/Blog"));
const SessionDetails = lazy(() => import("../../screens/private/sessionDetails/SessionDetails"));
const Shop = lazy(() => import("../../screens/private/shop/Shop"));
const TalkToAstrologer = lazy(() => import("../../screens/private/talkToAstrologer/TalkToAstrologer"));
const GuestChatFlow = lazy(() => import("../../screens/public/guestChat/GuestChatFlow"));
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
const SignScreen = lazy(() => import("../../screens/private/horoscope/SignScreen"));
const Monthly = lazy(() => import("../../screens/private/horoscope/monthlyHoroscope/Monthly"));
const Yesterday = lazy(() => import("../../screens/private/horoscope/yesterdayhoroscope/Yesterday"));
const MatchMaking = lazy(() => import("../../screens/private/matchmaking/MatchMakingV2"));
const MatchDetails = lazy(() => import("../../screens/private/matchmaking/details/MatchDetailsV2"));
const About = lazy(() => import("../../screens/public/static-pages/About"));
// Removed ten unused static-page imports: Disclaimer, PricingPolicy,
// PrivacyPolicy, RefundPolicy, AiUsePolicy, AstrologerOnboardingAgreement,
// LiveChatPolicy, UserAgreement, TermsConditions and OnboardingGuide.
//
// Their route entries are commented out further down this file — these pages are
// served through CmsPageWrapper now — but the imports were left behind, so all
// ten screens and their stylesheets were still being bundled into the entry
// chunk with no route able to render them. The commented route blocks are kept
// as-is; restoring one means restoring its import too (preferably as lazy()).
const Notification = lazy(() => import("../../screens/private/notification/Notification"));
const WalletTranscations = lazy(() => import("../../screens/private/wallet/WalletTranscations"));
const AstrologerProfile = lazy(() => import("../../screens/private/astrologerProfile/AstrologerProfile"));
const SingleBlogDetails = lazy(() => import("../../screens/private/blog/blogHeader/SingleBlog"));

// Route-level code splitting for the calculator suite (42 screens: 21 input
// forms and their 21 result screens).
//
// Every one of these is reachable only by navigation — none renders on the
// homepage or any landing route — yet static imports pulled all 42 modules and
// their .module.scss files into the entry bundle that every first-time visitor
// blocks on. Each identifier was verified to appear exactly twice in this file
// (this import plus one live `element:` entry) and to have no importer anywhere
// else in src, so nothing else can pull them back into the entry chunk.
//
// Rendered inside the <Suspense> boundaries in App.jsx and HomeLayout.jsx, so
// lazy is safe here.
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
const MulankCalc = lazy(() => import("../../screens/private/calculator/mulank/MulankCalc"));
const MulankReport = lazy(() => import("../../screens/private/calculator/mulank/MulankReport"));
const NameCompatibilityCalc = lazy(() => import("../../screens/private/calculator/nameCompatibility/NameCompatibilityCalc"));
const NameCompatibilityReport = lazy(() => import("../../screens/private/calculator/nameCompatibility/NameCompatibilityReport"));
const LoShuCalc = lazy(() => import("../../screens/private/calculator/loshu/LoShuCalc"));
const LoShuReport = lazy(() => import("../../screens/private/calculator/loshu/LoShuReport"));
const LuckyNameCalc = lazy(() => import("../../screens/private/calculator/luckyName/LuckyNameCalc"));
const LuckyNameReport = lazy(() => import("../../screens/private/calculator/luckyName/LuckyNameReport"));
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
// Route-level code splitting for the two live streaming screens.
//
// These are the remaining static importers of agora-rtc-react (LivePlayerPage
// renders InteractiveLiveStreaming, which builds its own AgoraRTCProvider), so
// leaving them static kept the ~1.2 MB Agora SDK in the entry bundle for every
// visitor even after the dead root-level provider import was removed from
// main.jsx. Only viewers of a live session need it.
const InteractiveLiveStreaming = lazy(() => import("../../screens/private/home/components/livestream/InteractiveLiveStreaming"));
const LivePlayerPage = lazy(() => import("../../screens/private/home/components/livestream/LivePlayerPage"));

const HoroscopeNew = lazy(() => import("../../screens/private/horoscope/Horoscope"));
const HoroscopeOld = lazy(() => import("../../screens/private/horoscope/HoroscopeOld"));

const LifePathDetails = lazy(() => import("../../screens/private/numerology/lifepath/LifePathDetails"));
const LifePathForm = lazy(() => import("../../screens/private/numerology/lifepath/LifePathForm"));

// Route-level code splitting for the AI Wow suite (36 screens, ~1.5 MB of
// source — the largest feature group in the app). None of it is needed to
// render the homepage or any other route, but static imports pulled all of it,
// JS and every .module.scss, into the single entry bundle that every first-time
// visitor blocks on. Measured on production: the entry stylesheet was 473 KB
// gzipped and render-blocking, so FCP tracked its arrival almost exactly
// (13.3 s on a 1.6 Mbps link). These render inside the <Suspense> boundaries in
// App.jsx and HomeLayout.jsx, so lazy is safe here.
const AIWow = lazy(() => import("../../screens/private/aiwow/AIWow"));
const PalmistryLanding = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryLanding"));
const PalmistryInstructions = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryInstructions"));
const PalmistryCamera = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryCamera"));
const PalmistryAnalysis = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryAnalysis"));
const PalmistryResult = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryResult"));
const PalmistryHandSelection = lazy(() => import("../../screens/private/aiwow/palmistry/PalmistryHandSelection"));
const FaceReadingLanding = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingLanding"));
const FaceReadingCamera = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingCamera"));
const FaceReadingAnalysis = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingAnalysis"));
const FaceReadingResult = lazy(() => import("../../screens/private/aiwow/facereading/FaceReadingResult"));
const SignatureLanding = lazy(() => import("../../screens/private/aiwow/signature/SignatureLanding"));
const SignatureCamera = lazy(() => import("../../screens/private/aiwow/signature/SignatureCamera"));
const SignatureAnalysis = lazy(() => import("../../screens/private/aiwow/signature/SignatureAnalysis"));
const SignatureResult = lazy(() => import("../../screens/private/aiwow/signature/SignatureResult"));
const GemstoneLanding = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneLanding"));
const GemstoneCamera = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneCamera"));
const GemstoneAnalysis = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneAnalysis"));
const GemstoneResult = lazy(() => import("../../screens/private/aiwow/gemstone/GemstoneResult"));
const ClothColorLanding = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorLanding"));
const ClothColorInstructions = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorInstructions"));
const ClothColorCamera = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorCamera"));
const ClothColorAnalysis = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorAnalysis"));
const ClothColorResult = lazy(() => import("../../screens/private/aiwow/clothcolor/ClothColorResult"));
const TalkToKundliChat = lazy(() => import("../../screens/private/aiwow/talktokundli/TalkToKundliChat"));
const CosmicChat = lazy(() => import("../../screens/private/aiwow/cosmicchat/CosmicChat"));
const DailyCosmicBriefing = lazy(() => import("../../screens/private/aiwow/dailycosmicbriefing/DailyCosmicBriefing"));
const DreamInterpreter = lazy(() => import("../../screens/private/aiwow/dreaminterpreter/DreamInterpreter"));
const AgenticCalendar = lazy(() => import("../../screens/private/aiwow/agenticcalendar/AgenticCalendar"));
const BusinessPathfinder = lazy(() => import("../../screens/private/aiwow/businesspathfinder/BusinessPathfinder"));
const BusinessPathfinderResult = lazy(() => import("../../screens/private/aiwow/businesspathfinder/BusinessPathfinderResult"));
const SmartMatchmaking = lazy(() => import("../../screens/private/aiwow/smartmatchmaking/SmartMatchmaking"));
const AuraLanding = lazy(() => import("../../screens/private/aiwow/aura/AuraLanding"));
const AuraCamera = lazy(() => import("../../screens/private/aiwow/aura/AuraCamera"));
const AuraAnalysis = lazy(() => import("../../screens/private/aiwow/aura/AuraAnalysis"));
const AuraResult = lazy(() => import("../../screens/private/aiwow/aura/AuraResult"));

const SingleCallHistory = lazy(() => import("../../screens/private/orderHistory/components/Call/SingleCallHistory"));
const SingleChatHistory = lazy(() => import("../../screens/private/orderHistory/components/Chat/SingleChatHistory"));
const OrderHistory = lazy(() => import("../../screens/private/orderHistory/OrderHistory"));
// Route-level code split: OrderDetails renders OrderInfoCard, the only module in
// the app that imports hls.js. Attribution put hls.js at 514 KB — 11% of the
// entry chunk — shipped to every visitor so that one order-history screen can
// play a call recording. Now it loads with the screen that needs it.
const OrderDetails = lazy(() => import("../../screens/private/orderHistory/OrderDetails"));

const MallOrderDetail = lazy(() => import("../../screens/private/shubhAstroMallHistory/MallOrderDetail"));

const FinalPay = lazy(() => import("../../screens/private/payment/FinalPay"));
const PaymentWebhook = lazy(() => import("../../screens/private/payment/PaymentWebhook"));

const ConsultantList = lazy(() => import("../../screens/private/shop/consultant/ConsultantList"));
const PaymentScreen = lazy(() => import("../../screens/private/shop/consultant/PaymentScreen"));
const PlayScreen = lazy(() => import("../../screens/private/shop/detail/playscreen/PlayScreen"));
const ProductDetail = lazy(() => import("../../screens/private/shop/detail/ProductDetail"));
// Lazy: ProductList is the only importer of shop/data/productData.js, a ~305 KB
// hardcoded catalogue (~186 KB in-bundle). Imported statically it sat in the
// entry chunk, so every visitor downloaded the shop catalogue to see the
// homepage. Route elements render inside HomeLayout's Suspense boundary.
const ProductList = lazy(() => import("../../screens/private/shop/product/ProductList"));

/*
 * ShubhMall / E-Pooja screens — commented out while the feature is off.
 *
 * VITE_SHUBH_MALL_ENABLED is "false" in all three environments in .env-cmdrc
 * (dev, stage and prod), and App.jsx already drops every route whose path
 * matches isShubhMallRoute() before registering it. All eleven route entries
 * below were covered by SHUBH_MALL_PATHS, so none of these screens has been
 * reachable — yet the static imports still bundled all ten of them, plus their
 * stylesheets, into the entry chunk that every visitor blocks on.
 *
 * Paths.js was the only importer of any of them, and no code outside this file
 * references the route keys (E_POOJA, ASTROMALL_CART, ASTROMALL_CATEGORY,
 * ASTROMALL_ALL_CATEGORIES, ASTROMALL_PURPOSE and friends), so removing them
 * from the build changes no behaviour at the current flag value.
 *
 * TO RE-ENABLE: uncomment these ten imports and the matching route block
 * further down (search "ShubhMall / E-Pooja routes"), then set
 * VITE_SHUBH_MALL_ENABLED to "true" for the target environment. Prefer
 * restoring them as lazy(() => import(...)) rather than static imports so the
 * feature ships as its own chunk instead of re-entering the entry bundle.
 */
// import EPooja from "../../screens/private/epooja/EPooja";
// import EPoojaDetail from "../../screens/private/epooja/detail/EPoojaDetail";
// import EPoojaBooking from "../../screens/private/epooja/booking/EPoojaBooking";
// import BookingSuccess from "../../screens/private/epooja/booking/BookingSuccess";
// import EPoojaPayment from "../../screens/private/epooja/payment/EPoojaPayment";
// import EPoojaCheckout from "../../screens/private/epooja/checkout/EPoojaCheckout";
// import AstromallCart from "../../screens/private/epooja/cart/AstromallCart";
// import CategoryProducts from "../../screens/private/epooja/category/CategoryProducts";
// import AllCategories from "../../screens/private/epooja/category/AllCategories";
// import PurposeProducts from "../../screens/private/epooja/purpose/PurposeProducts";

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

// import Home from "../../screens/v2/home/Home";
// The "/" landing screen. Named `Home` here because that is the role it plays;
// the file is still called HomeV2 from when it superseded screens/v2/home/Home.
import Home from "../../screens/v2/home-v2/HomeV2";
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
const ManageDevices = lazy(() => import("../../screens/private/manageDevices/ManageDevices"));
const TermsConditionsView = lazy(() => import("../../screens/v2/user/TermsConditionsView"));
const AppLicense = lazy(() => import("../../screens/v2/user/AppLicense"));
const FollowedAstrologers = lazy(() => import("../../screens/v2/user/FollowedAstrologers"));

const LalKitab = lazy(() => import("../../screens/private/lalKitab/LalKitab"));
const LalKitabDetail = lazy(() => import("../../screens/private/lalKitab/detail/LalKitabDetail"));
const LalKitabZodiac = lazy(() => import("../../screens/private/lalKitab/zodiac/LalKitabZodiac"));
const LalKitabProblems = lazy(() => import("../../screens/private/lalKitab/problems/LalKitabProblems"));
const OccultChat = lazy(() => import("../../screens/private/occult/OccultChat"));
const OccultResult = lazy(() => import("../../screens/private/occult/OccultResult"));
const PanditAIVoice = lazy(() => import("../../screens/private/panditAIVoice/PanditAIVoice"));
const Community = lazy(() => import("../../screens/private/community/Community"));

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

  // Routes accessible to everyone (no auth redirect)
  openRoutes: {
    COMING_SOON: {
      path: "/coming-soon",
      element: ComingSoon,
    },
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
      path: ["/live", "/live/:channelId"],
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
      path: "/talk-to-astrologer",
      element: TalkToAstrologer,
    },
    TALK_TO_ASTROLOGER_ONLINE: {
      path: "/talk-to-astrologer/online",
      element: TalkToAstrologer,
    },
    Chat_With_ASTROLOGER: {
      path: "/chat-to-astrologer",
      element: TalkToAstrologer,
    },
    GUEST_CHAT: {
      path: "/guest-chat/:astrologerId",
      element: GuestChatFlow,
      footer: false,
    },
    ASTROLOGERS_LIST: {
      path: "/astrologers",
      element: TalkToAstrologer,
    },
    ASTROLOGERS_CATEGORY: {
      path: "/astrologers/:category",
      element: TalkToAstrologer,
    },
    HOROSCOPE: {
      path: "/horoscope",
      element: Horoscope,
      DAILY: {
        path: "/horoscope/:slug",
        element: SignScreen,
      },
      DAILY_NEW: {
        path: ["/daily-horoscope-indian/:sign", "/daily-horoscope-indian"],
        element: HoroscopeNew,
      },
      WEEKLY_NEW: {
        path: ["/weekly-horoscope-indian/:sign", "/weekly-horoscope-indian"],
        element: HoroscopeNew,
      },
      YEARLY_NEW: {
        path: ["/yearly-horoscope-indian/:sign", "/yearly-horoscope-indian"],
        element: HoroscopeNew,
      },
      TOMORROW_NEW: {
        path: ["/tomorrow-horoscope-indian/:sign", "/tomorrow-horoscope-indian"],
        element: HoroscopeNew,
      },
      TODAY_NEW: {
        path: ["/horoscope/todays-horoscope-indian/:sign", "/horoscope/todays-horoscope-indian"],
        element: HoroscopeNew,
      },
      DAILY_OLD: {
        path: ["/daily-horoscope/:sign", "/daily-horoscope"],
        element: HoroscopeOld,
      },
      WEEKLY_OLD: {
        path: ["/weekly-horoscope/:sign", "/weekly-horoscope"],
        element: HoroscopeOld,
      },
      YEARLY_OLD: {
        path: ["/yearly-horoscope/:sign", "/yearly-horoscope"],
        element: HoroscopeOld,
      },
      TOMORROW_OLD: {
        path: ["/tomorrow-horoscope/:sign", "/tomorrow-horoscope"],
        element: HoroscopeOld,
      },
      MONTHLY: {
        path: "/monthly-horoscope",
        element: SignScreen,
      },
      MONTHLY_DETAIL: {
        path: "/monthly-horoscope/:sign",
        element: Monthly,
      },
      YESTERDAY: {
        path: "/horoscope/yesterday-horoscope/:sign",
        element: Yesterday,
      },
    },
    HOROSCOPEDETAILS: {
      path: "/horoscope/daily/:name-free-horoscope",
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

    // Laal Kitab
    LAL_KITAB: {
      path: "/laal-kitab",
      element: LalKitab,
    },
    LAL_KITAB_DETAIL: {
      path: "/laal-kitab/:lalKitabId",
      element: LalKitabDetail,
    },
    LAL_KITAB_ZODIAC: {
      path: "/laal-kitab/zodiac",
      element: LalKitabZodiac,
    },
    LAL_KITAB_PROBLEMS: {
      path: "/laal-kitab/problems",
      element: LalKitabProblems,
    },

    // AI Pandit Voice
    PANDIT_AI_VOICE: {
      path: "/pandit-ai-voice",
      element: PanditAIVoice,
      header: false,
      footer: false,
    },

    // Occult
    OCCULT: {
      path: "/occult",
      element: OccultChat,
    },
    OCCULT_RESULT: {
      path: "/occult/result",
      element: OccultResult,
    },

    MATCHMAKING: {
      path: "/match-making",
      element: MatchMaking,
    },
    MATCHMAKING_DETAILS: {
      path: "/match-making/match-making-details",
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
      path: "/rashi-calculator",
      element: RashiCalc,
    },
    RASHI_REPORT: {
      path: "/rashi-calculator/report",
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
      path: "/mangal-dasha-calculator",
      element: MangalDosha,
    },
    MANGAL_DOSHA_REPORT: {
      path: "/mangal-dasha-calculator/report",
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
      path: "/kaal-sarpa-dosh-calculator",
      element: KaalSarpCalc,
    },
    KaalSarp_REPORT: {
      path: "/kaal-sarpa-dosh-calculator/report",
      element: KaalSarpReport,
    },
    NUMEROLOGY_CALC: {
      path: "/numerology-calculator",
      element: NumerologyCalc,
    },
    NUMEROLOGY_REPORT: {
      path: "/numerology-calculator/report",
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
    MULANK_CALC: {
      path: "/mulank-calculator",
      element: MulankCalc,
    },
    MULANK_REPORT: {
      path: "/mulank-calculator/report",
      element: MulankReport,
    },
    NAME_COMPATIBILITY_CALC: {
      path: "/name-compatibility-calculator",
      element: NameCompatibilityCalc,
    },
    NAME_COMPATIBILITY_REPORT: {
      path: "/name-compatibility-calculator/report",
      element: NameCompatibilityReport,
    },
    LOSHU_GRID_CALC: {
      path: "/lo-shu-grid-calculator",
      element: LoShuCalc,
    },
    LOSHU_GRID_REPORT: {
      path: "/lo-shu-grid-calculator/report",
      element: LoShuReport,
    },
    LUCKY_NAME_CALC: {
      path: "/lucky-name-numerology-calculator",
      element: LuckyNameCalc,
    },
    LUCKY_NAME_REPORT: {
      path: "/lucky-name-numerology-calculator/report",
      element: LuckyNameReport,
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
      path: "/ai-wow",
      element: AIWow,
      header: false,
    },
    // Entry screen: "Before you start" instructions, the left/right hand choice
    // and the Upload / Use Camera actions are all on this one screen.
    PALMISTRY_LANDING: {
      path: ["/ai-wow/ai-palmistry-scanner", "/ai-palmistry-scanner"],
      element: PalmistryLanding,
      header: false,
    },
    // Merged into PALMISTRY_LANDING; this element is now just a redirect there,
    // kept so already-shared links and Back-stack entries still resolve.
    PALMISTRY_INSTRUCTIONS: {
      path: ["/ai-wow/ai-palmistry-scanner/instructions", "/ai-palmistry-scanner/instructions"],
      element: PalmistryInstructions,
      header: false,
    },
    PALMISTRY_CAMERA: {
      path: ["/ai-wow/ai-palmistry-scanner/camera", "/ai-palmistry-scanner/camera"],
      element: PalmistryCamera,
      header: false,
    },
    PALMISTRY_HAND_SELECTION: {
      path: ["/ai-wow/ai-palmistry-scanner/hand-selection", "/ai-palmistry-scanner/hand-selection"],
      element: PalmistryHandSelection,
      header: false,
    },
    PALMISTRY_ANALYSIS: {
      path: ["/ai-wow/ai-palmistry-scanner/capture", "/ai-palmistry-scanner/capture"],
      element: PalmistryAnalysis,
      header: false,
    },
    PALMISTRY_RESULT: {
      path: ["/ai-wow/ai-palmistry-scanner/result", "/ai-palmistry-scanner/result"],
      element: PalmistryResult,
      header: false,
    },
    FACE_READING_LANDING: {
      path: ["/ai-wow/astro-face-reading", "/astro-face-reading"],
      element: FaceReadingLanding,
      header: false,
    },
    FACE_READING_CAMERA: {
      path: ["/ai-wow/astro-face-reading/camera", "/astro-face-reading/camera"],
      element: FaceReadingCamera,
      header: false,
    },
    FACE_READING_ANALYSIS: {
      path: ["/ai-wow/astro-face-reading/capture", "/astro-face-reading/capture"],
      element: FaceReadingAnalysis,
      header: false,
    },
    FACE_READING_RESULT: {
      path: ["/ai-wow/astro-face-reading/result", "/astro-face-reading/result"],
      element: FaceReadingResult,
      header: false,
    },
    SIGNATURE_LANDING: {
      path: ["/ai-wow/signature-analysis", "/signature-analysis"],
      element: SignatureLanding,
      header: false,
    },
    SIGNATURE_CAMERA: {
      path: ["/ai-wow/signature-analysis/camera", "/signature-analysis/camera"],
      element: SignatureCamera,
      header: false,
    },
    SIGNATURE_ANALYSIS: {
      path: ["/ai-wow/signature-analysis/capture", "/signature-analysis/capture"],
      element: SignatureAnalysis,
      header: false,
    },
    SIGNATURE_RESULT: {
      path: ["/ai-wow/signature-analysis/result", "/signature-analysis/result"],
      element: SignatureResult,
      header: false,
    },
    GEMSTONE_LANDING: {
      path: ["/ai-wow/gemstone-authenticity", "/gemstone-authenticity"],
      element: GemstoneLanding,
      header: false,
    },
    GEMSTONE_CAMERA: {
      path: ["/ai-wow/gemstone-authenticity/camera", "/gemstone-authenticity/camera"],
      element: GemstoneCamera,
      header: false,
    },
    GEMSTONE_ANALYSIS: {
      path: ["/ai-wow/gemstone-authenticity/capture", "/gemstone-authenticity/capture"],
      element: GemstoneAnalysis,
      header: false,
    },
    GEMSTONE_RESULT: {
      path: ["/ai-wow/gemstone-authenticity/result", "/gemstone-authenticity/result"],
      element: GemstoneResult,
      header: false,
    },
    CLOTH_COLOR_LANDING: {
      path: ["/ai-wow/clothes-colour-analysis", "/clothes-colour-analysis"],
      element: ClothColorLanding,
      header: false,
    },
    CLOTH_COLOR_INSTRUCTIONS: {
      path: ["/ai-wow/clothes-colour-analysis/instructions", "/clothes-colour-analysis/instructions"],
      element: ClothColorInstructions,
      header: false,
    },
    CLOTH_COLOR_CAMERA: {
      path: ["/ai-wow/clothes-colour-analysis/camera", "/clothes-colour-analysis/camera"],
      element: ClothColorCamera,
      header: false,
    },
    CLOTH_COLOR_ANALYSIS: {
      path: ["/ai-wow/clothes-colour-analysis/capture", "/clothes-colour-analysis/capture"],
      element: ClothColorAnalysis,
      header: false,
    },
    CLOTH_COLOR_RESULT: {
      path: ["/ai-wow/clothes-colour-analysis/result", "/clothes-colour-analysis/result"],
      element: ClothColorResult,
      header: false,
    },
    /*
     * The bare paths below (third entry in each array) are the ones the footer
     * links to — see `footerLinkSections` in layouts/HomeLayout.jsx.
     *
     * They were missing on these five, while the six sibling AI-Wow features
     * registered them from the start (`["/ai-wow/ai-palmistry-scanner",
     * "/ai-palmistry-scanner"]` and the same for astro-face-reading,
     * signature-analysis, gemstone-authenticity, clothes-colour-analysis and
     * aura-photography). So half the AI-Wow footer links opened the feature and
     * half fell through to `path: "*"` -> NotFound, which is indistinguishable
     * from a broken button: the visitor taps, gets a not-found page, comes back
     * and taps again. "Smart MatchMaking" is the one that shows up in session
     * recordings as repeat clicks on a relationship feature.
     *
     * Adding an alias cannot break an existing URL, so the prefixed forms keep
     * working for anything already linking to them.
     */
    TALK_TO_KUNDLI_CHAT: {
      path: ["/ai-wow/talk-to-your-kundli", "/aiwow/talk-to-your-kundli", "/talk-to-your-kundli"],
      element: TalkToKundliChat,
      header: false,
    },
    COSMIC_CHAT: {
      path: ["/ai-wow/cosmic-chat", "/aiwow/cosmic-chat", "/cosmic-chat"],
      element: CosmicChat,
      header: false,
    },
    DAILY_COSMIC_BRIEFING: {
      path: ["/ai-wow/daily-cosmic-briefing", "/aiwow/daily-cosmic-briefing", "/daily-cosmic-briefing"],
      element: DailyCosmicBriefing,
      header: false,
    },
    DREAM_INTERPRETER: {
      path: ["/ai-wow/dream-interpreter", "/aiwow/dream-interpreter", "/dream-interpreter"],
      element: DreamInterpreter,
      header: false,
    },
    AGENTIC_CALENDAR: {
      path: ["/ai-wow/muhurat-calendar", "/aiwow/muhurat-calendar"],
      element: AgenticCalendar,
      header: false,
    },
    SMART_MATCHMAKING: {
      path: ["/ai-wow/smart-matchmaking", "/aiwow/smart-matchmaking", "/smart-matchmaking"],
      element: SmartMatchmaking,
      header: false,
    },
    BUSINESS_PATHFINDER: {
      path: ["/ai-wow/business-pathfinder", "/business-pathfinder"],
      element: BusinessPathfinder,
      header: true,
      footer: true,
    },
    BUSINESS_PATHFINDER_RESULT: {
      path: ["/ai-wow/business-pathfinder/report", "/business-pathfinder/report"],
      element: BusinessPathfinderResult,
      header: true,
      footer: true,
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
      path: ["/ai-wow/aura-photography", "/aura-photography"],
      element: AuraLanding,
      header: false,
    },
    AURA_CAMERA: {
      path: ["/ai-wow/aura-photography/camera", "/aura-photography/camera"],
      element: AuraCamera,
      header: false,
    },
    AURA_ANALYSIS: {
      path: ["/ai-wow/aura-photography/capture", "/aura-photography/capture"],
      element: AuraAnalysis,
      header: false,
    },
    AURA_RESULT: {
      path: ["/ai-wow/aura-photography/result", "/aura-photography/result"],
      element: AuraResult,
      header: false,
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

    // ShubhMall / E-Pooja routes — commented out with their imports at the top
    // of this file while VITE_SHUBH_MALL_ENABLED is "false". App.jsx filtered
    // every one of these out at runtime anyway (all eleven paths match
    // SHUBH_MALL_PATHS in src/utils/featureConfig.js), so they were unreachable
    // while still costing every visitor their code and CSS in the entry bundle.
    //
    // Uncomment this block together with the imports to restore the feature.
    // E_POOJA: {
    //   path: "/shubh-mall",
    //   element: EPooja,
    // },
    // ASTROMALL_CART: {
    //   path: "/viewcart",
    //   element: AstromallCart,
    // },
    // ASTROMALL_CART_PAYMENT: {
    //   path: "/shubh-mall/cart/payment",
    //   element: EPoojaPayment,
    // },
    // ASTROMALL_CART_CHECKOUT: {
    //   path: "/checkout",
    //   element: EPoojaCheckout,
    // },
    // E_POOJA_DETAIL: {
    //   path: "/product-details/:slug",
    //   element: EPoojaDetail,
    // },
    // E_POOJA_BOOKING: {
    //   path: "/shubh-mall/:slug/book",
    //   element: EPoojaBooking,
    // },
    // E_POOJA_PAYMENT: {
    //   path: "/shubh-mall/:slug/payment",
    //   element: EPoojaPayment,
    // },
    // E_POOJA_BOOKING_SUCCESS: {
    //   path: "/booking-success",
    //   element: BookingSuccess,
    // },
    // ASTROMALL_CATEGORY: {
    //   path: "/category/:slug",
    //   element: CategoryProducts,
    // },
    // ASTROMALL_ALL_CATEGORIES: {
    //   path: "/categories",
    //   element: AllCategories,
    // },
    // ASTROMALL_PURPOSE: {
    //   path: "/purpose/:slug",
    //   element: PurposeProducts,
    // },

    RECHARGE: {
      path: "/recharge",
      element: Payment,
    },
    FinalPay: {
      path: "/recharge/payment",
      element: FinalPay,
    },
    PAYMENT_WEBHOOK: {
      path: "/payment/webhook",
      element: PaymentWebhook,
      header: false,
      footer: false,
    },
    ASTROLOGERS: {
      path: "/talk-to-astrologer/expert/:name",
      element: Astrologers,
    },
    CHAT_WITH_ASTROLOGER: {
      path: "/chat-to-astrologer/:id",
      element: ChatWindow,
      footer: false,
    },
    // Fallback astrologer profile URL: /astrologer/<display-name-slug>/<id>.
    // Only used for astrologers with no usable `userName` — the slug is built
    // from firstName+lastName and is decorative; the id does the fetching.
    // Kept routed so previously shared links stay valid.
    PROFILE_ASTROLOGER_WITH_NAME: {
      path: "/astrologer/:username/:id",
      element: AstrologerProfile,
      header: true,
      footer: true,
    },
    // Canonical astrologer profile URL: /astrologer/<userName>.
    // The `:id` param holds EITHER the astrologer's userName handle OR a raw
    // ObjectId (older links) — `astrologers/astrologer?astrologerId=` accepts
    // both, so the screen passes the segment through unchanged.
    PROFILE_ASTROLOGER: {
      path: "/astrologer/:id",
      element: AstrologerProfile,
      header: true,
      footer: true,
    },

    VIDEO_CALL: {
      path: "/talk-to-astrologer/video-call/:channelName",
      element: VideoCalling,
    },

    ASTRO_VIDEO_CALL: {
      path: "/astrologer-dashboard/video-call/:channelName",
      element: VideoCalling,
    },

    VOICE_CALL: {
      path: "/talk-to-astrologer/voice-call/:roomId",
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
      // path: "/about-us",
      element: About,
      header: true,
    },
    // DISCLAIMER: {
    //   path: "/disclaimer",
    //   element: Disclaimer,
    //   header: true,
    // },
    // PRICING_POLICY: {
    //   path: "/pricing-policy",
    //   element: PricingPolicy,
    //   header: true,
    // },
    // PRIVACY_POLICY: {
    //   path: "/privacy-policy",
    //   element: PrivacyPolicy,
    //   header: true,
    // },
    // REFUND_POLICY: {
    //   path: "/refund-cancellation-policy",
    //   element: RefundPolicy,
    //   header: true,
    // },
    // AI_USE_POLICY: {
    //   path: "/ai-use-policy",
    //   element: AiUsePolicy,
    //   header: true,
    // },
      // ASTROLOGER_ONBOARDING_AGREEMENT: {
      //   path: "/astrologer-onboarding-agreement",
      //   element: AstrologerOnboardingAgreement,
      //   header: true,
      // },
    // LIVE_CHAT_POLICY: {
    //   path: "/live-chat-policy",
    //   element: LiveChatPolicy,
    //   header: true,
    // },
    // USER_AGREEMENT: {
    //   path: "/user-agreement",
    //   element: UserAgreement,
    //   header: true,
    // },
    // TERMSCONDITIONS: {
    //   path: "/terms-and-conditions",
    //   element: TermsConditions,
    //   header: true,
    // },
    // ONBOARDING_GUIDE: {
    //   path: "/onboarding-guide",
    //   element: OnboardingGuide,
    //   header: true,
    // },

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
    MallOrderDetail: {
      path: "/mall-order/:orderId",
      element: MallOrderDetail,
      header: false,
      footer: false,
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
      footer: true,
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
    MANAGE_DEVICES: {
      path: "/manage-devices",
      element: ManageDevices,
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
    COMMUNITY: {
      path: "/community",
      element: Community,
      header: true,
      footer: true,
    },
    FOLLOWED_ASTROLOGERS: {
      path: "/followed-astrologers",
      element: FollowedAstrologers,
      header: true,
      footer: false,
    },
  },
};
