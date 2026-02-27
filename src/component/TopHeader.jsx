import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./TopHeader.module.scss";
import { PATH } from "../utils/routes/Paths";
import { User } from "lucide-react";
import { getUserFromStorage } from "../utils/authStorage";
import ShubhTalkLogo from "../assets/images/ShubhAstrologo.svg";
import ShubhTalkLogoMobile from "../assets/images/mobile-shubh-astro-logo.svg";
import headerCoin from "../assets/images/headerCoin.svg";
import { useWalletBalance } from "../screens/private/wallet/useWalletBalance";
import { getToken } from "../utils/token";
import { useGetAllKundlisQuery } from "../services/appServices/kundliServicesNew";
import useRequireAuth from "../utils/hooks/useRequireAuth"; 
const TopHeader = () => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const token = getToken();

  const userId = localStorage.getItem("shubhtalk_customer_id");   

  // Fetch kundli profiles for name fallback
  const { data: kundliData } = useGetAllKundlisQuery(userId, {
    skip: !userId || !token,
  });
  const savedKundlis = kundliData?.data || [];      


  const {
    balance,
    isFetching: isFetchingBalance,
    refreshWallet,
  } = useWalletBalance();

  // Track if user is logged in to properly display wallet balance
  const isLoggedIn = !!user && !!token;

  // Fixed list of supported languages with English labels
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("EN"); // default label

  const getAbbr = (code) => code.toUpperCase(); // "en" → "EN"

  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'ar', name: 'Arabic' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ms', name: 'Malay' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'pl', name: 'Polish' },
    { code: 'es', name: 'Spanish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
  ];

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isDrawerOpen]);

  /* Sync selected language with Google Translate cookie */
  useEffect(() => {
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    setSelectedLang(getCurrentLang());
  }, []);

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
    requireAuth() && navigate("/profile");
  };

  const formatAmount = (amount) => {
    // Handle non-numeric values
    if (typeof amount !== "number") {
      return `₹${amount}`;
    }

    // For amounts >= 1000, show in 'k' format
    if (amount >= 1000) {
      const kValue = amount / 1000;
      // Check if the k value has decimals
      return kValue % 1 === 0 ? `₹${kValue}k` : `₹${kValue.toFixed(1)}k`;
    }

    // For amounts < 1000, check if it has decimals
    return amount % 1 === 0 ? `₹${amount}` : `₹${amount.toFixed(2)}`;
  };

  const displayName = (() => {
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
        

  // Handle language change with Google Translate
  const handleLanguageChange = (targetLang) => {
    // Get current language from cookie
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    // Set Google Translate cookie
    const setCookie = (lang) => {
      const domain = window.location.hostname;
      const cookieValue = `/en/${lang}`;

      // Set cookie for all domain variations
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain}`;
      if (domain.split(".").length > 1) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${domain}`;
      }
    };

    const currentLang = getCurrentLang();
    
    // Update selected language state
    setSelectedLang(targetLang);

    // If re-selecting the same language, we need to force a refresh
    if (currentLang === targetLang) {
      // Set the cookie and reload the page to re-apply translation
      setCookie(targetLang);
      window.location.reload();
    } else {
      // Different language - set cookie and trigger widget
      setCookie(targetLang);

      const selectElement = document.querySelector(".goog-te-combo");
      if (selectElement) {
        selectElement.value = targetLang;
        selectElement.dispatchEvent(
          new Event("change", { bubbles: true, cancelable: true }),
        );
      } else {
        // If widget not found, reload to apply
        window.location.reload();
      }
    }
  };

  return (
    <>
      <header className={styles.topHeader}>
        {/* <div className={styles.menuWrap}> */}
          <div className={styles.mainLeftMain}>
            <div
              className={styles.hamburger}
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" fill="none">
                <path d="M1.33333 16H22.6667C23.4 16 24 15.4 24 14.6667C24 13.9333 23.4 13.3333 22.6667 13.3333H1.33333C0.6 13.3333 0 13.9333 0 14.6667C0 15.4 0.6 16 1.33333 16ZM1.33333 9.33333H22.6667C23.4 9.33333 24 8.73333 24 8C24 7.26667 23.4 6.66667 22.6667 6.66667H1.33333C0.6 6.66667 0 7.26667 0 8C0 8.73333 0.6 9.33333 1.33333 9.33333ZM0 1.33333C0 2.06667 0.6 2.66667 1.33333 2.66667H22.6667C23.4 2.66667 24 2.06667 24 1.33333C24 0.6 23.4 0 22.6667 0H1.33333C0.6 0 0 0.6 0 1.33333Z" fill="#030303"/>
              </svg>
            </div>

            <div className={styles.logoHeader} onClick={() => navigate("/")}>
              <img src={ShubhTalkLogo} alt="Shubh Talk Logo" />
            </div>

            <div
              className={styles.logoHeaderMobile}
              onClick={() => navigate("/")}
            >
              <img src={ShubhTalkLogoMobile} alt="Shubh Talk Logo" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.headerNavigation}>
            <NavLink
              to="/tarot"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Tarot
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink>
            <NavLink
              to="/chat-with-astrologers"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink>
            <NavLink
              to="/aiwow"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              AI WOW
            </NavLink>
            {/* <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blogs
            </NavLink> */}
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astromall
            </NavLink>
            <NavLink
              to={PATH.privateRoutes.KUNDLI.path}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Kundli
            </NavLink>
            {/* <NavLink
              to="/matchmaking"
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
              to="/horoscopes/daily-horoscope"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink> */}
            <NavLink
              to="/live-landing"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Live
            </NavLink>
          </nav>
              
          <div className={styles.headerActions}>

            {/* language start */}
            <div className={styles.languageWrap}>
              <span
                className={styles.onHoverChangeLang}
                onClick={() => setOpen((prev) => !prev)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9.99 0C4.47 0 0 4.48 0 10C0 15.52 4.47 20 9.99 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 9.99 0ZM16.92 6H13.97C13.65 4.75 13.19 3.55 12.59 2.44C14.43 3.07 15.96 4.35 16.92 6ZM10 2.04C10.83 3.24 11.48 4.57 11.91 6H8.09C8.52 4.57 9.17 3.24 10 2.04ZM2.26 12C2.1 11.36 2 10.69 2 10C2 9.31 2.1 8.64 2.26 8H5.64C5.56 8.66 5.5 9.32 5.5 10C5.5 10.68 5.56 11.34 5.64 12H2.26ZM3.08 14H6.03C6.35 15.25 6.81 16.45 7.41 17.56C5.57 16.93 4.04 15.66 3.08 14ZM6.03 6H3.08C4.04 4.34 5.57 3.07 7.41 2.44C6.81 3.55 6.35 4.75 6.03 6ZM10 17.96C9.17 16.76 8.52 15.43 8.09 14H11.91C11.48 15.43 10.83 16.76 10 17.96ZM12.34 12H7.66C7.57 11.34 7.5 10.68 7.5 10C7.5 9.32 7.57 8.65 7.66 8H12.34C12.43 8.65 12.5 9.32 12.5 10C12.5 10.68 12.43 11.34 12.34 12ZM12.59 17.56C13.19 16.45 13.65 15.25 13.97 14H16.92C15.96 15.65 14.43 16.93 12.59 17.56ZM14.36 12C14.44 11.34 14.5 10.68 14.5 10C14.5 9.32 14.44 8.66 14.36 8H17.74C17.9 8.64 18 9.31 18 10C18 10.69 17.9 11.36 17.74 12H14.36Z" fill="#424242"/>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" viewBox="0 0 14 8" fill="none">
                  <path d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z" fill="url(#paint0_linear_9128_57)"/>
                  <defs>
                    <linearGradient id="paint0_linear_9128_57" x1="0" y1="4" x2="13.5763" y2="4" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#F75801"/>
                      <stop offset="1" stop-color="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
                {/* {activeLang} */}
              </span>

              <div
                className={`${styles.languageDropdown} ${
                  open ? styles.open : styles.close
                } notranslate`}
                translate="no"
              >
                {supportedLanguages.map((lang) => (
                  <p
                    key={lang.code}
                    className="notranslate"
                    onClick={() => {
                      handleLanguageChange(lang.code);
                      setActiveLang(getAbbr(lang.code)); // 👈 set abbreviation
                      setOpen(false); // close with animation
                    }}
                  >
                    {lang.name}
                  </p>
                ))}
              </div>
            </div>
            {/* language end */}

            <div className={styles.walletBadge}
              onClick={() => requireAuth() && navigate(PATH.privateRoutes.PROFILE.path)}
              style={{ cursor: 'pointer' }}
>
               <img src={headerCoin} className={styles.coinImg} alt="coin icon" />
              <span className={styles.walletAmount}>
                {formatAmount(
                  isFetchingBalance ? "..." : isLoggedIn ? balance || 0 : 0,
                )}
              </span>
            </div>
            <div className={styles.profileDetailMain}>
              <div className={styles.profileIcon} onClick={handleProfileClick}>
                <User size={24} strokeWidth={0} fill="#d53400" />
              </div>
              <div className={styles.greetingText}>
                <span className={styles.namaste}>नमस्ते</span>
                <span className={styles.userName}>{displayName}</span>
              </div>
            </div>
          </div>
        {/* </div> */}
      </header>

      <div className={styles.headerNavigationSubmenuWrap}>
        <nav className={styles.headerNavigationSubmenu}>
                <span className={styles.quickNavText}>Quick Links 
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
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
              to="/chat-with-astrologers"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink> */}
            {/* <NavLink
              to="/aiwow"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              AI WOW
            </NavLink> */}
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blogs
            </NavLink>
            {/* <NavLink
              to="/explore"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink> */}
            {/* <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astromall
            </NavLink> */}
            {/* <NavLink
              to={PATH.privateRoutes.KUNDLI.path}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Kundli
            </NavLink> */}
            <NavLink
              to="/matchmaking"
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
              to="/horoscopes/daily-horoscope"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink>
            {/* <NavLink
              to="/live-landing"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Live
            </NavLink> */}
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
            <button
              className={styles.drawerClose}
              onClick={() => setIsDrawerOpen(false)}
            >
              ✕
            </button>

            <NavLink
              to="/"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/chat-with-astrologers"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Astrologers
            </NavLink>
            <NavLink
              to="/aiwow"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              AI WOW
            </NavLink>
            <NavLink
              to="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blogs
            </NavLink>
            <NavLink
              to="/explore"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink>
            <NavLink
              to={PATH.privateRoutes.KUNDLI.path}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Kundli
            </NavLink>
            <NavLink
              to="/matchmaking"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Match Matching
            </NavLink>
            <NavLink
              to="/numerology"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Numerology
            </NavLink>
            <NavLink
              to="/horoscopes/daily-horoscope"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Horoscopes
            </NavLink>
            <NavLink
              to="/live-landing"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Live
            </NavLink>
          </div>
        </>
      )}
    </>
  );
};

export default TopHeader;
