import { useEffect, useState, useRef } from "react";
import { IoGift } from "react-icons/io5";
import styles from "./FreeCall.module.scss";
import { capitalizeWords } from "../../utils/capitalize";
import { getAstrologerDefaultImage } from "../../utils/appImages";
import { formatClock } from "../../screens/private/home/components/chats/freeSession/freeSessionUtils";

/* Shared free-session assets (read only — the chat owns them). */
import giftIcon from "../../assets/chat/freeSession/gift.svg";
import clockWhite from "../../assets/chat/freeSession/clock-white.svg";
import clockOrange from "../../assets/chat/freeSession/clock-orange.svg";
import boltIcon from "../../assets/chat/freeSession/bolt.svg";
import chevronRight from "../../assets/chat/freeSession/chevron-right.svg";
import closeIcon from "../../assets/chat/freeSession/close.svg";
import lowWalletImg from "../../assets/chat/freeSession/low-wallet.png";

/* Call-only assets (Figma "User 1st call" frames). */
import pageBg from "../../assets/call/freeCall/page-bg.jpg";
import bgGlow from "../../assets/call/freeCall/bg-glow.svg";
import backChevron from "../../assets/call/freeCall/back-chevron.svg";
import dividerLine from "../../assets/call/freeCall/divider.svg";
import zodiacRing from "../../assets/call/freeCall/zodiac-ring.png";
import ringGlow from "../../assets/call/freeCall/ring-glow.svg";
import ringOuter from "../../assets/call/freeCall/ring-outer.svg";
import ringInner from "../../assets/call/freeCall/ring-inner.svg";
import statusDot from "../../assets/call/freeCall/status-dot.svg";
import micIcon from "../../assets/call/freeCall/mic.svg";
import endCallIcon from "../../assets/call/freeCall/end-call.svg";
import speakerIcon from "../../assets/call/freeCall/speaker.svg";

/*
 * The user's free first-session AUDIO call screen — Figma file
 * PJeUB9MXHPwrkJiWD7gAT2:
 *   4886:78101  running
 *   4886:77824  low wallet balance popup
 *   4886:77924  ending soon (full-width banner under the controls)
 *   4886:78009  ended / locked (no controls, discounted-price bar)
 *
 * Call-specific on purpose: the free CHAT has its own versions of these pieces
 * (chats/freeSession/FreeSessionUI) which must not change, so only assets and
 * pure helpers are borrowed from there. Paid calls never render any of this.
 */

const RechargeNowButton = ({ onClick, className = "" }) => (
  <button type="button" className={`${styles.rechargeBtn} ${className}`} onClick={onClick}>
    <span className={styles.rechargeLabel}>
      <img src={boltIcon} alt="" width="24" height="24" />
      Recharge Now
    </span>
    <img src={chevronRight} alt="" width="16" height="16" className={styles.rechargeChevron} />
  </button>
);

const FallbackImg = ({ src, gender, className, alt = "" }) => {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? getAstrologerDefaultImage(gender) : src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

/* ---------------- header (back, astrologer, gift badge, timer pill) ---------------- */
const FreeCallHeader = ({ callerName, experience, thumbImage, gender, remainingSeconds, isEnded, onBack }) => {
  const exp = Number(experience) || 0;
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Go back">
          <img src={backChevron} alt="" width="7.0012" height="12.4444" />
        </button>
        <div className={styles.headerUser}>
          <FallbackImg src={thumbImage} gender={gender} className={styles.headerAvatar} alt={callerName || "Astrologer"} />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{capitalizeWords(callerName) || "Astrologer"}</span>
            <span className={styles.headerExp}>
              Exp. {exp} {exp === 1 ? "year" : "years"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.badge}>
          <img src={giftIcon} alt="" width="36" height="36" className={styles.badgeIcon} />
          <div className={styles.badgeText}>
            <span className={styles.badgeTitle}>1st Free Call</span>
            <span className={styles.badgeSubtitle}>{isEnded ? "Free session ended" : "Free session active"}</span>
          </div>
        </div>
        <span className={styles.divider} aria-hidden="true">
          <img src={dividerLine} alt="" width="48" height="1" />
        </span>
        <div className={styles.timerPill} role="timer" aria-live="off">
          <img src={clockWhite} alt="" width="32" height="32" />
          <span>{isEnded ? "00:00 End" : `${formatClock(remainingSeconds)} left`}</span>
        </div>
      </div>
    </header>
  );
};

