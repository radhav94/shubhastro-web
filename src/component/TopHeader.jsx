import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./TopHeader.module.scss";
import { PATH } from "../utils/routes/Paths";
import { User } from "lucide-react";
import { getUserFromStorage } from "../utils/authStorage";
import ShubhTalkLogo from "../assets/images/ShubhAstrologo.svg";
import ShubhTalkLogoMobile from "../assets/images/mobile-shubh-astro-logo.svg";
import { useWalletBalance } from "../screens/private/wallet/useWalletBalance";
import { getToken } from "../utils/token";

const TopHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const token = getToken();

  const {
    balance,
    isFetching: isFetchingBalance,
    refreshWallet,
  } = useWalletBalance();

  // Track if user is logged in to properly display wallet balance
  const isLoggedIn = !!user && !!token;

  // Fixed list of supported languages with English labels
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
    const token = localStorage.getItem("shubhtalk_customer_token");
    token ? navigate("/profile") : navigate("/login?skip=welcome");
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

  const displayName = user
    ? user.firstName
      ? user.firstName
      : user.phoneNumber || "Guest"
    : "Guest";

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
        <div className={styles.mainLeftMain}>
          <div
            className={styles.hamburger}
            onClick={() => setIsDrawerOpen(true)}
          >
            ☰
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
          <NavLink
            to="/blog"
            className={({ isActive }) =>
              `${styles.headerNavLink} ${isActive ? styles.active : ""}`
            }
          >
            Blogs
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
            to="/live-landing"
            className={({ isActive }) =>
              `${styles.headerNavLink} ${isActive ? styles.active : ""}`
            }
          >
            Live
          </NavLink>
        </nav>

        <div className={styles.headerActions}>
          <select
            className={`${styles.languageDropdown} notranslate`}
            onChange={(e) => handleLanguageChange(e.target.value)}
            value={selectedLang}
            translate="no"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="notranslate">
                {lang.name}
              </option>
            ))}
          </select>
          <div className={styles.walletBadge}>
            <div className={styles.coinIcon}></div>
            <span className={styles.walletAmount}>
              {formatAmount(
                isFetchingBalance ? "..." : isLoggedIn ? balance || 0 : 0,
              )}
            </span>
          </div>
          <div className={styles.profileIcon} onClick={handleProfileClick}>
            <User size={24} strokeWidth={0} fill="#d53400" />
          </div>
          <div className={styles.greetingText}>
            <span className={styles.namaste}>नमस्ते</span>
            <span className={styles.userName}>{displayName}</span>
          </div>
        </div>
      </header>

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
