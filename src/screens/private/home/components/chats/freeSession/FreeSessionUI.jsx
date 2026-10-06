import { useEffect, useState } from "react";
import styles from "./FreeSession.module.scss";
import giftIcon from "../../../../../../assets/chat/freeSession/gift.svg";
import clockWhite from "../../../../../../assets/chat/freeSession/clock-white.svg";
import clockOrange from "../../../../../../assets/chat/freeSession/clock-orange.svg";
import boltIcon from "../../../../../../assets/chat/freeSession/bolt.svg";
import chevronRight from "../../../../../../assets/chat/freeSession/chevron-right.svg";
import closeIcon from "../../../../../../assets/chat/freeSession/close.svg";
import lowWalletImg from "../../../../../../assets/chat/freeSession/low-wallet.png";
import { getAstrologerDefaultImage } from "../../../../../../utils/appImages";
import { formatClock } from "./freeSessionUtils";

/*
 * Free first-session chat UI — Figma "Web Free chat user journey", screens 8–11.
 * Presentational only: ChatWindow owns the state (is this the free session, the
 * remaining seconds, whether it has ended) and passes it in.
 */

const RechargeNowButton = ({ onClick, className = "" }) => (
  <button type="button" className={`${styles.rechargeNowBtn} ${className}`} onClick={onClick}>
    <span className={styles.rechargeNowLabel}>
      <img src={boltIcon} alt="" width="24" height="24" />
      Recharge Now
    </span>
    <img src={chevronRight} alt="" width="16" height="16" className={styles.rechargeNowChevron} />
  </button>
);

/* Screen 8 / 10 / 11 — header: gift badge, divider, orange timer pill.
   `title` lets the audio call screen say "1st Free Call"; chat keeps the default.
   `className` lets a screen add its own placement without touching these styles. */
export const FreeSessionHeader = ({ remainingSeconds = 0, isEnded = false, title = "1st Free Chat", className = "" }) => (
  <div className={`${styles.headerGroup} ${className}`}>
    <div className={styles.badge}>
      <img src={giftIcon} alt="" width="36" height="36" className={styles.badgeIcon} />
      <div className={styles.badgeText}>
        <span className={styles.badgeTitle}>{title}</span>
        <span className={styles.badgeSubtitle}>{isEnded ? "Free session ended" : "Free session active"}</span>
      </div>
    </div>
    <span className={styles.badgeDivider} aria-hidden="true" />
    <div className={styles.timerPill} role="timer" aria-live="off">
      <img src={clockWhite} alt="" width="32" height="32" />
      {isEnded ? "00:00 End" : `${formatClock(remainingSeconds)} left`}
    </div>
  </div>
);

/* Screen 9 — low wallet balance popup. */
export const LowBalancePopup = ({ isOpen, remainingSeconds = 0, onClose, onRemindLater, onRecharge }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="low-balance-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.popupClose} onClick={onClose} aria-label="Close">
          <img src={closeIcon} alt="" width="18" height="18" />
        </button>

        <div className={styles.popupBody}>
          <div className={styles.popupHead}>
            <img src={lowWalletImg} alt="" className={styles.popupIllustration} />
            <div className={styles.popupTexts}>
              <h3 id="low-balance-title" className={styles.popupTitle}>Low wallet balance</h3>
              <p className={styles.popupText}>
                Get Up to 100% Extra Bonus Cash! Recharge your wallet now and unlock extra talk time on every pack.
              </p>
            </div>
          </div>
          <div className={styles.popupTimer} role="timer">
            <img src={clockOrange} alt="" width="24" height="24" />
            <span>{formatClock(remainingSeconds)}</span>
          </div>
        </div>

        <div className={styles.popupActions}>
          <button type="button" className={styles.remindLaterBtn} onClick={onRemindLater}>
            <span>Remind Me Later</span>
          </button>
          <RechargeNowButton onClick={onRecharge} />
        </div>
      </div>
    </div>
  );
};

/* Screen 10 — banner above the input bar. */
export const FreeSessionEndingBanner = ({ onRecharge }) => (
  <div className={styles.endingBanner} role="status">
    <div className={styles.endingBannerInner}>
      <p className={styles.endingBannerText}>
        Your free session will end soon Recharge to continue the consultation without interruption.
      </p>
      <RechargeNowButton onClick={onRecharge} className={`${styles.pillShape} ${styles.endingBannerBtn}`} />
    </div>
  </div>
);

