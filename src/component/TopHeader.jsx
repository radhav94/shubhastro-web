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
  const token = getToken();

  const { balance, isFetching: isFetchingBalance } = useWalletBalance();

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isDrawerOpen]);

  /* sync user */
  useEffect(() => {
    const syncUser = () => {
      setUser(getUserFromStorage());
    };

    syncUser();
    window.addEventListener("auth-change", syncUser);
    return () => window.removeEventListener("auth-change", syncUser);
  }, []);

  const handleProfileClick = () => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    token ? navigate("/profile") : navigate("/login?skip=welcome");
  };

  const formatAmount = (amount) => {
    // Handle non-numeric values
    if (typeof amount !== 'number') {
      return `₹${amount}`;
    }

    // For amounts >= 1000, show in 'k' format
    if (amount >= 1000) {
      const kValue = amount / 1000;
      // Check if the k value has decimals
      return kValue % 1 === 0 
        ? `₹${kValue}k` 
        : `₹${kValue.toFixed(1)}k`;
    }

    // For amounts < 1000, check if it has decimals
    return amount % 1 === 0 
      ? `₹${amount}` 
      : `₹${amount.toFixed(2)}`;
  };

  const displayName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.phoneNumber || "Guest"
    : "Guest";

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
            to="/"
            className={({ isActive }) =>
              `${styles.headerNavLink} ${isActive ? styles.active : ""}`
            }
            end
          >
            Home
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
            Match Matching
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
          <div className={styles.walletBadge}>
            <div className={styles.coinIcon}></div>
            <span className={styles.walletAmount}>
              {formatAmount(isFetchingBalance ? "..." : balance || 0)}
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
