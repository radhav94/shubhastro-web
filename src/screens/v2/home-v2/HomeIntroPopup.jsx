import { useEffect, useState, useRef } from "react";
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

  /*
    Has the visitor started using the page already?

    This popup does not open on mount — it opens when the homepage API resolves
    and reports `pageblocker.status === true`. That is a network round trip, so
    the dialog lands somewhere between half a second and a couple of seconds
    AFTER the homepage has painted and become interactive. Anyone who reaches for
    something in that window has their click taken by a full-screen interstitial
    that was not on screen when they committed to the tap.

    Clarity caught exactly that: a desktop visitor clicked at 00:01, the click was
    recorded dead and labelled "Generate My KundliUnlock" — the homepage card they
    aimed at concatenated with this dialog's "Unlock Your Free Kundli" heading —
    and the session stayed on one page with no navigation, then flipped between
    visible and hidden four times in the next nine seconds and was abandoned.

    So: an interstitial that has not arrived before the visitor starts working is
    too late to be useful and can only get in the way. Deliberately NOT paired
    with markSeen() — the offer has not been shown, so it should not be burned;
    SEEN_KEY is permanent and would retire it for good on this browser.

    A ref, not state: this must not trigger a render, and the effect below reads
    it at the moment the data lands rather than reacting to it.
  */
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const markInteracted = () => {
      hasInteractedRef.current = true;
    };
    // pointerdown rather than click: it fires at the START of the gesture, so a
    // press already underway when the response lands still counts. `scroll` is
    // passive and covers reading without clicking. capture:true so a handler
    // that stops propagation cannot hide the interaction from us.
    const opts = { passive: true, capture: true };
    window.addEventListener("pointerdown", markInteracted, opts);
    window.addEventListener("keydown", markInteracted, opts);
    window.addEventListener("scroll", markInteracted, opts);
    return () => {
      window.removeEventListener("pointerdown", markInteracted, opts);
      window.removeEventListener("keydown", markInteracted, opts);
      window.removeEventListener("scroll", markInteracted, opts);
    };
  }, []);

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
        // Don't cut across someone already using the page — see hasInteractedRef.
        if (!alreadySeen && !hasInteractedRef.current) setIsOpen(true);
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

  /*
    The banner image and the "Generate Kundli" CTA are the same offer, so they
    have to resolve to the same destination. They were two near-identical copies
    of this logic, and the banner's copy was missing the CTA's final
    `else navigate("/kundli")` branch.

    So whenever the CMS pageblocker is enabled with no `link` set — which is
    exactly the case where the bundled artwork and the "Unlock Your Free Kundli"
    copy are shown — tapping the banner fell through every branch and navigated
    nowhere.

    That is worse than an ordinary dead click. markSeen() runs first regardless,
    so the tap silently spent the one and only showing this popup ever gets on
    this browser (SEEN_KEY is permanent) and dropped the visitor back on the
    homepage with nothing to show for it. The banner is a 256x256 button and the
    page's LCP element, so it is the most likely thing in the dialog to be
    tapped.

    One function now, so the two cannot drift apart again.
  */
  const dismissAndGo = () => {
    markSeen();
    setIsOpen(false);

    if (popupLink) {
      if (isInternal) {
        navigate(extractPathFromUrl(popupLink));
        return;
      }
      window.location.href = popupLink;
      return;
    }

    // No CMS link configured — fall back to what the popup says it does.
    navigate("/kundli");
  };

  const handleBannerClick = dismissAndGo;
  const handleGenerateKundli = dismissAndGo;

  if (!isOpen) return null;

  return (
    // The dialog role belongs on the card, not the click-to-dismiss backdrop —
    // the backdrop is presentation only. aria-labelledby points at the visible
    // heading so the dialog's purpose is announced on open.
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-intro-popup-title"
      >
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        <button
          className={styles.bannerButton}
          onClick={handleBannerClick}
          aria-label="Popup Banner"
          style={{ cursor: "pointer" }}
        >
          {/*
            Lighthouse reports this image as the homepage LCP element. Its URL
            arrives with the pageblocker API response, so it cannot be preloaded
            from the HTML — by the time React can request it the browser has
            already finished its initial fetch pass. fetchpriority="high" at
            least gets it to the front of the queue the moment it is discovered.
          */}
          {/*
            width/height are the intrinsic size of every image that can land
            here — the bundled fallback and both CMS banners (desktop and
            mobile) are 256x256 — so the browser can reserve the right box
            before the bytes arrive instead of collapsing to 0 and pushing the
            heading and CTA down when it decodes. `.banner` pins the same 1:1
            ratio in CSS; see the note there before changing either.
          */}
          <img
            className={styles.banner}
            src={popupImage}
            alt="Popup Banner"
            width="256"
            height="256"
            decoding="async"
          />
        </button>

        <div className={styles.textBlock}>
          <h2 id="home-intro-popup-title" className={styles.title}>Unlock Your Free Kundli</h2>
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