/* ---------------- centre: zodiac ring avatar ---------------- */
const RingAvatar = ({ src, gender, alt, ripple = false }) => (
  <div className={styles.ringBox}>
    <div className={`${styles.ring} ${ripple ? styles.ringLive : ""}`}>
      <div className={styles.ringBg} aria-hidden="true">
        <img src={zodiacRing} alt="" className={styles.ringZodiac} />
        <img src={ringGlow} alt="" width="120.642" height="120.642" className={styles.ringGlow} />
      </div>
      <img src={ringOuter} alt="" width="183" height="183" className={styles.ringOuter} aria-hidden="true" />
      <img src={ringInner} alt="" width="174.181" height="174.181" className={styles.ringInner} aria-hidden="true" />
      {/* Green "live" ripple, the same effect as the paid call screen's avatar:
          solid soft-green circles that start at the photo's edge and expand
          outwards layer by layer. Above the ring art (so the zodiac circle
          can't hide them), below the photo. Only while connected. */}
      {ripple && (
        <span className={styles.rippleWrap} aria-hidden="true">
          <span className={styles.ripple} />
          <span className={styles.ripple} />
          <span className={styles.ripple} />
          <span className={styles.ripple} />
        </span>
      )}
      <FallbackImg src={src} gender={gender} className={styles.ringPhoto} alt={alt} />
    </div>
  </div>
);

const ControlButton = ({ icon, label, onClick, pressed, off = false }) => (
  <div className={styles.control}>
    <button
      type="button"
      className={`${styles.controlBtn} ${off ? styles.controlOff : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
    >
      <img src={icon} alt="" width="60" height="60" />
    </button>
    <span className={styles.controlLabel}>{label}</span>
  </div>
);


/*
 * SHB-2164: the free call screens are a full-screen fixed overlay, but on a
 * phone a swipe on them still scrolled the page underneath (the address bar
 * collapsed and the screen moved), so the end screen read as "scrollable".
 * Pin the page while the overlay is up and restore its scroll position after
 * — the same mobile-safe lock AddProfileModal uses.
 */
const useLockPageScroll = () => {
  useEffect(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const { body } = document;
    const html = document.documentElement;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      html.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);
};

/**
 * The whole free-call screen. `controls` (mic/speaker/end) is omitted in the
 * ended state; `bottom` is the full-width banner or the lock bar, laid out in
 * flow under everything else so it can never cover the controls.
 */
export const FreeCallScreen = ({
  callerName,
  experience,
  thumbImage,
  profileImage,
  gender,
  remainingSeconds = 0,
  isEnded = false,
  status = "Connected",
  statusTone = "connected",
  durationSeconds = 0,
  onBack,
  controls = null,
  // Optional pill buttons under the header, e.g. Virtual Assistant / View
  // History: [{ label, onClick, badge? }]. Not in the Figma frames; kept on
  // request so a free call keeps the same shortcuts as a paid one.
  actions = null,
  bottom = null,
  children,
  ariaLabel,
}) => {
  useLockPageScroll();
  return (
  <div
    className={`${styles.screen} ${bottom ? styles.hasBottom : ""} ${controls ? "" : styles.noControls}`}
    role={ariaLabel ? "dialog" : undefined}
    aria-label={ariaLabel}
  >
    <div className={styles.bg} aria-hidden="true">
      <img src={pageBg} alt="" className={styles.bgImage} />
      <img src={bgGlow} alt="" width="1008.23" height="1008.23" className={styles.bgGlow} />
    </div>

    <FreeCallHeader
      callerName={callerName}
      experience={experience}
      thumbImage={thumbImage}
      gender={gender}
      remainingSeconds={remainingSeconds}
      isEnded={isEnded}
      onBack={onBack}
    />

    {actions?.length > 0 && (
      <nav className={styles.actions} aria-label="Call shortcuts">
        {actions.map((a) => (
          <button key={a.label} type="button" className={styles.actionBtn} onClick={a.onClick}>
            <span>{a.label}</span>
            {a.badge && <span className={styles.actionBadge} aria-label="New" />}
          </button>
        ))}
      </nav>
    )}

    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.identity}>
          <RingAvatar
            src={profileImage}
            gender={gender}
            alt={callerName}
            ripple={!isEnded && statusTone === "connected"}
          />
          <div className={styles.info}>
            <h1 className={styles.name}>{capitalizeWords(callerName)}</h1>
            <div className={`${styles.status} ${styles[`status_${statusTone}`] || ""}`}>
              <img src={statusDot} alt="" width="8" height="8" />
              <span>{status}</span>
            </div>
            <div className={styles.duration}>
              <span className={styles.durationValue}>{formatClock(durationSeconds)}</span>
              <span className={styles.durationLabel}>Call duration</span>
            </div>
          </div>
        </div>

        {controls && (
          <div className={styles.controls}>
            <ControlButton
              icon={micIcon}
              label={controls.micOn ? "Mute" : "Unmute"}
              pressed={!controls.micOn}
              off={!controls.micOn}
              onClick={controls.onToggleMic}
            />
            <ControlButton icon={endCallIcon} label="End Call" onClick={controls.onEndCall} />
            <ControlButton
              icon={speakerIcon}
              label="Speaker"
              pressed={controls.speakerOn}
              off={!controls.speakerOn}
              onClick={controls.onToggleSpeaker}
            />
            {/* Send Gift — same action and icon as the paid call screen's
                green gift button; not in the Figma frames, kept on request. */}
            {controls.onSendGift && (
              <div className={styles.control}>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${styles.giftBtn}`}
                  onClick={controls.onSendGift}
                  aria-label="Send Gift"
                >
                  <IoGift size={26} aria-hidden="true" />
                </button>
                <span className={styles.controlLabel}>Send Gift</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>

    {bottom}
    {children}
  </div>
  );
};

