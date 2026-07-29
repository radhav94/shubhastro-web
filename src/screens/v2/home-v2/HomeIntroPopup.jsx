import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import styles from "./HomeIntroPopup.module.scss";
import popupImage from "../../../assets/images/kundli-intro-popup.png";

// localStorage flag — once set, the popup never shows again on this browser.
// A fresh browser / incognito session has no flag, so it shows exactly once there.
const SEEN_KEY = "kundliIntroPopupSeen";

const HomeIntroPopup = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(SEEN_KEY) === "true";
    } catch {
      // localStorage unavailable (e.g. blocked cookies) — show once, best effort.
      alreadySeen = false;
    }
    if (!alreadySeen) setIsOpen(true);
  }, []);

  // Mark as seen so it never appears again (on close, backdrop, or CTA click).
  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      /* ignore storage errors */
    }
  };

  const handleClose = () => {
    markSeen();
    setIsOpen(false);
  };

  const handleGenerateKundli = () => {
    markSeen();
    setIsOpen(false);
    navigate("/kundli");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        <img className={styles.banner} src={popupImage} alt="Free Kundli" />

        <div className={styles.textBlock}>
          <h2 className={styles.title}>Unlock Your Free Kundli</h2>
          <p className={styles.subtitle}>
            Get your personalised birth chart with detailed insights on career,
            love, health and more — instantly and absolutely free.
          </p>
        </div>

        <button className={styles.cta} onClick={handleGenerateKundli}>
          Generate Kundli
        </button>
      </div>
    </div>
  );
};

export default HomeIntroPopup;
