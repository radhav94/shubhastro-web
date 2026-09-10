import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "./TopHeader.module.scss";
import { PATH } from "../utils/routes/Paths";
import { User } from "lucide-react";
import { getUserFromStorage } from "../utils/authStorage";
import ShubhTalkLogo from "../assets/images/ShubhAstrologo.png";
import ShubhTalkLogoMobile from "../assets/images/mobile-shubh-astro-logo.png";
import headerCoin from "../assets/images/headerCoin.svg";
import profileIcon from "../assets/images/profile-icon.png";
import { useWalletBalance } from "../screens/private/wallet/useWalletBalance";
import { getToken } from "../utils/token";
import { useGetAllKundlisQuery } from "../services/appServices/kundliServicesNew";
import useRequireAuth from "../utils/hooks/useRequireAuth"; 
// Lazy: ProfileManager pulls AddProfileModal / EditProfileModal /
// GuestDetailsForm, all of which render DateTimePicker and therefore
// react-datepicker + date-fns. TopHeader is in the layout of every page, so that
// whole tree was parsed on every load for a modal that starts closed and most
// visitors never open. Mounted below only once kundliModalOpen flips true.
const ProfileManager = lazy(() =>
  import("./UI/Profile").then((m) => ({ default: m.ProfileManager })),
);
import { setSelectedKundli, clearSelectedKundli } from "../redux/kundli/kundliSlice";
import { setSelectedKundliProfile } from "../redux/aiwow/aiwowSlice";
import LanguageSelector from "./LanguageSelector";
import { isShubhMallEnabled } from "../utils/featureConfig";
import { trackEvent } from "../utils/analytics";
import { logout } from "../redux/auth/authSlice";
import { clearAllCalculatorData } from "../redux/calculator/calculatorSlice";
import { useLogoutUserMutation } from "../redux/api/userSession/userSessionApi";
import { privateRequestNew } from "../services/appServices/privateRequestNew";
import { Toast } from "./index";
import { useCall } from "../context/CallContext";
import { useChat } from "../context/ChatContext";
import { voiceSocket, clearCallSession, clearChatSession } from "../services/voiceSocketServices";
const TopHeader = () => {
  const navigate = useNavigate();
  const { pathname: currentPathname } = useLocation();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const profileDropdownRef = useRef(null);
  const [logoutUser] = useLogoutUserMutation();
  const token = getToken();

  const { activeCall, setActiveCall, resetCallFlow, stopTimer: stopCallTimer } = useCall();
  const { activeChat, setActiveChat, resetChatFlow, stopTimer: stopChatTimer } = useChat();

  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Check if we're in iframe mode
  const isIframeMode = new URLSearchParams(window.location.search).get('iframe') === 'true';

  const userId = localStorage.getItem("shubhtalk_customer_id");   

  // Fetch kundli profiles for name fallback
  const { data: kundliData } = useGetAllKundlisQuery(undefined, {
    skip: !userId || !token,
  });
  const savedKundlis = kundliData?.data || [];      

  // Auto-select first (self) profile after fresh login when no profile is selected
  useEffect(() => {
    if (token && savedKundlis.length > 0 && !selectedKundli) {
      const firstProfile = savedKundlis[0];
      if (firstProfile?._id) {
        dispatch(setSelectedKundli(firstProfile));
        dispatch(setSelectedKundliProfile(firstProfile));
        localStorage.setItem("selectedKundliProfile", JSON.stringify(firstProfile));
      }
    }
  }, [token, savedKundlis, selectedKundli, dispatch]);

  const {
    balance,
    isFetching: isFetchingBalance,
    refreshWallet,
  } = useWalletBalance();

  // Track if user is logged in to properly display wallet balance
  const isLoggedIn = !!user && !!token;

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isDrawerOpen]);

  /* sync user */
  useEffect(() => {
    const syncUser = () => {
      const currentUser = getUserFromStorage();
      setUser(currentUser);

      // Clear wallet balance on logout (when user becomes null/undefined)
      if (!currentUser) {
        // Clear the cached wallet balance from localStorage
        localStorage.removeItem("astro_wallet_balance");
      }

      // Refresh wallet balance when user changes (login/logout)
      refreshWallet();
    };

    syncUser();
    window.addEventListener("auth-change", syncUser);
    return () => window.removeEventListener("auth-change", syncUser);
  }, [refreshWallet]);

  const handleProfileClick = () => {
    if (!token) {
      navigate("/login?skip=welcome");
    } else {
      setProfileDropdownOpen((prev) => !prev);
    }
  };

  /*
   * Close the profile dropdown on an outside interaction.
   *
   * "pointerdown", not "mousedown": mousedown is a compatibility event that
   * touch browsers synthesise *after* the gesture finishes, and they suppress it
   * entirely for taps they decide to interpret themselves (double-tap-to-zoom,
   * a tap that begins a scroll/fling, a tap on another element that calls
   * preventDefault on the touch). On a phone that left the menu stuck open over
   * the page the visitor was trying to reach. pointerdown fires for mouse, touch
   * and pen alike, and fires immediately.
   *
   * Escape is handled here too — the menu is a real popup now (aria-expanded on
   * the trigger), so dismissing it from the keyboard is expected behaviour.
   */
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handlePointerOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setProfileDropdownOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // A route change with the menu still open (browser back, or a link inside a
  // page) would otherwise leave it floating over the new screen.
  useEffect(() => {
    setProfileDropdownOpen(false);
    setIsDrawerOpen(false);
  }, [currentPathname]);

  const endActiveSessions = () => {
    const userId = localStorage.getItem("shubhtalk_customer_id");

    if (activeCall?.roomId) {
      voiceSocket.emit("call:end", { roomId: activeCall.roomId, endedBy: "CUSTOMER", userId });
      stopCallTimer();
      resetCallFlow();
      setActiveCall(null);
      clearCallSession();
    }

    if (activeChat?.roomId) {
      voiceSocket.emit("chat:end", { roomId: activeChat.roomId, endedBy: "CUSTOMER", userId });
      stopChatTimer();
      resetChatFlow();
      setActiveChat(null);
      clearChatSession();
    }

    // Clear all persisted session state
    ["shubhtalk_active_call", "shubhtalk_call_timestamp", "shubhtalk_active_chat", "shubhtalk_chat_timestamp"]
      .forEach((key) => localStorage.removeItem(key));
    ["shubhtalk_call_seconds", "shubhtalk_chat_seconds"]
      .forEach((key) => sessionStorage.removeItem(key));

    if (voiceSocket.connected) voiceSocket.disconnect();
  };

  /*
   * The logo is a <Link to="/">, which is inert when the current route is
   * already "/" — no navigation, no repaint, nothing. Scroll to the top instead,
   * which is the conventional behaviour for a site logo and gives the tap a
   * visible result.
   *
   * Only plain left-clicks are intercepted: modified clicks (Cmd/Ctrl/Shift/Alt)
   * and middle-clicks must keep their native "open in a new tab/window"
   * behaviour, which is the reason this is an anchor rather than a handler in the
   * first place.
   *
   * KNOWN RESIDUE, deliberately not "fixed": on "/" while already at the top,
   * scrollTo(0) changes nothing, so Clarity still records the click as dead.
   * That is correct — the logo promises the homepage and the homepage is already
   * on screen at the top, so there is genuinely nothing to do. Every option for
   * making the metric go away (forcing a reload, navigating elsewhere, faking a
   * repaint) is worse for the user than a no-op.
   *
   * FOUR separate sessions have now been investigated down to this same point:
   *   - yh6bcf  Chrome mobile
   *   - 6b4q6o  Chrome desktop, logo at 00:02
   *   - 1ww075q Edge desktop, from Bing, logo at 00:04, left at 00:21
   * In every case the click lands within the first few seconds of arriving on
   * "/", i.e. necessarily still at scroll 0 — so the scroll branch could not have
   * produced a repaint either, and the report is accurate: nothing happened,
   * because there is nothing to do.
   *
   * ACTION REQUIRED IS NOT IN THIS FILE. Either exclude this element in the
   * Clarity dashboard (dead-click exclusion is dashboard-side; it cannot be set
   * from application code), or ship the branch — note that `handleLogoClick` is
   * NOT in origin/production, so the deployed logo is inert from ANY scroll
   * offset, not just from the top. Every further session that reports this
   * element will arrive back at this comment.
   *
   * Navigation from any other route is fine and is not this case: ScrollToTop
   * handles PUSH by scrolling to 0 instantly, so the page visibly changes.
   */
  const handleLogoClick = (e) => {
    if (currentPathname !== "/") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /*
   * Drawer links, same problem as the logo. Tapping the row for the route you
   * are already on closes the drawer and reveals the identical screen at the
   * identical scroll offset, so the only thing that happened is that the menu
   * you opened went away — indistinguishable from a mis-tap. Reading href off
   * currentTarget rather than threading the path through every call site keeps
   * this to one handler for all fourteen rows.
   */
  const handleDrawerNavClick = (e) => {
    setIsDrawerOpen(false);
    if (e.currentTarget.getAttribute("href") === currentPathname) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /*
   * Desktop nav links — the same same-URL problem as the logo and the drawer
   * rows, and the one place in this header where it was never handled.
   *
   * A NavLink pointing at the route you are already on performs no navigation:
   * react-router short-circuits it, so there is no repaint, no scroll and no
   * feedback of any kind.
   *
   * Clarity 1e75ar2 (Sep 10, Chrome PC, 4 clicks / 2 pages): arrived on
   * /numerology at 00:01 from an astrologer profile, clicked the "Numerology"
   * link in the Quick Links row repeatedly at 00:04, then hid the page at 00:06
   * and never came back. The main-nav Numerology link is commented out, so the
   * element was the submenu one.
   *
   * Delegated on the <nav> rather than added to each link, for the reason already
   * given for the drawer: one handler covers every row in both the main nav and
   * the Quick Links submenu, including any added later. CalculatorsDropdown's
   * toggle is a <button>, so `closest("a[href]")` misses it and it is unaffected.
   *
   * Why the toast branch exists. Scroll-to-top alone would NOT have answered this
   * session, and the logo comment above already worked out why: the click lands a
   * few seconds after arriving, so the page is necessarily still at scroll 0 and
   * scrollTo(0) repaints nothing. So scroll when there is somewhere to scroll to,
   * and otherwise say plainly that this is already the current page. Same shape
   * as BlogHeader's applyParams, which acknowledges same-URL taps with a toast
   * plus scroll-to-top. The label is read off the link, so this stays correct for
   * every row without a lookup table.
   *
   * A toast is used rather than an inline role="status" node because there is
   * nowhere in a single-line nav to put one without shifting the header layout.
   * The point here is to stop the user re-clicking, and they can see a toast.
   *
   * This is a different fix from the .active/:hover split in
   * TopHeader.module.scss (session khu0xq). That made "you are already here"
   * legible; it did not give the tap a result. Both are needed.
   *
   * Modified and middle clicks are left alone so "open in a new tab" keeps
   * working — same reasoning as handleLogoClick.
   */
  const handleNavAreaClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const link = e.target.closest("a[href]");
    if (!link || !e.currentTarget.contains(link)) return;
    if (link.getAttribute("href") !== currentPathname) return;

    e.preventDefault();

    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const label = link.textContent.trim();
    Toast.info(label ? `You're already on ${label}.` : "You're already on this page.");
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    endActiveSessions();

    try {
      await logoutUser({ deviceType: "web" }).unwrap();
    } catch (err) {
      console.error("Logout API error:", err);
    }

    dispatch(logout());
    dispatch(clearSelectedKundli());
    dispatch(clearAllCalculatorData());
    dispatch(privateRequestNew.util.resetApiState());

    ["shubhtalk_customer_token", "shubhtalk_customer_id", "shubhtalk_user", "selectedKundliProfile", "astro_wallet_balance"]
      .forEach((key) => localStorage.removeItem(key));

    window.dispatchEvent(new Event("auth-change"));
    Toast.success("Logged out successfully");
    navigate("/");
  };

  const handleKundliSelect = (profile) => {
    setKundliModalOpen(false);
    if (!profile?._id) return;
    dispatch(setSelectedKundli(profile));
    dispatch(setSelectedKundliProfile(profile));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
    trackEvent("profile_switched", { switched_to_profile_id: profile._id });
  };

  // The badge is only rendered for logged-in users, so `requireAuth()` returning
  // falsy here means the session expired. Send the user somewhere instead of
  // swallowing the tap.
  const handleWalletClick = () => {
    if (!requireAuth()) return;
    navigate(PATH.privateRoutes.RECHARGE.path);
  };

  const formatAmount = (amount) => {
    // Handle non-numeric values
    if (typeof amount !== "number") {
      return `₹${amount}`;
    }

    // For amounts >= 1000, show in 'k' format
    if (amount >= 1000) {
      const kValue = Math.floor(amount / 100) / 10;
      return kValue % 1 === 0 ? `₹${kValue}k` : `₹${kValue}k`;
    }

    // For amounts < 1000, check if it has decimals
    return amount % 1 === 0 ? `₹${amount}` : `₹${amount.toFixed(2)}`;
  };

  const displayName = (() => {
    // If not logged in, always show Guest
    if (!token) return "Guest";

    // Top priority: selected Kundli first name
    if (selectedKundli?.name) return selectedKundli.name.split(" ")[0];
    
    // First priority: User's registered firstName
    if (user?.firstName) return user.firstName;
    
    // Second priority: First name from first Kundli
    if (savedKundlis.length > 0 && savedKundlis[0]?.name) {
      return savedKundlis[0].name.split(" ")[0]; // First name only
    }
    
    // Third priority: Phone number
    if (user?.phoneNumber) return user.phoneNumber;
    
    // Last resort
    return "Guest";
  })();

  // Get initials for avatar (first letter of first name + first letter of last name)
  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return "";
  };

  // Get user avatar display (initials or icon)
  const userAvatarDisplay = (() => {
    // Only show initials if user is logged in (has token)
    if (!token) {
      return "";
    }

    // If a kundli is selected from the header, show its first char
    if (selectedKundli?.name) {
      return selectedKundli.name.charAt(0).toUpperCase();
    }
    
    // If user has registered name, show first char of first name
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // If primary kundli exists, show its first char
    if (savedKundlis.length > 0 && savedKundlis[0]?.name) {
      return savedKundlis[0].name.charAt(0).toUpperCase();
    }
    
    // Default: return empty (will show User icon)
    return "";
  })();
        

  // If in iframe mode, show minimal header with only language and close button
  if (isIframeMode) {
    return (
      null
      // <header className={styles.iframeHeader}>
      //   <div className={styles.iframeHeaderContent}>
      //     Language Dropdown
      //     <LanguageSelector style={{ position: 'relative', top: 'auto', right: 'auto' }} />
      //   </div>
      // </header>
    );
  }

  return (
    <>
    <div className={styles.topHeaderBg}>
      <header className={styles.topHeader}>
        {/* <div className={styles.menuWrap}> */}
          <div className={styles.mainLeftMain}>
            {/* Real <button>, and the icon is 20x16 so the box needs padding to
                reach a thumb-sized target — see .hamburger, which now carries an
                explicit 44x44 minimum. As a bare <div> wrapping the svg it was
                20px wide, which is the primary navigation control on every
                phone-width page. */}
            <button
              type="button"
              className={styles.hamburger}
              onClick={() => { setIsDrawerOpen(true); setActiveAccordion(null); }}
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
                <path d="M1.33333 16H22.6667C23.4 16 24 15.4 24 14.6667C24 13.9333 23.4 13.3333 22.6667 13.3333H1.33333C0.6 13.3333 0 13.9333 0 14.6667C0 15.4 0.6 16 1.33333 16ZM1.33333 9.33333H22.6667C23.4 9.33333 24 8.73333 24 8C24 7.26667 23.4 6.66667 22.6667 6.66667H1.33333C0.6 6.66667 0 7.26667 0 8C0 8.73333 0.6 9.33333 1.33333 9.33333ZM0 1.33333C0 2.06667 0.6 2.66667 1.33333 2.66667H22.6667C23.4 2.66667 24 2.06667 24 1.33333C24 0.6 23.4 0 22.6667 0H1.33333C0.6 0 0 0.6 0 1.33333Z" fill="#030303"/>
              </svg>
            </button>

            {/* Real anchors, not click-handled divs: the logo advertises itself as
                clickable (cursor: pointer) so it must also support middle-click,
                Cmd/Ctrl-click, keyboard Enter and "open in new tab".

                handleLogoClick covers the one case where this Link does nothing:
                clicking it while already on "/". React Router treats a Link to
                the current path as a no-op, so on the homepage the most
                prominent, most obviously clickable element in the header was
                completely inert. Scrolling back to the top is what a site logo
                is expected to do there, and it makes the click visible. */}
            {/* aria-current="page" when this link points at the route already
                on screen. It does not and should not make the click "do"
                anything — see handleLogoClick for why inventing a response is
                the wrong trade — but "you are already here" is a real fact that
                was not being communicated to assistive tech at all. */}
            <Link
              to="/"
              className={styles.logoHeader}
              aria-label="ShubhAstro home"
              aria-current={currentPathname === "/" ? "page" : undefined}
              onClick={handleLogoClick}
            >
              <img src={ShubhTalkLogo} alt="Shubh Talk Logo" width="150" height="27" />
            </Link>

            <Link
              to="/"
              className={styles.logoHeaderMobile}
              aria-label="ShubhAstro home"
              aria-current={currentPathname === "/" ? "page" : undefined}
              onClick={handleLogoClick}
            >
              <img src={ShubhTalkLogoMobile} alt="Shubh Talk Logo" width="32" height="32" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.headerNavigation} onClick={handleNavAreaClick}>
            <NavLink
              to="/tarot"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Tarot
            </NavLink>
            {/* <NavLink
              to="/explore"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink> */}
            <NavLink
              to="/astrologers"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink>
            <NavLink
              to="/ai-wow"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Shubh AI
            </NavLink>
            {/* <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blogs
            </NavLink> */}
            {isShubhMallEnabled() && (
              <NavLink
                to="/shubh-mall"
                className={({ isActive }) =>
                  `${styles.headerNavLink} ${isActive ? styles.active : ""}`
                }
              >
                ShubhMall
              </NavLink>
            )}
            <NavLink
              to={PATH.privateRoutes.KUNDLI.path}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Kundli
            </NavLink>
            {/* <NavLink
              to="/match-making"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Match Making
            </NavLink> */}
            {/* <NavLink
              to="/numerology"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Numerology
            </NavLink> */}
            {/* <NavLink
              to="/daily-horoscope"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink> */}
            <NavLink
              to="/live"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Live
            </NavLink>
          </nav>
              
          <div className={styles.headerActions}>

            {/* language start */}
            {/* <LanguageSelector style={{ position: 'relative', top: 'auto', right: 'auto' }} /> */}
            {/* language end */}

            {isLoggedIn && (
              <div className={styles.walletBadge}
                onClick={handleWalletClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleWalletClick();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Wallet balance - tap to recharge"
              >
                <img src={headerCoin} className={styles.coinImg} alt="coin icon" width="20" height="20" />
                <span className={styles.walletAmount}>
                  {formatAmount(isFetchingBalance ? "..." : balance || 0)}
                </span>
              </div>
            )}
            {/* The chip is the account entry point on every page, and it used to
                be a <div onClick> that also *contained* the dropdown. Two
                consequences:

                  - No keyboard or assistive-tech access, and nothing announced
                    that a menu was attached, so every item behind it was
                    unreachable without a pointer.
                  - Because the menu was a descendant, each item needed
                    stopPropagation to avoid re-triggering the toggle that had
                    just opened it. Easy to forget on the next item added.

                Now: a positioned wrapper holds a real <button> trigger and the
                menu as its sibling. On phones .profileName is display:none, so
                the visible label is a single initial — hence the explicit
                aria-label, otherwise the accessible name was the letter "N".

                See .profileDetailMain in the stylesheet for the tap-target size;
                at 767px the chip measured 55x36, and the 12px flex gap next to
                it belonged to no control at all. */}
            <div className={styles.profileDetailWrap} ref={profileDropdownRef}>
              <button
                type="button"
                className={styles.profileDetailMain}
                onClick={handleProfileClick}
                aria-haspopup={token ? "menu" : undefined}
                aria-expanded={token ? profileDropdownOpen : undefined}
                aria-label={token ? `Account menu for ${displayName}` : "Log in"}
              >
                {userAvatarDisplay ? (
                  <span className={`${styles.avatarText} notranslate`} aria-hidden="true">
                    <span>{userAvatarDisplay}</span>
                  </span>
                ) : (
                  <span className={styles.profileIcon}>
                    <User size={20} strokeWidth={0} fill="#d53400"/>
                  </span>
                )}
                {token && <span className={`${styles.profileName} notranslate`}>{displayName}</span>}
                {token && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none" aria-hidden="true" style={{ marginRight: '4px', flexShrink: 0 }}>
                    <path d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z" fill="url(#paint0_linear_profile_dd)"/>
                    <defs>
                      <linearGradient id="paint0_linear_profile_dd" x1="0" y1="4" x2="13.5763" y2="4" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F75801"/>
                        <stop offset="1" stopColor="#D43400"/>
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && !!token && (
                <div className={styles.profileDropdown} role="menu" aria-label="Account menu">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.profileDropdownItem}
                    onClick={() => { setProfileDropdownOpen(false); setKundliModalOpen(true); }}
                  >
                    Manage Profile
                  </button>
                  <div className={styles.profileDropdownDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.profileDropdownItem}
                    onClick={() => { setProfileDropdownOpen(false); navigate("/manage-devices"); }}
                  >
                    Manage Devices
                  </button>
                  <div className={styles.profileDropdownDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.profileDropdownItem}
                    onClick={() => { setProfileDropdownOpen(false); navigate("/profile"); }}
                  >
                    My Account
                  </button>
                  <div className={styles.profileDropdownDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.profileDropdownItem}
                    onClick={() => { setProfileDropdownOpen(false); navigate("/ai-wow", { state: { tab: "results" } }); }}
                  >
                    Manage Reports
                  </button>
                  <div className={styles.profileDropdownDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.profileDropdownItem} ${styles.profileDropdownLogout}`}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        {/* </div> */}
      </header>
    </div>
      <div className={styles.headerNavigationSubmenuWrap}>
        <nav className={styles.headerNavigationSubmenu} onClick={handleNavAreaClick}>
                <span className={styles.quickNavText}>Quick Links 
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
                </span>
            {/* <NavLink
              to="/tarot"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Tarot
            </NavLink> */}
            {/* <NavLink
              to="/astrologers"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink> */}
            {/* <NavLink
              to="/ai-wow"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Shubh AI
            </NavLink> */}
            <NavLink
              to="/match-making"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Match Making
            </NavLink>
            <NavLink
              to="/numerology"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Numerology
            </NavLink>
            <NavLink
              to="/daily-horoscope"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink>
            <NavLink
              to="/panchang"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Panchang
            </NavLink>
            <NavLink
              to="/laal-kitab"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Laal Kitab
            </NavLink>
            <NavLink
              to="/occult"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Occult
            </NavLink>
            <CalculatorsDropdown />
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blog
            </NavLink>
          </nav>
        </div>

      {/* 📱 Mobile Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className={styles.mobileDrawer}>
            {/* <button
              className={styles.drawerClose}
              onClick={() => setIsDrawerOpen(false)}
            >
              ✕
            </button> */}

            <button
              type="button"
              className={styles.menuProfileTop}
              onClick={() => {
                setIsDrawerOpen(false);
                if (token) {
                  navigate("/profile");
                } else {
                  navigate("/login?skip=welcome");
                }
              }}
              aria-label={token ? "My account" : "Log in"}
            >
              <span className={`${styles.menuProfilePik} notranslate`} aria-hidden="true">
                  {userAvatarDisplay || <User size={18} strokeWidth={0} fill="#d53400"/>}
              </span>
              <span className={`${styles.menuProfileNameMobile} notranslate`}>
                <span className={styles.menuProfileNameText}>{displayName}</span>
                {token && user?.phoneNumber && (
                  <span className={styles.menuProfilePhoneText}>+{user.phoneNumber}</span>
                )}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="15" viewBox="0 0 8 15" fill="none" aria-hidden="true">
                <path d="M0.75 13.95L6.18333 8.51667C6.825 7.875 6.825 6.825 6.18333 6.18333L0.75 0.75" stroke="url(#paint0_linear_15704_10971)" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="paint0_linear_15704_10971" x1="0.75" y1="7.35" x2="6.66458" y2="7.35" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>

            <NavLink
              to="/"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/astrologers"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink>
            <NavLink
              to="/ai-wow"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Shubh AI
            </NavLink>
            {isShubhMallEnabled() && (
              <NavLink
                to="/shubh-mall"
                onClick={handleDrawerNavClick}
                className={({ isActive }) =>
                  `${styles.headerNavLink} ${isActive ? styles.active : ""}`
                }
              >
                ShubhMall
              </NavLink>
            )}
            {/* <NavLink
              to="/explore"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink> */}
            <NavLink
              to={PATH.privateRoutes.KUNDLI.path}
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Kundli
            </NavLink>
            <NavLink
              to={PATH.privateRoutes.TAROT_CARD_V2.path}
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Tarot
            </NavLink>
            <NavLink
              to="/match-making"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Match Matching
            </NavLink>
            <NavLink
              to="/numerology"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Numerology
            </NavLink>
            <NavLink
              to="/daily-horoscope"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink>
            <NavLink
              to="/panchang"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Panchang
            </NavLink>
            <NavLink
              to="/laal-kitab"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Laal Kitab
            </NavLink>
            <NavLink
              to="/occult"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Occult
            </NavLink>
            <MobileCalculatorsAccordion onClose={() => setIsDrawerOpen(false)} isExpanded={activeAccordion === 'calculators'} onToggle={() => setActiveAccordion(prev => prev === 'calculators' ? null : 'calculators')} />
            <NavLink
              to="/blog"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blog
            </NavLink>
            <NavLink
              to="/live"
              onClick={handleDrawerNavClick}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Live
            </NavLink>
          </div>
        </>
      )}

      {/* Kundli Selection Modal — only mounted once opened, so the lazy chunk is
          fetched on the click rather than on every page load. */}
      {kundliModalOpen && (
        <Suspense fallback={null}>
          <ProfileManager
            isOpen={kundliModalOpen}
            onClose={() => setKundliModalOpen(false)}
            title="Select Profile"
            onProfileSelect={handleKundliSelect}
            selectedProfileId={selectedKundli?._id}
            enabledOperations={{
              list: true,
              add: true,
              edit: true,
              delete: true,
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default TopHeader;

const CALCULATOR_LINKS = [
  { title: "Love Calculator", path: "/love-calculator" },
  { title: "Atmakaraka & Darakaraka", path: "/atmakaraka-and-darakaraka-calculator" },
  { title: "Numerology Calculator", path: "/numerology-calculator" },
  { title: "Sun Sign Calculator", path: "/sun-sign-calculator" },
  { title: "Rising Sign / Ascendant", path: "/rising-ascendant-sign-calculator" },
  { title: "Rashi Calculator", path: "/rashi-calculator" },
  { title: "Dasha Calculator", path: "/dasha-calculator" },
  { title: "Mangal Dosha Calculator", path: "/mangal-dasha-calculator" },
  { title: "Shani Sade Sati", path: "/shani-sade-sati-calculator" },
  { title: "Birth / Natal Chart", path: "/birth-natal-chart-calculator" },
  { title: "Kaal Sarp Dosh", path: "/kaal-sarpa-dosh-calculator" },
  { title: "Flames Calculator", path: "/flames-calculator" },
  { title: "Lucky Vehicle Number", path: "/lucky-vehicle-number-calculator" },
  { title: "Friendship Calculator", path: "/friendship-calculator" },
  { title: "Age Calculator", path: "/age-calculator" },
  { title: "Mobile Numerology", path: "/mobile-number-numerology-calculator" },
  { title: "Destiny Number", path: "/destiny-number-calculator" },
  { title: "Mulank Calculator", path: "/mulank-calculator" },
  { title: "Name Compatibility", path: "/name-compatibility-calculator" },
  { title: "Lo Shu Grid", path: "/lo-shu-grid-calculator" },
  { title: "Lucky Name Numerology", path: "/lucky-name-numerology-calculator" },
];

const CalculatorsDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className={styles.calcDropdownWrap}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.headerNavLink}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-controls="calculators-dropdown"
        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        Calculators
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none" aria-hidden="true">
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </button>
      {open && (
        <div className={styles.calcDropdownMenu} id="calculators-dropdown">
          {CALCULATOR_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.calcDropdownItem} ${pathname.startsWith(item.path) ? styles.calcDropdownItemActive : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileCalculatorsAccordion = ({ onClose, isExpanded, onToggle }) => {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!isExpanded) return;

    // Reveal the panel we just opened.
    //
    // The 21 links render *below* the trigger, inside .mobileDrawer — which is
    // the scroll container (height: 100%; overflow: auto). "Calculators" is the
    // 12th row in the drawer, so on a phone it already sits at or below the
    // fold; in an in-app browser it is worse, because Instagram's own chrome
    // eats viewport height. Expanding therefore inserted ~600px of links
    // entirely off-screen with no scroll, leaving a 10x6px chevron rotation as
    // the only visible feedback. Clarity logged the tap as a dead click and the
    // visitor left the page ten seconds later.
    const frame = requestAnimationFrame(() => {
      wrapRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [isExpanded]);

  return (
    <div className={styles.mobileCalcAccordion} ref={wrapRef}>
      <button
        type="button"
        className={styles.headerNavLink}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="mobile-calculators-panel"
      >
        Calculators
        <svg
          xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none" aria-hidden="true"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </button>
      {isExpanded && (
        <div className={styles.mobileCalcLinks} id="mobile-calculators-panel">
          {/* Real anchors, matching the desktop CalculatorsDropdown. These were
              <div onClick={navigate}>, so they were invisible to the keyboard,
              to assistive tech and to crawlers, and could not be opened in a new
              tab — on 21 indexable calculator pages. */}
          {CALCULATOR_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={styles.mobileCalcLink}
              onClick={onClose}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const BEST_ASTROLOGERS_LINKS = [
  { title: "Astrologers in Mumbai", path: "/astrologers/mumbai" },
  { title: "Astrologers in Delhi", path: "/astrologers/delhi" },
  { title: "Astrologers in Chennai", path: "/astrologers/chennai" },
  { title: "Astrologers in Kolkata", path: "/astrologers/kolkata" },
  { title: "Astrologers in Hyderabad", path: "/astrologers/hyderabad" },
  { title: "Astrologers in Bangalore", path: "/astrologers/bangalore" },
  { title: "Astrologers in Lucknow", path: "/astrologers/lucknow" },
  { title: "Astrologers in Bhopal", path: "/astrologers/bhopal" },
  { title: "Astrologers in Cochin", path: "/astrologers/cochin" },
  { title: "Astrologers in Pune", path: "/astrologers/pune" },
  { title: "Astrologers in Gurgaon", path: "/astrologers/gurgaon" },
  { title: "Astrologers in Noida", path: "/astrologers/noida" },
  { title: "Astrologers in Chandigarh", path: "/astrologers/chandigarh" },
  { title: "Astrologers in Jaipur", path: "/astrologers/jaipur" },
  { title: "Astrologers in Nagpur", path: "/astrologers/nagpur" },
  { title: "Astrologers in Patna", path: "/astrologers/patna" },
  { title: "Astrologers in Indore", path: "/astrologers/indore" },
  { title: "Astrologers in Varanasi", path: "/astrologers/varanasi" },
  { title: "Astrologers in Coimbatore", path: "/astrologers/coimbatore" },
  { title: "Astrologers in Vijayawada", path: "/astrologers/vijaywada" },
];

const BestAstrologersDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className={styles.calcDropdownWrap}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={styles.headerNavLink}
        onClick={() => setOpen((p) => !p)}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        Best Astrologers India
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </span>
      {open && (
        <div className={styles.calcDropdownMenu}>
          {BEST_ASTROLOGERS_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={styles.calcDropdownItem}
              onClick={() => setOpen(false)}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileBestAstrologersAccordion = ({ onClose, isExpanded, onToggle }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.mobileCalcAccordion}>
      <div
        className={styles.headerNavLink}
        onClick={onToggle}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        Best Astrologers India
        <svg
          xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </div>
      {isExpanded && (
        <div className={styles.mobileCalcLinks}>
          {BEST_ASTROLOGERS_LINKS.map((item) => (
            <div
              key={item.path}
              className={styles.mobileCalcLink}
              onClick={() => { navigate(item.path); onClose(); }}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BEST_ASTROLOGERS_GLOBAL_LINKS = [
  { title: "Astrologers in USA", path: "/astrologers/usa" },
  { title: "Astrologers in Canada", path: "/astrologers/canada" },
  { title: "Astrologers in UK", path: "/astrologers/uk" },
  { title: "Astrologers in Dubai", path: "/astrologers/dubai" },
  { title: "Astrologers in Singapore", path: "/astrologers/singapore" },
  { title: "Astrologers in Sharjah", path: "/astrologers/sharjah" },
  { title: "Astrologers in California", path: "/astrologers/california" },
  { title: "Astrologers in Chicago", path: "/astrologers/chicago" },
  { title: "Astrologers in Dallas", path: "/astrologers/dallas" },
  { title: "Astrologers in New Jersey", path: "/astrologers/new-jersey" },
  { title: "Astrologers in Toronto", path: "/astrologers/toronto" },
  { title: "Astrologers in Abu Dhabi", path: "/astrologers/abu-dhabi" },
  { title: "Astrologers in Doha", path: "/astrologers/doha" },
  { title: "Astrologers in Riyadh", path: "/astrologers/riyadh" },
  { title: "Astrologers in London", path: "/astrologers/london" },
  { title: "Astrologers in Sydney", path: "/astrologers/sydney" },
  { title: "Astrologers in Kuala Lumpur", path: "/astrologers/kuala-lampur" },
];

const BestAstrologersGlobalDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className={styles.calcDropdownWrap}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={styles.headerNavLink}
        onClick={() => setOpen((p) => !p)}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        Best Astrologers Global
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </span>
      {open && (
        <div className={styles.calcDropdownMenu}>
          {BEST_ASTROLOGERS_GLOBAL_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={styles.calcDropdownItem}
              onClick={() => setOpen(false)}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileBestAstrologersGlobalAccordion = ({ onClose, isExpanded, onToggle }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.mobileCalcAccordion}>
      <div
        className={styles.headerNavLink}
        onClick={onToggle}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        Best Astrologers Global
        <svg
          xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </div>
      {isExpanded && (
        <div className={styles.mobileCalcLinks}>
          {BEST_ASTROLOGERS_GLOBAL_LINKS.map((item) => (
            <div
              key={item.path}
              className={styles.mobileCalcLink}
              onClick={() => { navigate(item.path); onClose(); }}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
