import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./TopHeader.module.scss";
import { PATH } from "../utils/routes/Paths";
import { User } from "lucide-react";
import { getUserFromStorage } from "../utils/authStorage";
import ShubhTalkLogo from "../assets/images/ShubhAstrologo.svg";
import ShubhTalkLogoMobile from "../assets/images/mobile-shubh-astro-logo.svg";

const TopHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const formatAmount = (amount) =>
    amount >= 1000 ? `₹${(amount / 1000).toFixed(1)}k` : `₹${amount}`;

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
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

          <div className={styles.logoHeader}>
            <img src={ShubhTalkLogo} alt="Shubh Talk Logo" />
          </div>

          <div className={styles.logoHeaderMobile}>
            <img src={ShubhTalkLogoMobile} alt="Shubh Talk Logo" />
          </div>
        </div>


        {/* Desktop Navigation */}
        <nav className={styles.headerNavigation}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/chat-with-astrologers">Astrologers</NavLink>
          <NavLink to="/aiwow">AI WOW</NavLink>
          <NavLink to="/blogs">Blogs</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to={PATH.privateRoutes.KUNDLI.path}>Kundli</NavLink>
          <NavLink to="/matchmaking">Match Matching</NavLink>
          <NavLink to="/numerology">Numerology</NavLink>
          <NavLink to="/horoscopes/daily-horoscope">Horoscopes</NavLink>
        </nav>

        <div className={styles.headerActions}>
        <div className={styles.walletBadge}>
          <div className={styles.coinIcon}></div>
          <span className={styles.walletAmount}>{formatAmount(1240)}</span>
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

            <NavLink to="/" onClick={() => setIsDrawerOpen(false)}>Home</NavLink>
            <NavLink to="/chat-with-astrologers" onClick={() => setIsDrawerOpen(false)}>Astrologers</NavLink>
            <NavLink to="/aiwow" onClick={() => setIsDrawerOpen(false)}>AI WOW</NavLink>
            <NavLink to="/blogs" onClick={() => setIsDrawerOpen(false)}>Blogs</NavLink>
            <NavLink to="/explore" onClick={() => setIsDrawerOpen(false)}>Explore</NavLink>
            <NavLink to="/numerology" onClick={() => setIsDrawerOpen(false)}>Numerology</NavLink>
            <NavLink to="/horoscopes/daily-horoscope" onClick={() => setIsDrawerOpen(false)}>Horoscopes</NavLink>
          </div>
        </>
      )}
    </>
  );
};

export default TopHeader;