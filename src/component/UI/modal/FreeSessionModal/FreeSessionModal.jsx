import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Chat-bubble artwork from the Figma "Web Free chat user journey" — the same
// image on desktop (node 4787:29898) and mobile (node 4561:71688).
import freeSessionChatArt from "../../../../assets/images/free-session-chat-art.webp";
import chatIcon from "../../../../assets/icons/free-session-chat.svg";
import callIcon from "../../../../assets/icons/free-session-call-add.svg";
import closeIcon from "../../../../assets/icons/free-session-close.svg";
import brandLogo from "../../../../assets/images/ShubhAstrologo.png";
import { useFreeSession } from "../../../../utils/hooks/useFreeSession";
import { trackEvent } from "../../../../utils/analytics";
import styles from "./FreeSessionModal.module.scss";

/*
 * "Your First Session Is 100% Free" promo popup.
 *
 * Gated on VITE_FREE_SESSION_ENABLED (see utils/featureConfig) so the offer can
 * be switched per environment without a code change. With the flag off this
 * renders nothing and costs nothing beyond the mount.
 *
 * Shown on the landing page only, once per page load. Not on every visit to "/"
 * within a load: this component stays mounted across SPA navigation, so without
 * the guard a home -> astrologers -> home trip would pop it again, and a promo
 * that reappears mid-browse reads as broken.
 *
 * This used to be once per *browser session* via sessionStorage, which outlives
 * reloads — so after the first view the popup never returned in that tab, which
 * is indistinguishable from the feature being broken and was reported as such.
 * A reload now gets a fresh chance, which is also how the rest of the promo
 * popups in this folder behave (they key off a one-shot flag, not a session).
 */
let shownThisLoad = false;

// Long enough to stay out of the landing page's first paint, short enough that
// the visitor is still looking at the page when it appears.
const SHOW_DELAY_MS = 1500;

const HOME_PATHS = ["/", "/home"];

/*
 * `?freeSession=1` opens it immediately and ignores the once-per-load guard, so
 * the offer can be re-checked without reloading between attempts.
 */
const FORCE_PARAM = "freeSession";

const FreeSessionModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  /*
    Same gate as the cards: the offer must be running AND this visitor must still
    have their free session. Advertising "100% Free" to someone who already used
    theirs is the one version of this popup worth suppressing.
  */
  const enabled = useFreeSession();
  const onHome = HOME_PATHS.includes(location.pathname);
  const forced = new URLSearchParams(location.search).get(FORCE_PARAM) === "1";

  /*
    Logging in is a route change, not a page load, so `shownThisLoad` survived it:
    a visitor who saw the popup as a guest, went to /login and came back to home
    never saw it again — which is exactly the case where it matters most, since
    eligibility is only known once they are signed in. A sign-in (or sign-out) is
    a new visitor as far as this offer is concerned, so re-arm on it.

    The counter is what makes the effect below re-run: `enabled` may already have
    been true, in which case its dependencies would not have changed.
  */
  const [authEpoch, setAuthEpoch] = useState(0);
  useEffect(() => {
    const rearm = () => {
      shownThisLoad = false;
      setAuthEpoch((n) => n + 1);
    };
    window.addEventListener("auth-change", rearm);
    return () => window.removeEventListener("auth-change", rearm);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!onHome && !forced) return undefined;
    if (!forced && shownThisLoad) return undefined;

    const timer = setTimeout(() => {
      shownThisLoad = true;
      setIsOpen(true);
      trackEvent("free_session_popup_shown", { route_path: window.location.pathname });
    }, forced ? 0 : SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, onHome, forced, authEpoch]);

  const handleClose = () => setIsOpen(false);

  // Escape closes it, like the other popups in this folder.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  /*
   * Both CTAs land on the astrologer list — that is where a session actually
   * starts, and the channel is chosen per astrologer there (availability differs
   * between chat and call). The intent is recorded so the split between the two
   * buttons is measurable even though the destination is the same.
   */
  const go = (channel) => {
    trackEvent("free_session_popup_cta_clicked", { channel });
    setIsOpen(false);
    navigate("/astrologers");
  };

  if (!enabled || !isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Your first session is 100% free">
        {/* Header row: brand on the left, close on the right (Figma 4787:29874). */}
        <div className={styles.header}>
          <img src={brandLogo} alt="ShubhAstro" className={styles.logo} />
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <img src={closeIcon} alt="" aria-hidden="true" width="32" height="32" />
          </button>
        </div>

        <div className={styles.content}>
          {/* Artwork leads on both layouts: the left column on desktop, above the
              copy on mobile (Figma "Free chat popup2", 4561:71664). */}
          <div className={styles.art}>
            <img src={freeSessionChatArt} alt="" aria-hidden="true" />
          </div>

          <div className={styles.body}>
            <p className={styles.kicker}>Your First Session Is</p>
            <h2 className={styles.headline}>100% Free</h2>
            <p className={styles.sub}>Talk To Expert Astrologers, Get Clarity For Your Life.</p>

            <div className={styles.actions}>
              <button type="button" className={styles.chatBtn} onClick={() => go("chat")}>
                <img src={chatIcon} alt="" aria-hidden="true" width="30" height="30" />
                <span className={styles.chatLabel}>Chat Now</span>
              </button>
              <button type="button" className={styles.callBtn} onClick={() => go("call")}>
                <img src={callIcon} alt="" aria-hidden="true" width="25" height="25" />
                Call Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeSessionModal;