/* ---------------- 4886:77824 — low wallet balance popup ---------------- */
// Voice note played when the popup opens, so a caller listening on the call
// (screen off, phone at the ear) still hears that the free time is running out.
const LOW_BALANCE_VOICE_NOTE = "/audio/free-call-low-balance.mp3";

export const FreeCallLowBalancePopup = ({
  isOpen,
  remainingSeconds = 0,
  onClose,
  onRemindLater,
  onRecharge,
  onVoiceNoteStart,
  onVoiceNoteEnd,
}) => {
  // Latest callbacks, so the effect below runs only when the popup opens.
  const voiceNoteHandlersRef = useRef({ onVoiceNoteStart, onVoiceNoteEnd });
  voiceNoteHandlersRef.current = { onVoiceNoteStart, onVoiceNoteEnd };

  // Play the voice note once each time the popup opens; stop it if the popup
  // closes (or the call screen unmounts) before it finishes. Start/end let the
  // call screen turn the call audio down so the note is heard clearly.
  useEffect(() => {
    if (!isOpen) return undefined;
    const audio = new Audio(LOW_BALANCE_VOICE_NOTE);
    let playing = false;
    const finish = () => {
      if (!playing) return;
      playing = false;
      voiceNoteHandlersRef.current.onVoiceNoteEnd?.();
    };
    audio.addEventListener("ended", finish);
    audio.addEventListener("error", finish);
    playing = true;
    voiceNoteHandlersRef.current.onVoiceNoteStart?.();
    // A blocked autoplay must not break the popup (or leave the call quiet).
    audio.play().catch(finish);
    return () => {
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("error", finish);
      audio.pause();
      audio.src = "";
      finish();
    };
  }, [isOpen]);

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
        aria-labelledby="free-call-low-balance-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.popupClose} onClick={onClose} aria-label="Close">
          <img src={closeIcon} alt="" width="18" height="18" />
        </button>

        <div className={styles.popupBody}>
          <div className={styles.popupHead}>
            <img src={lowWalletImg} alt="" className={styles.popupIllustration} />
            <div className={styles.popupTexts}>
              <h3 id="free-call-low-balance-title" className={styles.popupTitle}>Low wallet balance</h3>
              <p className={styles.popupText}>Get Up to 100% Extra Bonus Cash!</p>
            </div>
          </div>
          <div className={styles.popupTimer} role="timer">
            <img src={clockOrange} alt="" width="24" height="24" />
            <span>{formatClock(remainingSeconds)}</span>
          </div>
        </div>

        <div className={styles.popupActions}>
          <button type="button" className={styles.remindBtn} onClick={onRemindLater}>
            <span>Remind Me Later</span>
          </button>
          <RechargeNowButton onClick={onRecharge} />
        </div>
      </div>
    </div>
  );
};

