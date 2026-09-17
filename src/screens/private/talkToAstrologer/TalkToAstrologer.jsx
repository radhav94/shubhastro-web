import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PrimaryText, Title, Toast } from "../../../component";
import AstrologerCard from "../../../component/UI/cards/AstrologersCard";
import DetailsModal from "../../../component/UI/modal/detailsModal/DetailsModal";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";
import styles from "./TalkToAstrologer.module.scss";
import { useNavigate, useLocation, useParams, useNavigationType } from "react-router-dom";
import { useTalkToAstrologer } from "./useTalkToAstrologer";
import {
  useGetAstrologersQuery,
  useGetAstrologerFilterCategoryTabQuery,
  useGetRecommendedAstrologersQuery,
} from "../../../redux/api/astrologer/astrologerApi";
import FilterChips from "../../../component/UI/chips/astrologer/FilterChips";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import { trackEvent } from "../../../utils/analytics";
import { BranchEvents } from "../../../utils/branchEvents";
import ProfileModals from "../kundli/components/ProfileModals";
import { useProfileManager } from "../kundli/hooks/useProfileManager";
import { ProfileManager } from "../../../component/UI/Profile";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { PATH } from "../../../utils/routes/Paths";
import { getToken } from "../../../utils/token";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { claimRoom } from "../../../utils/tabSession";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useCall } from "../../../context/CallContext";
import useRecommendTrigger from "../../../utils/hooks/useRecommendTrigger";
import BackButton from "../../../component/UI/BackButton/BackButton";
import RecommendCTA from "../../../layouts/recommend/RecommendCTA";
import RecommendModal from "../../../component/UI/modal/RecommendModal/RecommendModal";
import { useChat } from "../../../context/ChatContext";
import { useGetBalanceMutation } from "../../../redux/api/wallet/walletApi";
import ChatAstrologerCard from "../../../component/UI/cards/ChatAstrologerCard";
import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
// COMMENTED OUT: Replaced with NewAstrologerCard
// import RecommendedAstrologerCard from "../../../component/UI/cards/RecommendedAstrologerCard";
// import TopAstrologerCard from "../../../component/UI/cards/TopAstrologerCard";
import NewAstrologerCard from "../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import NewAstrologerDetailsCard from "../../../component/UI/cards/newAstrologerCard/NewAstrologerDetailsCard";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import AstrologerRingModal from "../../../component/UI/modal/AstrologerRingModal/AstrologerRingModal";
import { useGuestConnectFlow } from "../../public/guestChat/useGuestConnectFlow";
import { getAstrologerDisplayName } from "../../../utils/helper/string.utils";

const astroImages = [
  "https://images.astroyogi.com/english/astrologer/profileimage/astro-manpreet-7707605892123109.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-dharra-7690941669104289.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-satvika-7405159392822997.jpg",
  "https://images.astroyogi.com/english/astrologer/profileimage/tarot-shubh-16511220682.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg",
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg",
];

/*
  What the visitor had loaded, kept across an unmount of this screen.

  The list is infinite-scrolled nine at a time and accumulated in component
  state, so leaving for a profile and coming back rebuilt it from page 1. Two
  things follow: everything past the first nine is gone, and the document is now
  too short for ScrollToTop to honour the offset it saved for that history entry
  — so a visitor three pages down returns to the top with no way back to where
  they were except scrolling it all again. Session recordings show that as rapid
  listing -> profile -> listing bouncing.

  Module scope rather than sessionStorage on purpose: this is a cache of server
  data with prices and availability in it, and it should not outlive the document.
  A reload starts clean. Restored only for POP (back/forward) and only when the
  view is the same one — a different category, or the online-only view, is a
  different list and starts fresh.
*/
const listingCache = {
  viewKey: null,
  page: 1,
  items: [],
  hasMore: true,
};

