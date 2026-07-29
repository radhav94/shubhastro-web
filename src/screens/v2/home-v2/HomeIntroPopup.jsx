import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import styles from "./HomeIntroPopup.module.scss";
import defaultPopupImage from "../../../assets/images/kundli-intro-popup.png";
import { useGetNewHomeDetailsQuery } from "../../../services/appServices/homeServices";

// localStorage flag — once set, the popup never shows again on this browser.
// A fresh browser / incognito session has no flag, so it shows exactly once there.
const SEEN_KEY = "kundliIntroPopupSeen";

// Helper: Check if current date is within the date range
const isWithinDateRange = (startDate, endDate) => {
  try {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  } catch {
    return false;
  }
};

// Helper: Extract route path from URL
// Example: "https://www.shubhastro.ai/kundli/abc" → "/kundli/abc"
const extractPathFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || "/";
  } catch {
    // If URL parsing fails, return the URL as-is (might be a relative path)
    return url || "/";
  }
};

const HomeIntroPopup = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(defaultPopupImage);
  const [popupLink, setPopupLink] = useState(null);
  const [isInternal, setIsInternal] = useState(false);

  // Fetch homepage data to get pageblocker configuration
  const { data: homeData } = useGetNewHomeDetailsQuery("newcustomerlandingpage");
  const pageBlocker = homeData?.data?.pageblocker;

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(SEEN_KEY) === "true";
    } catch {
      // localStorage unavailable (e.g. blocked cookies) — show once, best effort.
      alreadySeen = false;
    }

    // PRIORITY: Only show if pageblocker.status is true
    if (pageBlocker && pageBlocker.status === true) {
      // Check if current date is within the pageblocker date range
      if (isWithinDateRange(pageBlocker.start_date, pageBlocker.end_date)) {
        // Use desktop image for web
        if (pageBlocker.desktop_image) {
          setPopupImage(pageBlocker.desktop_image);
        }
        if (pageBlocker.link) {
          setPopupLink(pageBlocker.link);
        }
        if (pageBlocker.is_internal !== undefined) {
          setIsInternal(pageBlocker.is_internal);
        }
        if (!alreadySeen) setIsOpen(true);
      }
    }
    // If pageblocker.status is false or doesn't exist, don't show any popup
  }, [pageBlocker]);

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

  const handleBannerClick = () => {
    markSeen();
    setIsOpen(false);
    if (isInternal && popupLink) {
      // Extract path from URL and navigate to it
      const path = extractPathFromUrl(popupLink);
      navigate(path);
    } else if (popupLink) {
      window.location.href = popupLink;
    }
  };

  const handleGenerateKundli = () => {
    markSeen();
    setIsOpen(false);
    if (isInternal && popupLink) {
      // Extract path from URL and navigate to it
      const path = extractPathFromUrl(popupLink);
      navigate(path);
    } else if (popupLink) {
      window.location.href = popupLink;
    } else {
      navigate("/kundli");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        <button
          className={styles.bannerButton}
          onClick={handleBannerClick}
          aria-label="Popup Banner"
          style={{ cursor: "pointer" }}
        >
          <img className={styles.banner} src={popupImage} alt="Popup Banner" />
        </button>

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