/* ---------------- 4886:77924 — "ending soon" banner, pinned to the bottom ---------------- */
export const FreeCallEndingBanner = ({ onRecharge }) => (
  <div className={styles.endingBanner} role="status">
    <div className={styles.endingInner}>
      <p className={styles.endingText}>
        Your free session will end soon
        {/* Phones show only the first sentence (Figma 5055:78411). */}
        <span className={styles.endingTextMore}> Recharge to continue the consultation without interruption.</span>
      </p>
      <RechargeNowButton onClick={onRecharge} className={styles.endingBtn} />
    </div>
  </div>
);

/* ---------------- last minute, wallet covers the rate: calm notice instead ---------------- */
/* Takes the ending banner's place when the call will carry on, paid from the
   wallet, once the free time is over — informational, no Recharge push. */
const formatRate = (n) => {
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

export const FreeCallContinueNotice = ({ remainingSeconds = 0, ratePerMinute }) => (
  <div className={`${styles.endingBanner} ${styles.continueNotice}`} role="note">
    <div className={styles.continueInner}>
      <img src={clockOrange} alt="" width="24" height="24" className={styles.continueIcon} />
      <p className={styles.continueText}>
        <span className={styles.continueLead}>
          Your free session ends in <span className={styles.continueTime}>{formatClock(remainingSeconds)}</span>
        </span>
        <span className={styles.continueSep} aria-hidden="true">·</span>
        <span className={styles.continueRest}>
          The call will continue
          {ratePerMinute ? (
            <>
              {" "}at <span className={styles.nowrap}>₹{formatRate(ratePerMinute)}/min</span>
            </>
          ) : null}{" "}
          from your wallet
        </span>
      </p>
    </div>
  </div>
);

/* ---------------- 4886:78009 — locked bar once the free time is over ---------------- */
/* `canContinue` + `onContinue`: the wallet already covers the rate (the server
   ended the free call anyway), so offer to call again rather than recharge. */
export const FreeCallLockBar = ({
  userName,
  profileImgUrl,
  gender,
  offer,
  onExplore,
  onRecharge,
  canContinue = false,
  onContinue,
}) => {
  const name = (userName || "").trim();
  const greeting = name ? `Hi ${name}` : "Hi";
  const fmt = (n) => Number(n).toFixed(1);
  const showContinue = canContinue && typeof onContinue === "function";

  let message;
  if (showContinue) {
    message = (
      <>
        {greeting}, your free call has ended. Continue from your wallet
        {offer?.now ? (
          <>
            {" "}at <span className={styles.nowrap}>₹ {fmt(offer.now)}/min</span>
            {offer?.was && <span className={styles.lockOldPrice}>₹{fmt(offer.was)}/min</span>}
          </>
        ) : null}
      </>
    );
  } else if (offer?.was) {
    message = (
      <>
        {greeting} lets continue this call at discounted price{" "}
        <span className={styles.nowrap}>₹ {fmt(offer.now)}/min</span>{" "}
        <span className={styles.lockOldPrice}>₹{fmt(offer.was)}/min</span>
      </>
    );
  } else if (offer?.now) {
    message = (
      <>
        {greeting} lets continue this call at <span className={styles.nowrap}>₹ {fmt(offer.now)}/min</span>
      </>
    );
  } else {
    message = <>{greeting} lets continue this call. Recharge your wallet to keep going.</>;
  }

  return (
    <div className={styles.lockBar}>
      <div className={styles.lockInfo}>
        <FallbackImg src={profileImgUrl} gender={gender} className={styles.lockAvatar} />
        <p className={styles.lockText}>{message}</p>
      </div>
      <div className={styles.lockActions}>
        <button type="button" className={styles.exploreBtn} onClick={onExplore}>
          <span>Explore Website</span>
        </button>
        {showContinue ? (
          <button type="button" className={`${styles.rechargeBtn} ${styles.lockRecharge}`} onClick={onContinue}>
            <span className={styles.rechargeLabel}>Continue Call</span>
            <img src={chevronRight} alt="" width="16" height="16" className={styles.rechargeChevron} />
          </button>
        ) : (
          <RechargeNowButton onClick={onRecharge} className={styles.lockRecharge} />
        )}
      </div>
    </div>
  );
};
