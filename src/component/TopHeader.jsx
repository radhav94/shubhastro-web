import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
import { ProfileManager } from "./UI/Profile";
import { setSelectedKundli, clearSelectedKundli } from "../redux/kundli/kundliSlice";
import { setSelectedKundliProfile } from "../redux/aiwow/aiwowSlice";
const TopHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const token = getToken();

  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Check if we're in iframe mode
  const isIframeMode = new URLSearchParams(window.location.search).get('iframe') === 'true';

  const userId = localStorage.getItem("shubhtalk_customer_id");   

  // Fetch kundli profiles for name fallback
  const { data: kundliData } = useGetAllKundlisQuery(userId, {
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

  // Fixed list of supported languages with English labels
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("English"); // default language name
  const langRef = useRef(null);

  // Close language dropdown on outside click (desktop + mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

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

    const currentLangCode = getCurrentLang();
    setSelectedLang(currentLangCode);
    
    // Update the displayed language name based on the current language code
    const currentLang = supportedLanguages.find(lang => lang.code === currentLangCode);
    if (currentLang) {
      setActiveLang(currentLang.name);
    }

    // Verify Google Translate widget is properly initialized
    // This helps ensure consistent behavior across environments
    const checkGoogleTranslateWidget = () => {
      const widget = document.querySelector('.goog-te-combo');
      if (widget && currentLangCode !== 'en') {
        // Ensure widget matches cookie
        if (widget.value !== currentLangCode) {
          widget.value = currentLangCode;
          widget.dispatchEvent(new Event('change'));
        }
      }
    };

    // Check after a short delay to allow Google Translate to initialize
    const timer = setTimeout(checkGoogleTranslateWidget, 500);
    
    return () => clearTimeout(timer);
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

  const handleKundliSelect = (profile) => {
    setKundliModalOpen(false);
    if (!profile?._id) return;
    dispatch(setSelectedKundli(profile));
    dispatch(setSelectedKundliProfile(profile));
    localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
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

    // If a kundli is selected from the header, show its initials
    if (selectedKundli?.name) {
      const nameParts = selectedKundli.name.split(" ");
      if (nameParts.length >= 2) {
        return getInitials(nameParts[0], nameParts[nameParts.length - 1]);
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // If user has registered name, show initials
    if (user?.firstName && user?.lastName) {
      return getInitials(user.firstName, user.lastName);
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // If primary kundli exists, show its initials
    if (savedKundlis.length > 0 && savedKundlis[0]?.name) {
      const nameParts = savedKundlis[0].name.split(" ");
      if (nameParts.length >= 2) {
        return getInitials(nameParts[0], nameParts[nameParts.length - 1]);
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Default: return empty (will show User icon)
    return "";
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

    // Clear Google Translate cookies completely - enhanced for production
    const clearCookies = () => {
      const hostname = window.location.hostname;
      const cookiesToClear = ['googtrans', 'googtrans_backup'];
      
      // Get all possible domain variations
      const domainParts = hostname.split('.');
      const domains = [''];
      
      // Add current domain
      domains.push(`domain=${hostname}`);
      
      // Add parent domains (e.g., .example.com for sub.example.com)
      if (domainParts.length > 1) {
        domains.push(`domain=.${hostname}`);
        
        // Also try parent domain if subdomain exists
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join('.');
          domains.push(`domain=.${parentDomain}`);
        }
      }

      // Clear cookies for all combinations
      cookiesToClear.forEach(cookieName => {
        domains.forEach(domainStr => {
          // Try both with and without path
          ['/', ''].forEach(path => {
            const pathStr = path ? `path=${path};` : '';
            const domainPart = domainStr ? `${domainStr};` : '';
            
            // Set multiple expiry formats for better compatibility
            document.cookie = `${cookieName}=; ${pathStr} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
            document.cookie = `${cookieName}=; ${pathStr} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
          });
        });
      });
    };

    // Set Google Translate cookie - enhanced for production
    const setCookie = (lang) => {
      const hostname = window.location.hostname;
      const cookieValue = `/en/${lang}`;
      const maxAge = 31536000; // 1 year

      // Set cookie for current domain
      document.cookie = `googtrans=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax;`;
      
      // Set for explicit domain
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}; max-age=${maxAge}; SameSite=Lax;`;
      
      // Set for parent domain if applicable
      const domainParts = hostname.split('.');
      if (domainParts.length > 1) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname}; max-age=${maxAge}; SameSite=Lax;`;
        
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join('.');
          document.cookie = `googtrans=${cookieValue}; path=/; domain=.${parentDomain}; max-age=${maxAge}; SameSite=Lax;`;
        }
      }
    };

    const currentLang = getCurrentLang();
    
    // Prevent unnecessary reload if already on target language
    if (currentLang === targetLang) {
      setOpen(false);
      return;
    }
    
    // Update selected language state and UI immediately
    setSelectedLang(targetLang);
    const selectedLanguage = supportedLanguages.find(lang => lang.code === targetLang);
    if (selectedLanguage) {
      setActiveLang(selectedLanguage.name);
    }

    // Close dropdown
    setOpen(false);

    // Clear all cookies first (for both English and other languages)
    clearCookies();

    // If switching to English, just reload after clearing cookies
    if (targetLang === 'en') {
      // Use a longer timeout to ensure cookies are cleared
      setTimeout(() => {
        window.location.reload();
      }, 200);
      return;
    }

    // For other languages, set cookie then reload
    setTimeout(() => {
      setCookie(targetLang);
      
      // Reload after setting cookie
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }, 200);
  };

  // If in iframe mode, show minimal header with only language and close button
  if (isIframeMode) {
    return (
      <header className={styles.iframeHeader}>
        <div className={styles.iframeHeaderContent}>
          {/* Language Dropdown */}
          <div className={styles.languageWrap}>
            <span
              className={styles.onHoverChangeLang}
              onClick={() => setOpen((prev) => !prev)}
            >
              <span className={styles.languageName}>{activeLang}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
                <path d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z" fill="url(#paint0_linear_9128_57)"/>
                <defs>
                  <linearGradient id="paint0_linear_9128_57" x1="0" y1="4" x2="13.5763" y2="4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F75801"/>
                    <stop offset="1" stopColor="#D43400"/>
                  </linearGradient>
                </defs>
              </svg>
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
                  className={`notranslate ${lang.code === selectedLang ? styles.activeLang : ''}`}
                  onClick={() => {
                    handleLanguageChange(lang.code);
                  }}
                >
                  {lang.name}
                  {lang.code === selectedLang && <span>✓</span>}
                </p>
              ))}
            </div>
          </div>

        </div>
      </header>
    );
  }

  return (
    <>
      <header className={styles.topHeader}>
        {/* <div className={styles.menuWrap}> */}
          <div className={styles.mainLeftMain}>
            <div
              className={styles.hamburger}
              onClick={() => setIsDrawerOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 24 16" fill="none">
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
              to="/shubhmall"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              ShubhMall
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
            <div className={styles.languageWrap} ref={langRef}>
              <span
                className={styles.onHoverChangeLang}
                onClick={() => setOpen((prev) => !prev)}
              >
                <span className={styles.languageName}>{activeLang}</span>

                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
                  <path d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z" fill="url(#paint0_linear_9128_57)"/>
                  <defs>
                    <linearGradient id="paint0_linear_9128_57" x1="0" y1="4" x2="13.5763" y2="4" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
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
                    className={`notranslate ${lang.code === selectedLang ? styles.activeLang : ''}`}
                    onClick={() => {
                      handleLanguageChange(lang.code);
                    }}
                  >
                    {lang.name}
                    {lang.code === selectedLang && <span>✓</span>}
                  </p>
                ))}
              </div>
            </div>
            {/* language end */}

            {/* <div className={styles.walletBadge}
              onClick={() => requireAuth() && navigate(PATH.privateRoutes.PROFILE.path)}
              style={{ cursor: 'pointer' }}
>
               <img src={headerCoin} className={styles.coinImg} alt="coin icon" />
              <span className={styles.walletAmount}>
                {formatAmount(
                  isFetchingBalance ? "..." : isLoggedIn ? balance || 0 : 0,
                )}
              </span>
            </div> */}
            <div className={styles.profileDetailMain}>
              {userAvatarDisplay ? (
                <div className={styles.avatarText} onClick={handleProfileClick}>
                  <span>{userAvatarDisplay}</span>
                </div>
              ) : (
                <div className={styles.profileIcon} onClick={handleProfileClick}>
                  <User size={20} strokeWidth={0} fill="#d53400"/>
                </div>
              )}
              {/* Kundli selector replaces greeting */}
              {!!token && (
                <span
                  className={styles.profileWrapName}
                  onClick={() => setKundliModalOpen(true)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.languageNamee}>
                    {selectedKundli?.name?.split(" ")[0] || displayName}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
                    <path d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z" fill="url(#paint0_linear_kundli_greeting)"/>
                    <defs>
                      <linearGradient id="paint0_linear_kundli_greeting" x1="0" y1="4" x2="13.5763" y2="4" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F75801"/>
                        <stop offset="1" stopColor="#D43400"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              )}
              {/* Original greeting block (commented out) */}
              {/* <div className={styles.greetingText}>
                <span className={styles.namaste}>नमस्ते</span>
                <span className={styles.userName}>{displayName}</span>
              </div> */}
            </div>
          </div>
        {/* </div> */}
      </header>

      <div className={styles.headerNavigationSubmenuWrap}>
        <nav className={styles.headerNavigationSubmenu}>
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
              ShubhMall
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
            <NavLink
              to="/panchang"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Panchang
            </NavLink>
            <NavLink
              to="/lal-kitab"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Lal Kitab
            </NavLink>
            <CalculatorsDropdown />
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
              to={PATH.privateRoutes.TAROT_CARD_V2.path}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Tarot
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
              to="/panchang"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Panchang
            </NavLink>
            <NavLink
              to="/lal-kitab"
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Lal Kitab
            </NavLink>
            <MobileCalculatorsAccordion onClose={() => setIsDrawerOpen(false)} />
            <NavLink
              to="/live"
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

      {/* Kundli Selection Modal */}
      <ProfileManager
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        title="Select Kundli"
        // startCallMode={true}
        // callModeBtnTitle="Select Kundli"
        // onStartCall={handleKundliSelect}
        onProfileSelect={handleKundliSelect}
        selectedProfileId={selectedKundli?._id}
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />
    </>
  );
};