const TalkToAstrologer = () => {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const dispatch = useDispatch();
  const { category: categoryFromParams } = useParams();
  const requireAuth = useRequireAuth();
  const { openGuestConnect, guestConnectModal } = useGuestConnectFlow();
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showRecommend, setShowRecommend] = useState(true);
  const [recommendDismissed, setRecommendDismissed] = useState(() => {
    return localStorage.getItem("recommend_cta_dismissed") === "true";
  });
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showFilterAstrologer, setShowFilterAstrologer] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  // True while this is a /astrologers/:category URL whose filter has not settled
  // yet. Consumed by the TOP ASTROLOGERS section far below — see the long note
  // there for the shift it prevents. Declared here to sit with the other filter
  // state; categoryFromParams and filterError are assigned further down, so the
  // actual expression lives at the bottom of the hook body.

  const { data: astroFilterTab, isFetchingFilterTab } = useGetAstrologerFilterCategoryTabQuery();

  

  // NEW: Store the connection type when opening ProfileManager
  const [pendingConnectionType, setPendingConnectionType] = useState(null);

  const location = useLocation(); //  get current URL
  // const isChatMode = location.pathname === "/astrologers";
  const currentPath = location.pathname.split("/").pop();

  const showCTA = useRecommendTrigger(120, resetTrigger);
  /* ---------------------- URL BASED LOGIC ---------------------- */

  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleName = pathParts[0]; // astrologers
  const secondParam = pathParts[1]; // online | category slug | undefined
  const isOnlineFromURL = secondParam === "online";
  const getActiveConfigFromURL = () => {
    let isActiveOnline = false;
    let isActiveType = null;

    if (secondParam === "online") {
      isActiveOnline = true;
    }

    return { isActiveOnline, isActiveType };
  };

  const [{ isActiveOnline, isActiveType }, setActiveConfig] = useState(
    getActiveConfigFromURL(),
  );

  // Track Astrologer Listing Viewed on component mount
  useEffect(() => {
    const userId = localStorage.getItem("shubhtalk_customer_id");
    BranchEvents.trackAstrologerListingViewed({
      page_name: "Astrologer Listing",
      route_name: "astrologers",
      route_path: window.location.pathname,
      user_type: userId ? "logged_in" : "guest",
      user_id: userId,
      listing_type: isActiveOnline ? "online" : "all",
      category: categoryFromParams || null,
      filter: null,
      sort_by: "rating",
    });
  }, [categoryFromParams, isActiveOnline]);

  // Identity of the list being shown, so listingCache is only ever restored onto
  // the same view it was captured from.
  const viewKey = location.pathname;

  useEffect(() => {
    setActiveConfig(getActiveConfigFromURL());
  }, [location.pathname]);

  const isChatMode = false;
  useEffect(() => {
    if (showCTA) {
      setShowRecommend(true);
    }
  }, [showCTA, isChatMode]);

  const [open, setOpen] = useState(false);

  const [
    onFollow,
    openModal,
    setOpenModal,
    onChat,
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  // Use the astrologer connect hook
  const {
    handleChatStart: hookHandleChatStart,
    handleCallStart: hookHandleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
    // The connection the user tapped, set by the hook's connect handlers, so the
    // recharge popup shows the right rate/wording instead of always "chat".
    rechargeType: hookRechargeType,
    rechargeRequiredAmount: hookRechargeRequiredAmount,
    rechargePricePerMinute: hookRechargePricePerMinute,
    kundliRef,
    hasKundli,
    // Lets the Chat/Call button that was tapped show that the request is in
    // flight. Without it the balance round trip happens behind an unchanged
    // button, which reads as a dead tap and invites a second one.
    isConnecting,
  } = useAstrologerConnect();

  // Use profile manager hook (same as Home page)
  const {
    selectedProfile: profileManagerSelectedProfile,
    profiles,
    profilesLoading,
    isCreating,
    showSelectProfile,
    showAddProfile,
    showEditProfile,
    formData,
    editFormData,
    setShowSelectProfile,
    setShowAddProfile,
    setShowEditProfile,
    setFormData,
    setEditFormData,
    handleAddProfile,
    handleEditProfile,
    handleSubmitProfile,
    handleSubmitEditProfile,
    formatProfileDisplay,
  } = useProfileManager(dispatch);

  // Local state for selected profile (to avoid closing modal)
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [activeCallAstro, setActiveCallAstro] = useState(null);

  const {
    activeCall,
    setActiveCall,
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setLastCallType,
    setLastSelectedKundli,
    setLastRequestedAstro: setLastRequestedCallAstro,
    callApprovalData,
    setCallApprovalData,
  } = useCall();
  const {
    setActiveChat,
    setWaitingList,
    WaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
    setChatSeconds,
    chatApprovalData,
    setChatApprovalData,
  } = useChat();

  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, cancelAll, assignRoomId, updateStatusByRoomId, getConnectionByRoomId, pendingConnections } = useWaitingQueue();

  /*
    Live mirrors of the approval state for the socket handlers further down.

    Those listeners are registered in an effect keyed on
    [userIdLocal, isRecommendModalOpen], so their closures hold a stale
    `callApprovalData` / `chatApprovalData` — `null` on first render. Guards
    written as `if (callApprovalData?.roomId === roomId)` never matched, so
    on_hold / unavailable / canceled / rejected / error left the approval state
    set. That state is what drives the looping ring sound in
    WaitingQueueContext, so it could keep ringing with no call on screen.
    Same fix as the one applied there.
  */
  const callApprovalRef = useRef(null);
  const chatApprovalRef = useRef(null);
  useEffect(() => { callApprovalRef.current = callApprovalData; }, [callApprovalData]);
  useEffect(() => { chatApprovalRef.current = chatApprovalData; }, [chatApprovalData]);

  // Permanently dismiss recommendation popup once any connection is initiated
  useEffect(() => {
    if (pendingConnections?.length && !recommendDismissed) {
      setRecommendDismissed(true);
      localStorage.setItem("recommend_cta_dismissed", "true");
    }
  }, [pendingConnections?.length]);

  // Two-way accept: ring data queue for stacked notifications
  const [ringQueue, setRingQueue] = useState([]);
  // On-hold sessions: persistent banners for missed rings
  const [onHoldSessions, setOnHoldSessions] = useState([]);

  // ✅ Ref for current calling astrologer (no re-render)
  const activeCallAstroRef = useRef(null);

  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [topTenAstrologers, setTopTenAstrologers] = useState([]);
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  /*
    Manual re-check state for the two list-state cards at the bottom of this file
    ("No astrologers available right now" / "Couldn't load astrologers").

    Both buttons were a bare `onClick={() => refetchAstrologers()}`. That is a
    non-silent refetch, so it flips `isFetching`, and every one of those cards is
    gated on `!isFetching` — so the tap unmounted the card the visitor had just
    pressed, showed the list spinner, and then, when the list came back empty
    again (the overwhelmingly common case, since an empty list is why the card is
    on screen at all), re-mounted the identical card. The entire visible effect
    of the press was a spinner flash resolving to the exact screen they started
    on, with nothing saying a check had run or what it found.

    That is the same defect, and the same cause, as the "Check again" button on
    the live player's empty state — see the long note above `handleCheckAgain` in
    LivePlayerPage.jsx, where it was diagnosed from a Clarity session and fixed.
    This screen was missed at the time. Session q4kzpk (Sep 3, desktop, 31 min,
    151 clicks) crossed both surfaces.

    Same remedy, so the two behave alike:
      - `checking` keeps the card mounted through the refetch instead of letting
        `isFetching` tear it down, and suppresses the list spinner, so the card
        stays still and the button itself reports progress.
      - `checkResult` states the outcome next to the button that caused it,
        keyed on an incrementing `seq` so a repeat press that finds nothing new
        still remounts the line and replays its animation rather than rendering
        a byte-identical string that looks like nothing happened.
  */
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const checkSeqRef = useRef(0);

  /*
    Error state for the FILTERED / category list (/astrologers/:category and any
    applied filter). The base list already surfaces `isListError` in a "Couldn't
    load astrologers / Try again" card, but the filtered path fetches through
    FilterChips' own lazy query, whose failure was only a toast — so a failed
    category request dropped the visitor on a blank list with no retry. FilterChips
    now hands us an error object with a `retry()` that replays the same filter.
  */
  const [filterError, setFilterError] = useState(null);

  // See the TOP ASTROLOGERS block in the JSX for the reasoning. categoryFromParams
  // comes from useParams so it is known on the very first render, which is what
  // makes this able to suppress the mount rather than react to it.
  const urlCategoryPending =
    Boolean(categoryFromParams) && !showFilterAstrologer && !filterError;
  const [filterRetrying, setFilterRetrying] = useState(false);

  const limit = 9;

  // const [createChatRoom] = useCreateChatRoomMutation();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  // last part of URL

  // Detect type based on URL
  const getTypeFromURL = () => {
    return undefined;
  };

  // 🔥 Set initial activeType from URL
  const [activeType, setActiveType] = useState(getTypeFromURL());

  // 🔄 Update activeType if URL changes
  useEffect(() => {
    setActiveType(getTypeFromURL());

    if (!location.state?.rejoinAstro) return;

    // Handle rejoin flow - open connect popup
    const astro = location.state.rejoinAstro;
    setSelectedAstrologer(astro);
    setIsConnectPopupOpen(true);
    activeCallAstroRef.current = astro;

    navigate(".", { replace: true, state: null });
  }, [location]);

  // isError/refetch were not read at all, which is why a failed listing request
  // produced a page with a header, the filter chips and nothing underneath —
  // see the states rendered below the list.
  const {
    data: astrodata,
    isFetching,
    isError: isListError,
    refetch: refetchAstrologers,
  } = useGetAstrologersQuery(
    {
      page,
      limit,
      specialties: specialty || "",
      isActiveType,
      ...(isActiveOnline === true && { isActive: true }),
    },
    {
      skip: isFiltered, // Skip normal API when in filtered mode
      /*
        Serve a recent result from cache instead of hitting the network on every
        mount. This screen is bounced in and out of constantly (listing ->
        profile -> back), and `true` bypassed the RTK Query cache every time, so
        each return paid the full request — through the encrypted gateway — before
        any card could paint. A number keeps the cached list if it is younger than
        this many seconds and only refetches past it. Card availability is kept
        fresh independently by the live-status sockets, so 60s on the list itself
        is safe.
      */
      refetchOnMountOrArgChange: 60,
       },
  );

  /*
    Handler for both list-state buttons — see the `checking` declaration above
    for why a bare refetch was not enough.

    Re-entry is ignored rather than blocked with `disabled`: a disabled button
    swallows the press outright, which is the failure this change exists to
    remove. The label and aria-busy report the in-flight state instead.

    A refetch that finds astrologers unmounts the card on its own (the list is no
    longer empty), so the only outcomes worth wording are "still nobody" and
    "the request failed".
  */
  const handleCheckAgain = () => {
    if (checking) return;
    setChecking(true);
    Promise.resolve(refetchAstrologers())
      .then((res) => {
        checkSeqRef.current += 1;
        setCheckResult({
          seq: checkSeqRef.current,
          failed: Boolean(res?.error || res?.isError),
        });
      })
      .catch(() => {
        checkSeqRef.current += 1;
        setCheckResult({ seq: checkSeqRef.current, failed: true });
      })
      .finally(() => setChecking(false));
  };

  const { data: recommendedData, isLoading: isLoadingRecommended } =
    // Secondary strip, not the primary grid — a longer cache window is fine and
    // keeps its request from competing with the main list on first paint.
    useGetRecommendedAstrologersQuery(undefined, { refetchOnMountOrArgChange: 300 });

  const data = astrodata?.data?.result || [];
  const recommendedAstrologers = recommendedData?.data || [];
  const { balance } = useWalletBalance();
  const [getBalance] = useGetBalanceMutation();

  // Update astrologer statuses from the status polling query (when page > 1)
  // useEffect(() => {
  //   if (isFiltered || page <= 1) return;
  //   const freshData = statusPollData?.data?.result;
  //   if (!freshData || freshData.length === 0) return;

  //   setAllAstrologers((prev) => {
  //     const freshMap = new Map(freshData.map((a) => [a._id, a]));
  //     let changed = false;
  //     const updated = prev.map((a) => {
  //       const fresh = freshMap.get(a._id);
  //       if (fresh && (fresh.isActive !== a.isActive || fresh.isBusy !== a.isBusy || JSON.stringify(fresh.isActiveType) !== JSON.stringify(a.isActiveType))) {
  //         changed = true;
  //         return { ...a, isActive: fresh.isActive, isBusy: fresh.isBusy, isActiveType: fresh.isActiveType };
  //       }
  //       return a;
  //     });
  //     return changed ? updated : prev;
  //   });

  //   // Also update top ten astrologers status
  //   setTopTenAstrologers((prev) => {
  //     const freshMap = new Map(freshData.map((a) => [a._id, a]));
  //     let changed = false;
  //     const updated = prev.map((a) => {
  //       const fresh = freshMap.get(a._id);
  //       if (fresh && (fresh.isActive !== a.isActive || fresh.isBusy !== a.isBusy || JSON.stringify(fresh.isActiveType) !== JSON.stringify(a.isActiveType))) {
  //         changed = true;
  //         return { ...a, isActive: fresh.isActive, isBusy: fresh.isBusy, isActiveType: fresh.isActiveType };
  //       }
  //       return a;
  //     });
  //     return changed ? updated : prev;
  //   });
  // }, [statusPollData, isFiltered, page]);

  useEffect(() => {
    const incomingTopTen = astrodata?.data?.topTenAstrologer;

     if (
      incomingTopTen &&
      incomingTopTen.length > 0 &&
      topTenAstrologers.length === 0
    ) {
      setTopTenAstrologers(incomingTopTen);
    }
  }, [astrodata?.data?.topTenAstrologer]);

  // Update local astrologer state when real-time status event fires
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      const { astrologerId, isActive, isActiveType, astrologer } = e.detail;

      setTopTenAstrologers((prev) =>
        prev.map((a) =>
          a._id === astrologerId
            ? { ...a, isActive, isActiveType: isActiveType || [], ...(astrologer?.price && { price: astrologer.price }) }
            : a
        )
      );

      setAllAstrologers((prev) =>
        prev.map((a) =>
          a._id === astrologerId
            ? { ...a, isActive, isActiveType: isActiveType || [], ...(astrologer?.price && { price: astrologer.price }) }
            : a
        )
      );
    };

    window.addEventListener("astrologer:status", handleStatusUpdate);
    return () => window.removeEventListener("astrologer:status", handleStatusUpdate);
  }, []);

  useEffect(() => {
    /*
      No window.scrollTo(0, 0) here.

      Scroll is owned by ScrollToTop (rendered in HomeLayout): PUSH goes to the
      top, POP restores the offset stored for that history entry — which exists
      precisely because main.jsx turns off native restoration. This effect ran on
      every mount, including the mount that a back navigation produces, and it
      fired against the same frames the restore loop was using. So coming back
      from an astrologer profile fought the restore and, since the loop hands
      control to the user on the first touch, a scroll gesture on arrival left
      the visitor at the top of the list with their place gone.

      That is the read on a session recording from an iOS Safari visitor opening
      profiles at 00:05, 00:19 and again straight after, bouncing to the listing
      between each — seven clicks, seven pages, two and a half minutes.
    */

    // Coming back: put the list back the size it was, so the restored scroll
    // offset lands on the card they left from. See listingCache.
    const canRestore =
      navigationType === "POP" &&
      // A category URL is a filtered view: FilterChips rebuilds it from the slug
      // on arrival, so restoring the unfiltered list underneath it would only
      // flash content that is about to be replaced.
      !categoryFromParams &&
      listingCache.viewKey === viewKey &&
      listingCache.items.length > 0;

    if (canRestore) {
      setPage(listingCache.page);
      setAllAstrologers(listingCache.items);
      setHasMore(listingCache.hasMore);
      /*
        The observer below waits on this ref, and the effect that normally sets it
        requires `page === 1` — which a restored page 2+ never is, so infinite
        scroll would be dead for the rest of the visit without this.
      */
      initialLoadComplete.current = true;
    } else {
      listingCache.viewKey = viewKey;
      listingCache.page = 1;
      listingCache.items = [];
      listingCache.hasMore = true;

      setPage(1);
      setAllAstrologers([]);
      setHasMore(true);
    }

    setIsFiltered(false);
    // A category URL (/astrologers/marriage-relationships) IS a filtered view —
    // the filter is just applied a moment later, by the child that receives
    // `selectedType`. Reporting filter_applied:false here made every paid
    // category landing look unfiltered in analytics, which is precisely the
    // dimension those campaigns are measured on.
    trackEvent("astrologer_list_viewed", {
      filter_applied: Boolean(categoryFromParams),
      filter_value: categoryFromParams || undefined,
      filter_source: categoryFromParams ? "url_category" : "none",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MERGE API DATA - only for normal (non-filtered) mode
  useEffect(() => {
    if (isFiltered) return; // Don't process normal API data when in filtered mode
    if (!data || data.length === 0) {
      setHasMore(false);
      return;
    }

    if (page === 1) {
      setAllAstrologers(data);
    } else {
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newOnes = data.filter((i) => !existingIds.has(i._id));
        if (newOnes.length === 0) return prev;
        return [...prev, ...newOnes];
      });
    }

    setHasMore(data.length >= limit);
  }, [data, page, isFiltered]);

  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetching);
  const isFilteredRef = useRef(isFiltered);
  const loadMoreRef = useRef(null);
  const initialLoadComplete = useRef(false);

  // Keep refs updated
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isFetchingRef.current = isFetching;
    isFilteredRef.current = isFiltered;
  }, [hasMore, isFetching, isFiltered]);

  // Mark when initial data is loaded
  useEffect(() => {
    if (allAstrologers.length > 0 && page === 1 && !isFiltered) {
      initialLoadComplete.current = true;
    }
  }, [allAstrologers.length, page, isFiltered]);

  /*
    Keep the cache in step with what is on screen, so a back navigation can put
    it back. Only the unfiltered list: a filtered view is driven by FilterChips
    and rebuilt from the URL on arrival anyway.
  */
  useEffect(() => {
    if (isFiltered || allAstrologers.length === 0) return;
    listingCache.viewKey = viewKey;
    listingCache.page = page;
    listingCache.items = allAstrologers;
    listingCache.hasMore = hasMore;
  }, [allAstrologers, page, hasMore, isFiltered, viewKey]);

  // Intersection Observer for infinite scroll - only in normal mode
  useEffect(() => {
    // Don't set up observer until initial data is loaded
    if (isFiltered || !hasMore || isFetching || !initialLoadComplete.current)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isFilteredRef.current &&
          !isFetchingRef.current
        ) {
          setPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isFetching, hasMore, isFiltered, allAstrologers.length]);

  // Filter handlers
  const resetFilters = () => {
    setIsFiltered(false);
    setSpecialty("");
    setPage(1);
    setAllAstrologers([]);
    setHasMore(true);
  };

  const handleSelect = (category) => {
    if (!category) {
      // Reset to normal pagination mode
      resetFilters();
    } else {
      trackEvent("astrologer_filter_applied", { filter_type: "specialization", filter_value: category });
      setSpecialty(category);
      setIsFiltered(true);
      setPage(1);
      setAllAstrologers([]);
      setHasMore(true);
    }
  };

  const handleApplyFilters = (payload) => {
    // console.log("handleApplyFilters::",payload)
    const {
      result: { result: filteredData },
      append = false,
    } = payload || {};

    setIsFiltered(true);
    // A successful apply clears any prior filter-error card.
    setFilterError(null);

    if (!append) {
      // First page OR new filter → reset list
      setAllAstrologers(filteredData || []);
    } else {
      // Scroll load → append only new items
      setAllAstrologers((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newOnes = (filteredData || []).filter(
          (i) => !existingIds.has(i._id),
        );
        return [...prev, ...newOnes];
      });
    }

    setHasMore((filteredData || []).length >= limit);
  };

  // Custom handler for profile selection (doesn't close modal)
  const handleProfileSelect = (profile) => {
    setLocalSelectedProfile(profile);
  };

  // Handler for Continue button (triggers socket emit)
  const handleContinueAfterKundliSelect = () => {
    if (localSelectedProfile) {
      hookHandleAfterKundliSelect(localSelectedProfile);
    }
  };

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    // The astrologer is already stored in selectedAstrologer state and activeCallAstroRef
    // The connectionType is stored in pendingConnectionType
    // Now we need to perform the same validations as the normal flow

    if (selectedAstrologer && pendingConnectionType) {
      // Call the appropriate handler based on connection type
      // This ensures all validations (balance check, online check) are performed
      if (pendingConnectionType === "chat") {
        hookHandleChatStart(selectedAstrologer);
      } else if (pendingConnectionType === "audio") {
        hookHandleCallStart(selectedAstrologer, "audio");
      }

      // Clear the pending connection type
      setPendingConnectionType(null);
    }

    // OLD LOGIC (commented out): This was bypassing validations
    // hookHandleAfterKundliSelect(selectedProfile);
  };

  // Handle connect button click - reused from Home page
  // Receives connectionType (chat or audio) from NewAstrologerCard
  const handleConnectClick = async (astrologer, connectionType, isEmergency = false) => {
    // Guest flows (no login redirect):
    //  - chat  → conversational guest screen
    //  - call/video → AI Wow-style guest modal, then initiate the call
    if (!getToken()) {
      if (connectionType === "chat") {
        navigate(`/guest-chat/${astrologer._id}`, { state: { astrologer } });
      } else {
        openGuestConnect(astrologer, connectionType);
      }
      return;
    }

    if (!requireAuth()) return;

    // if (WaitingList || callWaitingList) {
    //   Toast.error(
    //     "You are already waiting for an astrologer. Please cancel the current request first.",
    //   );
    //   return;
    // }

    setSelectedAstrologer(astrologer);
    activeCallAstroRef.current = astrologer;

    if (hasKundli) {
      let result;
      if (connectionType === "chat") {
        result = await hookHandleChatStart(astrologer, true, isEmergency);
      } else if (connectionType === "audio") {
        result = await hookHandleCallStart(astrologer, "audio", isEmergency);
      }
      if (result?.emergencyAvailable) {
        setShowEmergencyModal(true);
        return;
      }
    } else {
      setPendingConnectionType(connectionType);
      hookSetOpenModal((prev) => ({ ...prev, kundli: true }));
    }
  };

  /* ===== TWO-WAY ACCEPT: User accept/reject handlers ===== */
  const handleUserAcceptCall = (roomId) => {
    console.log("[TwoWayAccept] ✅ User accepting call, roomId:", roomId);
    voiceSocket.emit("call:user_accept", { roomId });
    setCallApprovalData(null);
    // Promote next ring from queue if any
    setRingQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        if (next.type === "chat") {
          setChatApprovalData(next);
        } else {
          setCallApprovalData(next);
        }
        return rest;
      }
      return prev;
    });
  };

  const handleUserRejectCall = (roomId) => {
    console.log("[TwoWayAccept] ❌ User rejecting call, roomId:", roomId);
    voiceSocket.emit("call:user_reject", { roomId });
    setCallApprovalData(null);
    removePendingConnection(roomId);
    setRingQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        if (next.type === "chat") {
          setChatApprovalData(next);
        } else {
          setCallApprovalData(next);
        }
        return rest;
      }
      return prev;
    });
  };

  const handleUserAcceptChat = (roomId) => {
    console.log("[TwoWayAccept] ✅ User accepting chat, roomId:", roomId);
    voiceSocket.emit("chat:user_accept", { roomId });
    setChatApprovalData(null);
    setRingQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        if (next.type === "chat") {
          setChatApprovalData(next);
        } else {
          setCallApprovalData(next);
        }
        return rest;
      }
      return prev;
    });
  };

  const handleUserRejectChat = (roomId) => {
    console.log("[TwoWayAccept] ❌ User rejecting chat, roomId:", roomId);
    voiceSocket.emit("chat:user_reject", { roomId });
    setChatApprovalData(null);
    removePendingConnection(roomId);
    setRingQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        if (next.type === "chat") {
          setChatApprovalData(next);
        } else {
          setCallApprovalData(next);
        }
        return rest;
      }
      return prev;
    });
  };

  const handleRingTimeout = (roomId) => {
    console.log("[TwoWayAccept] ⏰ Local ring timeout, roomId:", roomId);
    // Server will send call:on_hold / chat:on_hold, but dismiss ring UI immediately
    // The on_hold handler will add it to onHoldSessions when the server event arrives
    setCallApprovalData((prev) => (prev?.roomId === roomId ? null : prev));
    setChatApprovalData((prev) => (prev?.roomId === roomId ? null : prev));
    setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
  };

  /* ===== ON HOLD: Unhold (re-initiate) and Cancel handlers ===== */
  const handleUnhold = (roomId) => {
    console.log("[OnHold] ▶ User unholding, roomId:", roomId);
    const session = onHoldSessions.find((s) => s.roomId === roomId);
    const eventName = session?.type === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(eventName, { roomId });
    // Remove from on-hold list — server will send a new call:room / chat:room
    setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== roomId));
    removePendingConnection(roomId);
  };

  const handleHoldCancel = (roomId) => {
    console.log("[OnHold] ✕ User canceling on-hold, roomId:", roomId);
    const session = onHoldSessions.find((s) => s.roomId === roomId);
    const eventName = session?.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
    voiceSocket.emit(eventName, { roomId });
    setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== roomId));
    removePendingConnection(roomId);
  };

  /* ------------------- SOCKET CALL FLOW (ADDED ONLY) ------------------- */

  useEffect(() => {
    if (!userIdLocal || isRecommendModalOpen) return;

    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
      voiceSocket.connect();
    }

    return () => {
      // Don't call voiceSocket.off() — it removes ALL listeners app-wide
    };
  }, [userIdLocal, isRecommendModalOpen]);

  const connectSocket = () => {
    if (voiceSocket.connected) voiceSocket.disconnect();

    voiceSocket.io.opts.query = {
      userId: userIdLocal,
      role: "CUSTOMER",
    };

    voiceSocket.connect();
  };

  const resetCallState = () => {
    setCallRoomId(null);
    setChatRoomId(null);
    setActiveCallAstro(null);

    // Only clear refs if there are no other pending connections
    // (other pending requests still need these refs)
    // activeCallAstroRef and kundliRef are NOT cleared here —
    // they're set per-initiation and needed by pending connections

    setActiveCall(null);
    resetChatFlow();
    resetCallFlow();
  };

  useEffect(() => {
    if (!userIdLocal || isRecommendModalOpen) return;

    /* Room ready event */
    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setCallWaitingList(5); // Show waiting for call
    };

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2, "ringing", data?.recieverDetail?._id || data?.astrologerId);
      // Store astrologer details from socket data if available
      if (data?.recieverDetail) {
        activeCallAstroRef.current = data.recieverDetail;
      }
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5, "ringing", data?.recieverDetail?._id || data?.astrologerId);
      // Store astrologer details from socket data if available
      if (data?.recieverDetail) {
        activeCallAstroRef.current = data.recieverDetail;
      }
    };

    /* ===== TWO-WAY ACCEPT: Astrologer accepted, user must now accept/reject ===== */
    const handleCallAstrologerAccepted = (data) => {
      console.log("[TwoWayAccept] 📥 call:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;

      // Only react in the tab that initiated this request (event is broadcast to
      // all of the user's open tabs).
      if (!claimRoom(roomId, type || "audio")) return;

      // Update queue status
      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });

      const ringData = { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency };

      // If user has an active call, show as toast banner instead of blocking modal
      if (activeCall) {
        setRingQueue((prev) => [...prev, ringData]);
      } else {
        // Show primary ring modal
        setCallApprovalData(ringData);
      }
    };

    const handleChatAstrologerAccepted = (data) => {
      console.log("[TwoWayAccept] 📥 chat:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;

      // Only react in the tab that initiated this request.
      if (!claimRoom(roomId, "chat")) return;

      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });

      const ringData = { roomId, sessionId, astrologerId, astrologerDetail, type: type || "chat", isEmergency };

      // Chat ring — show as primary if no active chat/call
      if (activeCall) {
        setRingQueue((prev) => [...prev, ringData]);
      } else {
        setChatApprovalData(ringData);
      }
    };

    /* ===== TWO-WAY ACCEPT: Ring timeout → On Hold (60s expired) ===== */
    const handleCallOnHold = (data) => {
      console.log("[TwoWayAccept] ⏸️ call:on_hold", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, type, message } = data;
      // Dismiss ring UI for this roomId
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      // Update queue status
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
      // Add to on-hold sessions for persistent banner
      setOnHoldSessions((prev) => {
        if (prev.some((s) => s.roomId === roomId)) return prev;
        return [...prev, { roomId, sessionId, astrologerId, type, message }];
      });
    };

    const handleChatOnHold = (data) => {
      console.log("[TwoWayAccept] ⏸️ chat:on_hold", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, type, message } = data;
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
      setOnHoldSessions((prev) => {
        if (prev.some((s) => s.roomId === roomId)) return prev;
        return [...prev, { roomId, sessionId, astrologerId, type: type || "chat", message }];
      });
    };

    // Legacy ring_timeout — keep for backward compatibility, treat same as on_hold
    const handleCallRingTimeout = (data) => {
      console.log("[TwoWayAccept] ⏰ call:ring_timeout (legacy)", JSON.stringify(data));
      handleCallOnHold(data);
    };

    const handleChatRingTimeout = (data) => {
      console.log("[TwoWayAccept] ⏰ chat:ring_timeout (legacy)", JSON.stringify(data));
      handleChatOnHold(data);
    };

    /* ===== WAITLIST AUTO-CANCEL: 2-min astrologer unavailable ===== */
    const handleCallUnavailable = (data) => {
      console.log("[TwoWayAccept] ❌ call:unavailable", JSON.stringify(data));
      const { roomId, astrologerId, message } = data;
      if (roomId) removePendingConnection(roomId);
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      // Don't reset global call flow — other pending connections may still be active
      Toast.error(message || "Astrologer is unavailable. Please try again later.");
    };

    const handleChatUnavailable = (data) => {
      console.log("[TwoWayAccept] ❌ chat:unavailable", JSON.stringify(data));
      const { roomId, astrologerId, message } = data;
      if (roomId) removePendingConnection(roomId);
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      // Don't reset global chat flow — other pending connections may still be active
      Toast.error(message || "Astrologer is unavailable. Please try again later.");
    };

    /* ===== CALL ACCEPTED (both sides accepted, billing starts) ===== */
    const handleCallAccepted = async ({
      roomId,
      token,
      channelName,
      type,
      remainingTime,
      isSwitch,
      ...rest
    }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch");
        resetCallFlow();
        return;
      }

      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch");
        resetCallFlow();
        return;
      }
      
      // Regular call acceptance — clear ring UI
      setCallApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      resetCallFlow();
      // Only remove this specific connection from pending — keep others alive
      removePendingConnection(roomId);

      // Use astrologer from ref, fallback to socket payload
      const astro = rest?.astrologer || rest?.recieverDetail;
      const kundliId = kundliRef.current;

      // Use channelName from server if provided, otherwise fall back to roomId
      const agoraChannel = channelName || roomId;
      console.log("[TwoWayAccept] call:accepted — roomId:", roomId, "channelName:", channelName, "→ agoraChannel:", agoraChannel);

      try {
        setActiveCall({
          roomId,
          channelName: agoraChannel,
          chatRoomId,
          agoraToken: token,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || rest?.astrologer?.profileImgUrl,
        });
      } catch {
        Toast.error("Failed to start call");
      }
    };

    const handleChatAccepted = async ({
      astrologerId,
      roomId,
      userId,
      ...data
    }) => {
      // Clear ring UI
      setChatApprovalData(null);
      setRingQueue((prev) => prev.filter((r) => r.roomId !== roomId));
      setWaitingList(false);
      // Only remove this specific connection from pending — keep others alive
      removePendingConnection(roomId);

      const astro = data?.astrologer || activeCallAstroRef.current;
      const kundliId = kundliRef.current;

      try {
        if (!roomId) throw new Error();

        setActiveChat({
          roomId,
          chatRoomId,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          astrologerID: astro?.astrologer_ID || data?.astrologer?.astrologer_ID,
          kundliId,
          astrologerName: getAstrologerDisplayName(data?.astrologer),
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: getAstrologerDisplayName(astro),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: getAstrologerDisplayName(data?.astrologer),
            astroID: data?.astrologer?.astrologer_ID,
            experience: data?.astrologer?.experience,
            profileImgUrl: astro?.profileImgUrl || data?.astrologer?.profileImgUrl,
          },
        });
      } catch (e) {
        Toast.error("Failed to start chat");
      }
    };

    /* ===== CANCELED (covers user cancel, system timeout, hold cancel, unhold re-initiate) ===== */
    const handleCallCanceled = (data) => {
      console.log("[TwoWayAccept] 📥 call:canceled", JSON.stringify(data));
      const canceledRoomId = data?.roomId || data?.sessionData?.roomId;
      if (canceledRoomId) {
        removePendingConnection(canceledRoomId);
        if (callApprovalRef.current?.roomId === canceledRoomId) setCallApprovalData(null);
        setRingQueue((prev) => prev.filter((r) => r.roomId !== canceledRoomId));
        // Also remove from on-hold sessions
        setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== canceledRoomId));
      }
    };

    const handleChatCanceled = (data) => {
      console.log("[TwoWayAccept] 📥 chat:canceled", JSON.stringify(data));
      const canceledRoomId = data?.roomId || data?.sessionData?.roomId;
      if (canceledRoomId) {
        removePendingConnection(canceledRoomId);
        if (chatApprovalRef.current?.roomId === canceledRoomId) setChatApprovalData(null);
        setRingQueue((prev) => prev.filter((r) => r.roomId !== canceledRoomId));
        setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== canceledRoomId));
      }
    };

    /* REJECTED */
    const handleCallRejected = (data) => {
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        return;
      }
      
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
        if (callApprovalRef.current?.roomId === rejectedRoomId) setCallApprovalData(null);
        setRingQueue((prev) => prev.filter((r) => r.roomId !== rejectedRoomId));
        setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== rejectedRoomId));
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }

      const label = data?.type === "chat" ? "chat" : "call";
      Toast.error(`Astrologer rejected the ${label} request`);
      // Don't reset global chat/call flow — other pending connections may still be active
    };

    /* ERROR */
    const handleSocketError = (err) => {
      if (err?.message === "Call has already ended") {
        // Only clear the active session, not pending connections
        setActiveCall(null);
        resetChatFlow();
        resetCallFlow();
        return;
      }

      // ACTIVE CALL CONFLICT — user tried to initiate but already has an active call
      if (err?.message === "You already have an active call") {
        Toast.error(err?.message || "You already have an active call. Please end it before starting a new one.");
        return;
      }

      // MAX QUEUE — user exceeded 5 simultaneous waiting requests
      if (err?.message?.includes("Maximum") && err?.message?.includes("simultaneous queues")) {
        Toast.error(err?.message || "Maximum 5 simultaneous queues allowed. Please cancel an existing request first.");
        return;
      }

      // USER_BUSY error — user tried to accept but has active session
      if (err?.code === "USER_BUSY") {
        Toast.error(err?.message || "You are already on a call. End it first.");
        return;
      }

      // ALREADY_ACCEPTED — duplicate accept from another device
      if (err?.code === "ALREADY_ACCEPTED") {
        return;
      }

      // CALL_NOT_AVAILABLE / CHAT_NOT_AVAILABLE — session expired
      if (err?.code === "CALL_NOT_AVAILABLE" || err?.code === "CHAT_NOT_AVAILABLE") {
        const errRoomId = err?.roomId;
        if (errRoomId) {
          removePendingConnection(errRoomId);
          if (callApprovalRef.current?.roomId === errRoomId) setCallApprovalData(null);
          if (chatApprovalRef.current?.roomId === errRoomId) setChatApprovalData(null);
          setRingQueue((prev) => prev.filter((r) => r.roomId !== errRoomId));
          setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== errRoomId));
        }
        Toast.error(err?.message || "Session is no longer available");
        return;
      }

      // CALL_NOT_ON_HOLD / CHAT_NOT_ON_HOLD — session not on hold
      if (err?.code === "CALL_NOT_ON_HOLD" || err?.code === "CHAT_NOT_ON_HOLD") {
        const errRoomId = err?.roomId;
        if (errRoomId) {
          setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== errRoomId));
        }
        Toast.error(err?.message || "This session is not on hold");
        return;
      }

      // INSUFFICIENT_BALANCE — user tried to unhold but balance too low
      if (err?.code === "INSUFFICIENT_BALANCE") {
        Toast.error(err?.message || "Insufficient balance to re-initiate");
        return;
      }

      Toast.error(err?.message || "Connection error");
      // Only clear the active session — don't cancel all pending connections
      // Other pending requests, on-hold sessions, and ring queue should survive
      const errRoomId = err?.roomId;
      if (errRoomId) {
        removePendingConnection(errRoomId);
        setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== errRoomId));
        if (callApprovalRef.current?.roomId === errRoomId) setCallApprovalData(null);
        if (chatApprovalRef.current?.roomId === errRoomId) setChatApprovalData(null);
        setRingQueue((prev) => prev.filter((r) => r.roomId !== errRoomId));
      }
      setActiveCall(null);
      resetChatFlow();
      resetCallFlow();
    };

    /* CALL ENDED */
    const handleCallEnded = (data) => {
      const endedRoomId = data?.roomId;
      // Only clear the active call/chat — don't touch pending connections or on-hold sessions
      setActiveCall(null);
      setCallRoomId(null);
      setChatRoomId(null);
      resetChatFlow();
      resetCallFlow();
      // Remove this specific room from pending if it's there
      if (endedRoomId) {
        removePendingConnection(endedRoomId);
        setOnHoldSessions((prev) => prev.filter((s) => s.roomId !== endedRoomId));
      }
    };

    /* ACTIVITY — queue position updates */
    const handleActivity = (data) => {
      // Auto-promote: status changed from waiting to ringing
      if (data?.status === "ringing" && data?.roomId) {
        updateStatusByRoomId(data.roomId, "ringing");
      }
    };

    // Attach events
    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call:ended", handleCallEnded);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call:ended", handleCallEnded);
    };
  }, [userIdLocal, isRecommendModalOpen]);

  //JSX
  //
  // No early full-page return on first load.
  //
  // This used to be:
  //
  //   if (isFetching && page === 1 && allAstrologers.length === 0)
  //     return <PrimaryLoader isLoading />;
  //
  // which replaced the entire screen with a fullscreen spinner until
  // useGetAstrologersQuery resolved. Nothing real painted in the meantime — no
  // heading, no filter chips — so LCP on this route was gated end to end on that
  // API call, on top of the usual CSR floor (blank HTML -> entry JS -> route
  // chunk -> React). /chat-to-astrologer is an ad and referral landing page, so
  // that is a cold, uncached, first-paint path.
  //
  // The static shell below (back button, <h1>, FilterChips) depends on no
  // network data, so it can paint as soon as the route chunk executes, which
  // makes the <h1> the LCP element and decouples LCP from API latency. The
  // in-list spinner at loadMoreRef already covers the loading state — the
  // infinite-scroll observer is guarded on !isFetching and
  // !initialLoadComplete.current, so the sentinel sitting in the viewport with an
  // empty list cannot trigger a spurious page increment.
  return (
    <div className={styles.mainContainer}>
      <div className={styles.pageHeader}>

        {/* location.key, not window.history.length — see BackButton.jsx. This is
            a Google Ads landing page, and the ad redirect chain makes
            history.length > 1 true, so back used to walk the visitor off the
            origin instead of into the app. */}
        <button className={styles.localBackBtn} onClick={() => {
          if (location.key !== "default") navigate(-1);
          else navigate("/", { replace: true });
          }} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className={styles.pageTitle}>
          Chat With Best <span className={styles.highlight}>Astrologers</span>{" "}
          Online
        </h1>
        
      </div>

      <FilterChips
        onSelect={handleSelect}
        isActiveType={activeType}
        onApplyFilters={handleApplyFilters}
        isOnlineFromURL={isOnlineFromURL}
        setShowFilterAstrologer={setShowFilterAstrologer}
        selectedType={location.state?.selectedType || new URLSearchParams(location.search).get("category") || categoryFromParams || undefined}
        astroFilterTab={astroFilterTab}
        isFetchingFilterTab={isFetchingFilterTab}
        onFilterLoading={setIsFilterLoading}
        onFilterError={setFilterError}
      />


      {/*
        No loader here.
        ==============
        This used to be `<PrimaryLoader isLoading={isFilterLoading} />`, and
        PrimaryLoader defaults to `fullscreen`, so it rendered a full-page
        overlay. On a category URL such as /astrologers/love-relationships that
        overlapped the in-list spinner further down and the page showed two
        loaders at once:

          - FilterChips auto-applies the category from the URL and calls
            onFilterLoading(true) at the *start* of the request, so
            isFilterLoading flips immediately on mount.
          - isFiltered is only set once that request *resolves* (in
            handleApplyFilters), and useGetAstrologersQuery is skipped on
            `isFiltered` — so for the whole duration of the filter request the
            base list query is still live and isFetching is also true.

        Both flags describe one thing: the astrologer list is loading. It is now
        rendered once, at loadMoreRef below, using the inline presentation.
        Keeping it out of here also preserves the LCP work described above — a
        fullscreen overlay would have covered the <h1> that this route relies on
        as its LCP element.
      */}
      {/* Top Astrologers Section - New Design

          The `urlCategoryPending` half exists for CLS, and it is specific to
          /astrologers/:category.

          On a category URL the base (unfiltered) query is NOT skipped on first
          load: its `skip` is `isFiltered`, and per the note above isFiltered only
          becomes true once FilterChips' auto-applied category request *resolves*.
          So the sequence on /astrologers/marriage-relationships was:

            1. static shell paints (h1 + chips) — deliberate, this is the LCP
            2. base query resolves -> astrodata.data.topTenAstrologer arrives ->
               topTenAstrologers set -> THIS SECTION MOUNTS: heading, divider and
               a rail of up to ten cards whose avatar box alone is 100px, several
               hundred px of height inserted above the main grid
            3. the same base response fills the grid with UNFILTERED astrologers
            4. the category filter resolves -> setShowFilterAstrologer(true) ->
               this section UNMOUNTS and the grid is replaced by the filtered set

          Steps 2 and 4 are two page-scale shifts in opposite directions, and the
          section is guaranteed to end up hidden on any category URL because
          applyFilters always finishes with setShowFilterAstrologer(true).
          Rendering it in between is pure layout churn.

          Clarity URL performance for 08 Sep shows exactly that shape — every
          category URL is catastrophic while non-category routes are not:
          marriage-relationships CLS 3.275, love-relationships 2.498,
          career-business 2.029, against 1.596 for an astrologer profile.

          Deliberately NOT keyed on categoryFromParams alone: if the filter
          request fails, showFilterAstrologer never flips, and the visitor should
          still get this section rather than a page with the error card and
          nothing else. filterError releases the suppression for that case, so the
          only behaviour that changes is the transient double-shift.

          The step-3 grid swap is a separate shift and is not addressed here —
          fixing it means skipping the base query when the URL carries a category,
          which changes this screen's data flow rather than just its markup. */}
      {!showFilterAstrologer && !urlCategoryPending && topTenAstrologers.length > 0 && (
        <>
          <div className={styles.sectionDivider}>
            <h2 className={styles.sectionTitle}>TOP ASTROLOGERS FOR YOU</h2>
          </div>

          <div className={styles.topAstrologersGrid}>
            {topTenAstrologers.map((astro, topIndex) => (
              // REPLACED: TopAstrologerCard with NewAstrologerCard for consistency
              // <TopAstrologerCard
              //   key={astro._id}
              //   data={astro}
              //   onConnect={() => {
              //     setSelectedAstrologer(astro);
              //     setIsConnectPopupOpen(true);
              //     activeCallAstroRef.current = astro;
              //   }}
              // />
              <NewAstrologerCard
                key={astro._id}
                astrologer={astro}
                // First two cards are above the fold in this horizontal rail and
                // are the leading image LCP candidates on this route, so they
                // load eagerly at high priority. The rest stay lazy.
                priority={topIndex < 2}
                onConnect={handleConnectClick}
                onEmergencyClick={(astrologer) => {
                  setSelectedAstrologer(astrologer);
                  setShowEmergencyModal(true);
                }}
                // OLD INLINE LOGIC (commented out):
                // onConnect={(astrologer, type) => {
                //   setSelectedAstrologer(astrologer);
                //   setIsConnectPopupOpen(true);
                //   activeCallAstroRef.current = astrologer;
                //   // Type will be "chat" or "audio" from NewAstrologerCard buttons
                //   if (type === "chat") {
                //     hookHandleChatStart(astrologer, true);
                //   } else if (type === "audio") {
                //     hookHandleCallStart(astrologer, "audio");
                //   }
                // }}
              />
            ))}
          </div>
        </>
      )}

      {/*
        Reserve the TOP ASTROLOGERS rail while the first page is in flight.

        Placed here, above the "EXPLORE ASTROLOGERS" heading, because that is
        where the real block renders — it must reserve the space in the position
        the real content will occupy, not merely the right amount of it.

        It has to be reserved at all because it mounts from the SAME base
        response that fills the grid below, and it inserts ABOVE that grid. With
        only the grid reserved this route's CLS moved the wrong way,
        0.182 -> 0.227: a reserved grid puts real-looking cards inside the
        viewport, and the rail then shifts every one of them down ~383px, which
        is a far larger impact fraction than when the grid below was still 0px.
        Reserving one without the other is worse than reserving neither.

        Gated on `!categoryFromParams` because that is exactly when the rail will
        appear: on /astrologers/:category the real block is suppressed (see
        `urlCategoryPending` at the TOP ASTROLOGERS block above), so reserving
        space there would create the opposite shift when it collapsed.
        `categoryFromParams` comes from useParams, so it is known on the first
        render.

        The heading is the real one rather than a placeholder bar — it is static
        text that does not depend on the response, so showing it early costs
        nothing and reserves its own height.
      */}
      {allAstrologers.length === 0 && (isFetching || isFilterLoading) && !filterError && !categoryFromParams && (
        <>
          <div className={styles.sectionDivider}>
            <h2 className={styles.sectionTitle}>TOP ASTROLOGERS FOR YOU</h2>
          </div>
          <div className={styles.topAstrologersGrid} aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`rail-skeleton-${i}`} className={styles.railSkeletonCard} />
            ))}
          </div>
        </>
      )}

      {/* Explore Astrologers Section - Original Design */}

      <div className={styles.sectionDivider}>
        <h2 className={styles.sectionTitle}>EXPLORE ASTROLOGERS</h2>
      </div>

      {/*
        Reserve the grid's height while the first page is in flight.

        `.cardsContainer` is a CSS grid whose only children are the astrologer
        cards, so with an empty `allAstrologers` it is 0px tall. The nine cards
        then arrive at once and expand it by ~1766px on mobile, which pushes
        `.footerWrapper` down the page. Lighthouse's `layout-shifts` culprit
        list attributed 0.144 + 0.036 of this route's 0.182 CLS to exactly that
        element, and it is the part that raising HomeLayout's route-level
        placeholder did NOT fix (that only recovered 0.025 of it — see the note
        on `.routeFallback` in HomeLayout.module.scss).

        `limit` is the page size the query actually asks for, so the count is
        tied to the request rather than hard-coded; the skeleton reserves the
        same number of rows the response will fill. `.skeletonCard` carries the
        measured per-card height for each breakpoint.

        Both flags are needed. `isFetching` covers the base list. Loading a
        category URL goes through FilterChips instead, which flips
        `isFilterLoading` at the *start* of its request, and on that path the
        base query is skipped — so without it /astrologers/:category would still
        render a 0px grid. `filterError` suppresses the skeleton once a filter
        request has failed, so the error card below is not preceded by nine
        placeholders that will never fill.
      */}
      {allAstrologers.length === 0 && (isFetching || isFilterLoading) && !filterError && (
        <>
          {/*
            The TOP ASTROLOGERS rail is reserved too, and it has to be.

            It mounts from the SAME base response that fills the grid below, and
            it inserts ABOVE that grid — so reserving only the grid moved this
            route's CLS the wrong way, 0.182 -> 0.227: the reserved grid puts
            real-looking cards inside the viewport, and the rail then shifts all
            of them down ~383px. Reserving one without the other is worse than
            reserving neither.

            Gated on `!categoryFromParams` because that is exactly when the rail
            will appear. On /astrologers/:category the real block is suppressed
            (see `urlCategoryPending` at the TOP ASTROLOGERS block below), so
            reserving space for it there would create the opposite shift when the
            space collapsed. `categoryFromParams` comes from useParams, so this
            is known on the first render.

            The heading is the real one, not a placeholder bar: it is static text
            that does not depend on the response, so showing it early costs
            nothing and reserves its own 24px.
          */}
          <div className={styles.cardsContainer} aria-hidden="true">
            {Array.from({ length: limit }, (_, i) => (
              <div key={`astro-skeleton-${i}`} className={styles.skeletonCard} />
            ))}
          </div>
        </>
      )}

      <div className={styles.cardsContainer}>
        {allAstrologers?.map((astro, index) => (
          <>
            <div key={astro._id} className={styles.cardWrapper}>
              {/* {isChatMode ? (
              <ChatAstrologerCard
                data={astro}
                onConnect={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                  activeCallAstroRef.current = astro;
                }}
              />
            ) : (
              <AstrologerCard
                isActiveType={activeType}
                data={astro}
                image={astroImages[index % astroImages.length]}
                onFollow={() => onFollow(astro._id)}
                onChat={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
                onProfile={() => onProfile(astro)}
                onAudioCall={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
                onVideoCall={() => {
                  setSelectedAstrologer(astro);
                  setIsConnectPopupOpen(true);
                }}
              />
            )} */}

              <NewAstrologerDetailsCard
                key={astro._id}
                astrologer={astro}
                priority={index === 0}
                onConnect={handleConnectClick}
                connectingType={
                  isConnecting(astro._id, "chat")
                    ? "chat"
                    : isConnecting(astro._id, "audio")
                      ? "audio"
                      : null
                }
              />
            </div>
          </>
        ))}
      </div>

      {/* `isFilterLoading` is part of the guard so "No astrologers found."
          cannot flash while a filter request is still in flight — isFetching is
          already false by then, because the base query is skipped on isFiltered. */}
      {/*
        The filtered empty state was a single line of text — "No astrologers
        found." — with no interactive element at all. The two unfiltered states
        below were given proper cards with a retry, but this one was missed, and
        it is the one a paid campaign lands on: /astrologers/:category applies the
        filter straight from the URL, so a category that is renamed, retired or
        simply has nobody online right now drops the visitor on a dead end with
        the filter still stuck on.

        FilterChips takes the URL slug and applies it without checking it against
        the fetched category list, so an unrecognised slug behaves identically to
        an empty category — same dead end, no explanation.

        Clearing the filter therefore has to clear the URL too. resetFilters()
        alone is not enough: `selectedType` is recomputed from
        `location.state?.selectedType || ?category || useParams().category`, so
        FilterChips would immediately re-apply it and we would bounce straight
        back to empty. `replace` keeps the Back button pointing wherever the
        visitor actually came from.
      */}
      {/*
        Filtered / category path failed to load. Mirrors the base list's
        "Couldn't load astrologers" card, but retry replays the failed FILTER
        (via the retry() FilterChips handed us) rather than the base query.
        Gated on an empty list so a failure while scroll-loading a filtered list
        leaves the results already on screen alone.
      */}
      {filterError && isFiltered && !isFilterLoading && allAstrologers.length === 0 && (
        <div className={styles.listStateCard}>
          <h2 className={styles.listStateTitle}>Couldn&apos;t load astrologers</h2>
          <p className={styles.listStateText}>
            The list didn&apos;t come through. This is usually a connection hiccup.
          </p>
          <button
            type="button"
            className={styles.listStateBtn}
            aria-busy={filterRetrying}
            onClick={() => {
              if (filterRetrying) return;
              setFilterRetrying(true);
              Promise.resolve(filterError.retry?.()).finally(() =>
                setFilterRetrying(false)
              );
            }}
          >
            {filterRetrying ? "Trying…" : "Try again"}
          </button>
        </div>
      )}

      {!filterError && !isFetching && !isFilterLoading && allAstrologers.length === 0 && isFiltered && (
        <div className={styles.listStateCard}>
          <h2 className={styles.listStateTitle}>No astrologers in this category</h2>
          <p className={styles.listStateText}>
            {categoryFromParams
              ? "Nobody is available under this category at the moment."
              : "Nothing matches the filters you've applied."}
          </p>
          <button
            type="button"
            className={styles.listStateBtn}
            onClick={() => {
              resetFilters();
              if (categoryFromParams || location.search || location.state?.selectedType) {
                // ASTROLOGERS_LIST, not ASTROLOGERS — the latter is
                // /talk-to-astrologer/expert/:name, a different screen entirely.
                navigate(PATH.privateRoutes.ASTROLOGERS_LIST.path, { replace: true, state: {} });
              }
            }}
          >
            Show all astrologers
          </button>
        </div>
      )}

      {/*
        The two states below did not exist. The empty state above requires
        `isFiltered`, so with no filter applied — which is how everyone arrives on
        this page — an empty list rendered nothing whatsoever: the header and the
        filter chips sitting above blank space, with no message, no explanation
        and nothing to press. A failed request looked exactly the same, because
        isError was never read.

        That is indistinguishable from a page still loading, so the only move left
        is to reload and hope, which is what the session recordings show: repeat
        visits and refreshes minutes apart with almost no clicks in between.

        Both are gated on an empty list, so a failure while paginating further
        down the list leaves the results already on screen alone.
      */}
      {/* Plain elements rather than <PrimaryText>: that component writes colour,
          size, weight and alignment into an inline style attribute, which
          outranks a CSS module class, so the styling below would not apply. */}
      {/*
        `(!isFetching || checking)` on both cards below, not `!isFetching`.

        A manual re-check flips `isFetching`, so the bare guard unmounted the very
        card whose button had just been pressed and replaced it with the spinner —
        the press appeared to do nothing but flash. Holding the card up while our
        own check runs keeps the screen still, and lets the button report progress
        and then the outcome. See `handleCheckAgain`.
      */}
      {isListError && !isFiltered && allAstrologers.length === 0 && (!isFetching || checking) && (
        <div className={styles.listStateCard}>
          <h2 className={styles.listStateTitle}>Couldn&apos;t load astrologers</h2>
          <p className={styles.listStateText}>
            The list didn&apos;t come through. This is usually a connection hiccup.
          </p>
          {/* Never `disabled` while checking — that swallows the tap. aria-busy
              states it, and handleCheckAgain ignores re-entry. */}
          <button
            type="button"
            className={styles.listStateBtn}
            onClick={handleCheckAgain}
            aria-busy={checking}
          >
            {checking ? "Trying…" : "Try again"}
          </button>
          {checkResult && !checking && (
            <p
              key={checkResult.seq}
              className={styles.listStateResult}
              role="status"
            >
              {checkResult.failed
                ? "Still couldn't reach the list — check your connection and try again."
                : "Reached the list, but nobody is online just yet."}
            </p>
          )}
        </div>
      )}

      {(!isFetching || checking) && !isFilterLoading && !isListError && allAstrologers.length === 0 && !isFiltered && (
        <div className={styles.listStateCard}>
          <h2 className={styles.listStateTitle}>No astrologers available right now</h2>
          <p className={styles.listStateText}>
            Everyone is offline at the moment. Try again in a few minutes, or ask
            Pandit AI in the meantime.
          </p>
          {/* See the note on the button above. */}
          <button
            type="button"
            className={styles.listStateBtn}
            onClick={handleCheckAgain}
            aria-busy={checking}
          >
            {checking ? "Checking…" : "Check again"}
          </button>
          {/* Outcome of the press, next to the button that caused it. Keyed on
              seq so a repeat check replays instead of rendering an identical
              string that reads as no response. */}
          {checkResult && !checking && (
            <p
              key={checkResult.seq}
              className={styles.listStateResult}
              role="status"
            >
              {checkResult.failed
                ? "Couldn't reach the list just now — check your connection and try again."
                : "Checked just now — everyone is still offline."}
            </p>
          )}
        </div>
      )}

      {/* The single loader for this list — covers both the base query and an
          in-flight filter request. See the note where the overlay used to be. */}
      {/* `!checking` so a manual re-check does not show this spinner as well as
          the button's own "Checking…" label. The card above stays put and the
          button reports for itself, which is the point — two competing progress
          signals for one press is what made the old behaviour read as a flash. */}
      <div ref={loadMoreRef} className={styles.loaderWrapper}>
        {((isFetching && !checking) || isFilterLoading) && (
          <PrimaryLoader isLoading={true} fullscreen={false} />
        )}
      </div>

      {!hasMore && allAstrologers.length > 0 && recommendedAstrologers.length > 0 && (
        <div className={styles.matchSection}>
          <h2 className={styles.matchTitle}>
            NOT SURE?
            <br />
            LET US MATCH YOU.
          </h2>

          {isLoadingRecommended ? (
            <div className={styles.loaderWrapper}>
              <PrimaryLoader fullscreen={false} />
            </div>
          ) : (
            <div className={styles.recommendedGrid}>
              {recommendedAstrologers.map((astro) => (
                <div key={astro._id} className={styles.notSureCard}>
                  {/* REPLACED: RecommendedAstrologerCard with NewAstrologerCard for consistency */}
                  {/* <RecommendedAstrologerCard
                    data={astro}
                    onConnect={() => {
                      setSelectedAstrologer(astro);
                      setIsConnectPopupOpen(true);
                      activeCallAstroRef.current = astro;
                    }}
                  /> */}
                  <NewAstrologerCard
                    astrologer={astro}
                    onConnect={handleConnectClick}
                    onEmergencyClick={(astrologer) => {
                      setSelectedAstrologer(astrologer);
                      setShowEmergencyModal(true);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <DetailsModal
        onClose={() => setOpenModal((prev) => ({ ...prev, details: false }))}
        isOpen={openModal.details}
        handleSubmit={handleSubmit}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={openModal.recharge}
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={selectedAstrologer}
        connectionType={pendingConnectionType || "chat"}
      />

      {/* Recharge modal from hook for popup flow */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
        astrologer={selectedAstrologer}
        connectionType={hookRechargeType || "chat"}
        requiredAmount={hookRechargeRequiredAmount}
        pricePerMinute={hookRechargePricePerMinute}
      />

      {/* Kundli modal - using ProfileModals like Home page */}
      {/* <ProfileModals
        showSelectProfile={hookOpenModal.kundli}
        showAddProfile={showAddProfile}
        showEditProfile={showEditProfile}
        profiles={profiles}
        selectedProfile={localSelectedProfile}
        formData={formData}
        editFormData={editFormData}
        isCreating={isCreating}
        onCloseSelect={() => {
          hookSetOpenModal((prev) => ({ ...prev, kundli: false }));
          setLocalSelectedProfile(null);
        }}
        onCloseAdd={() => setShowAddProfile(false)}
        onCloseEdit={() => setShowEditProfile(false)}
        onSelectProfile={handleProfileSelect}
        onAddProfile={handleAddProfile}
        onSubmitProfile={handleSubmitProfile}
        onSubmitEditProfile={handleSubmitEditProfile}
        setFormData={setFormData}
        setEditFormData={setEditFormData}
        formatProfileDisplay={formatProfileDisplay}
        showContinueButton={true}
        onContinue={handleContinueAfterKundliSelect}
      /> */}

      {/* Profile Manager - using startCallMode for profile selection */}
      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile"
        startCallModeBtnType={pendingConnectionType}
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={openModal.recharge}
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={selectedAstrologer}
        connectionType={pendingConnectionType || "chat"}
      />

      {/* Recharge modal from hook for popup flow */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() =>
          hookSetOpenModal((prev) => ({ ...prev, recharge: false }))
        }
        astrologer={selectedAstrologer}
        connectionType={hookRechargeType || "chat"}
        requiredAmount={hookRechargeRequiredAmount}
        pricePerMinute={hookRechargePricePerMinute}
      />

      {/* Recommend CTA temporarily hidden per request */}
      {false && showCTA && showRecommend && !recommendDismissed && (
        <RecommendCTA
          mode={isChatMode ? "chat" : "call"}
          onClick={() => {
            setOpen(true);
            setIsRecommendModalOpen(true);
            setShowRecommend(false);
            setRecommendDismissed(true);
            localStorage.setItem("recommend_cta_dismissed", "true");
          }}
          onClose={() => {
            setShowRecommend(false);
            setRecommendDismissed(true);
            localStorage.setItem("recommend_cta_dismissed", "true");
          }}
        />
      )}

      {open && (
        <RecommendModal
          open={open}
          setOpen={setOpen}
          onClose={() => {
            setOpen(false);
            setIsRecommendModalOpen(false);
          }}
          mode={isChatMode ? "chat" : "call"}
          onConnect={handleConnectClick}
        />
      )}

      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={selectedAstrologer}
        onChatStart={hookHandleChatStart}
        onCallStart={hookHandleCallStart}
        onEmergencyAvailable={() => {
          setIsConnectPopupOpen(false);
          setShowEmergencyModal(true);
        }}
      />

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={selectedAstrologer}
        onChatNow={(astro) => handleConnectClick(astro, "chat", true)}
        onCallNow={(astro) => handleConnectClick(astro, "audio", true)}
      />

      {/* Two-Way Accept: Stacked toast banners for secondary rings during active call */}
      {ringQueue.map((ring) => (
        <AstrologerRingModal
          key={ring.roomId}
          data={ring}
          onAccept={ring.type === "chat" ? handleUserAcceptChat : handleUserAcceptCall}
          onReject={ring.type === "chat" ? handleUserRejectChat : handleUserRejectCall}
          onTimeout={handleRingTimeout}
          variant="toast"
        />
      ))}

      {/* Guest call/video flow (AI Wow-style details + OTP, then initiate call) */}
      {guestConnectModal}
    </div>
  );
};

export default TalkToAstrologer;