/*
 * Last minute of a free session whose wallet CAN pay for it to carry on:
 * a calm, non-blocking notice in the banner's place — no popup, no recharge
 * push, because nothing is going to stop. `sessionLabel` is "chat" or "call".
 */
const formatRate = (n) => {
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

export const FreeSessionContinueNotice = ({ remainingSeconds = 0, ratePerMinute, sessionLabel = "chat" }) => (
  <div className={`${styles.endingBanner} ${styles.continueNotice}`} role="note">
    <div className={styles.endingBannerInner}>
      <img src={clockOrange} alt="" width="24" height="24" className={styles.continueNoticeIcon} />
      <p className={styles.continueNoticeText}>
        <span className={styles.continueNoticeLead}>
          Your free session ends in <span className={styles.continueNoticeTime}>{formatClock(remainingSeconds)}</span>
        </span>
        <span className={styles.continueNoticeSep} aria-hidden="true">·</span>
        <span className={styles.continueNoticeRest}>
          The {sessionLabel} will continue
          {ratePerMinute ? (
            <>
              {" "}at <span className={styles.lockPrice}>₹{formatRate(ratePerMinute)}/min</span>
            </>
          ) : null}{" "}
          from your wallet
        </span>
      </p>
    </div>
  </div>
);

/* Screen 11 — replaces the input bar once the free session has run out.
   `sessionLabel` is the noun in "lets continue this …" ("chat" by default,
   "call" on the audio call screen). */
export const FreeSessionLockBar = ({
  userName,
  profileImgUrl,
  gender,
  offer,
  onExplore,
  onRecharge,
  sessionLabel = "chat",
  className = "",
  // The wallet already covers the rate (the server ended the free session
  // anyway): offer to start again from the profile instead of a recharge.
  canContinue = false,
  onContinue,
}) => {
  const [imgError, setImgError] = useState(false);
  const name = (userName || "").trim();
  const greeting = name ? `Hi ${name}` : "Hi";
  const fmt = (n) => Number(n).toFixed(1);
  const showContinue = canContinue && typeof onContinue === "function";

  let message;
  if (showContinue) {
    message = (
      <>
        {greeting}, your free {sessionLabel} has ended. Continue from your wallet
        {offer?.now ? (
          <>
            {" "}at <span className={styles.lockPrice}>₹ {fmt(offer.now)}/min</span>
            {offer?.was && <span className={styles.lockOldPrice}>₹{fmt(offer.was)}/min</span>}
          </>
        ) : null}
      </>
    );
  } else if (offer?.was) {
    message = (
      <>
        {greeting} lets continue this {sessionLabel} at discounted price{" "}
        <span className={styles.lockPrice}>₹ {fmt(offer.now)}/min</span>
        <span className={styles.lockOldPrice}>₹{fmt(offer.was)}/min</span>
      </>
    );
  } else if (offer?.now) {
    message = (
      <>
        {greeting} lets continue this {sessionLabel} at <span className={styles.lockPrice}>₹ {fmt(offer.now)}/min</span>
      </>
    );
  } else {
    message = <>{greeting} lets continue this {sessionLabel}. Recharge your wallet to keep going.</>;
  }

  return (
    <div className={`${styles.lockBar} ${className}`}>
      <div className={styles.lockInfo}>
        <img
          src={!profileImgUrl || imgError ? getAstrologerDefaultImage(gender) : profileImgUrl}
          alt=""
          className={styles.lockAvatar}
          onError={() => setImgError(true)}
        />
        <p className={styles.lockText}>{message}</p>
      </div>
      <div className={styles.lockActions}>
        <button type="button" className={styles.exploreBtn} onClick={onExplore}>
          <span>Explore Website</span>
        </button>
        {showContinue ? (
          <button type="button" className={`${styles.rechargeNowBtn} ${styles.pillShape}`} onClick={onContinue}>
            <span className={styles.rechargeNowLabel}>Continue {sessionLabel === "call" ? "Call" : "Chat"}</span>
            <img src={chevronRight} alt="" width="16" height="16" className={styles.rechargeNowChevron} />
          </button>
        ) : (
          <RechargeNowButton onClick={onRecharge} className={styles.pillShape} />
        )}
      </div>
    </div>
  );
};