export default TopHeader;

const CALCULATOR_LINKS = [
  { title: "Love Calculator", path: "/love-calculator" },
  { title: "Atmakaraka & Darakaraka", path: "/atmakaraka-and-darakaraka-calculator" },
  { title: "Numerology Calculator", path: "/name-numerology-calculator" },
  { title: "Sun Sign Calculator", path: "/sun-sign-calculator" },
  { title: "Rising Sign / Ascendant", path: "/rising-ascendant-sign-calculator" },
  { title: "Rashi Calculator", path: "/rashi-moon-sign-calculator" },
  { title: "Dasha Calculator", path: "/dasha-calculator" },
  { title: "Mangal Dosha Calculator", path: "/mangal-kuja-dosha-calculator" },
  { title: "Shani Sade Sati", path: "/shani-sade-sati-calculator" },
  { title: "Birth / Natal Chart", path: "/birth-natal-chart-calculator" },
  { title: "Kaal Sarp Dosh", path: "/kaal-sarp-dosh-calculator" },
  { title: "Flames Calculator", path: "/flames-calculator" },
  { title: "Lucky Vehicle Number", path: "/lucky-vehicle-number-calculator" },
  { title: "Friendship Calculator", path: "/friendship-calculator" },
  { title: "Age Calculator", path: "/age-calculator" },
  { title: "Mobile Numerology", path: "/mobile-number-numerology-calculator" },
  { title: "Destiny Number", path: "/destiny-number-calculator" },
];

const CalculatorsDropdown = () => {
  const navigate = useNavigate();
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
        Calculators
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none">
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </span>
      {open && (
        <div className={styles.calcDropdownMenu}>
          {CALCULATOR_LINKS.map((item) => (
            <div
              key={item.path}
              className={styles.calcDropdownItem}
              onClick={() => { navigate(item.path); setOpen(false); }}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileCalculatorsAccordion = ({ onClose }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.mobileCalcAccordion}>
      <div
        className={styles.headerNavLink}
        onClick={() => setExpanded((p) => !p)}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        Calculators
        <svg
          xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 14 8" fill="none"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M2.08 0.355L6.794 5.069L11.508 0.355C11.982-0.118 12.747-0.118 13.221 0.355C13.695 0.829 13.695 1.595 13.221 2.068L7.645 7.645C7.171 8.118 6.405 8.118 5.932 7.645L0.355 2.068C-0.118 1.595-0.118 0.829 0.355 0.355C0.829-0.106 1.607-0.118 2.08 0.355Z" fill="#2c1b0e"/>
        </svg>
      </div>
      {expanded && (
        <div className={styles.mobileCalcLinks}>
          {CALCULATOR_LINKS.map((item) => (
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
