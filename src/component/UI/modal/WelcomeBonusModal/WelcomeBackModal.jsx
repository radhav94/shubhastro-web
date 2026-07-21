import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./WelcomeBonusModal.module.scss";
import { IoClose } from "react-icons/io5";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";
import { getUserFromStorage } from "../../../../utils/authStorage";

const WelcomeBackModal = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  // Resolve the display name (stored at login → user profile → kundli → fallback).
  const name =
    localStorage.getItem("shubhtalk_welcome_back_name") ||
    getUserFromStorage()?.firstName ||
    selectedKundli?.name?.split(" ")[0] ||
    "there";

  // Show whenever the flag is set — checked on mount, on every navigation,
  // AND when explicitly triggered via a custom event (so it appears immediately
  // after guest login without requiring a route change).
  const checkAndShowBack = () => {
    if (localStorage.getItem("shubhtalk_show_welcome_back") === "true") {
      localStorage.removeItem("shubhtalk_show_welcome_back");
      setIsOpen(true);
    }
  };

  useEffect(() => {
    checkAndShowBack();
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener("show-welcome-back", checkAndShowBack);
    return () => window.removeEventListener("show-welcome-back", checkAndShowBack);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event("welcome-back-closed"));
  };

  // Auto-hide the popup after 5 seconds.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => handleClose(), 5000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ aspectRatio: "auto" }}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <IoClose size={22} />
        </button>
        <div className={styles.bgWrapper}>
          <img src={welcomeBg} alt="" className={`${styles.bgImage} ${styles.bgDesktop}`} />
          <img src={welcomeBgMobile} alt="" className={`${styles.bgImage} ${styles.bgMobile}`} />
        </div>
        <div className={styles.content}>
          <img src={welcomeIcon} alt="" className={styles.icon} />
          <p className={styles.welcome}>
            Welcome back, <span className="notranslate">{name}</span>!
          </p>
          <h2 className={styles.title}>Your personalized astrology experience is ready</h2>
          <p className={styles.desc}>Continue where you left off.</p>
          <button className={styles.doneBtn} onClick={handleClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;
