import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import styles from "./TopHeader.module.scss";
import { PATH } from "../utils/routes/Paths";
import { User } from "lucide-react";
import { getUserFromStorage } from "../utils/authStorage";

const TopHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data on mount and when localStorage changes
    const userData = getUserFromStorage();
    setUser(userData);
  }, []);

  const handleProfileClick = () => {
    const userData = getUserFromStorage();
    const accessToken = localStorage.getItem("shubhtalk_customer_token");
    if (userData && accessToken) {
      navigate("/profile");
    } else {
      // User is not logged in, redirect to onboarding
      navigate("/onboarding?skip=welcome");
    }
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Guest";

  return (
    <header className={styles.topHeader}>
      <div className={styles.userGreeting}>
        <div className={styles.userAvatar}>
          <span>🐏</span>
        </div>
        <div className={styles.greetingText}>
          <span className={styles.namaste}>नमस्ते</span>
          <span className={styles.userName}>{displayName}</span>
        </div>
      </div>

      <div className={styles.headerActions}>
        <nav className={styles.headerNavigation}>
          {/* First Row */}
          <div className={styles.navRow}>
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
              to="/services"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Services
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
              to="/blogs"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Blogs
            </NavLink>
          </div>

          {/* Second Row */}
          <div className={styles.navRow}>
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
              to="/explore"
              className={({ isActive }) =>
                `${styles.headerNavLink} ${isActive ? styles.active : ""}`
              }
            >
              Explore
            </NavLink>
          </div>
        </nav>
        <div className={styles.walletBadge}>
          <div className={styles.coinIcon}></div>
          <span className={styles.walletAmount}>+ ₹120</span>
        </div>
        <div className={styles.profileIcon} onClick={handleProfileClick}>
          <User size={24} strokeWidth={0} fill="#A67C52" />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
