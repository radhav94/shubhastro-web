import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { Loader2, MousePointerClick, Radio, Volume2 } from "lucide-react";
import styles from "./PanditAIVoiceBubble.module.scss";
import usePanditAIVoice from "../../screens/private/panditAIVoice/usePanditAIVoice";
import useAIFreeMinutes from "./useAIFreeMinutes";
import { isInAppBrowser } from "../../utils/deviceInfo";

// CDN-hosted — see PanditAIBubble for why this is a constant, not an import.
const panditAiIcon = "https://assets.shubhastro.ai/images/AiPandit.png";

const PanditAIVoiceBubble = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem("panditai_voice_open") === "true");
  const [sharedRoomId, setSharedRoomId] = useState(null);
  const [initialBilling, setInitialBilling] = useState(null);

  // Persist open state for reconnect on refresh
  useEffect(() => {
    sessionStorage.setItem("panditai_voice_open", isOpen ? "true" : "false");
  }, [isOpen]);

  const {
    status,
    toggleListening,
    isSupported,
    micError,
    connecting,
    roomId,
    endSession,
    markSkipCleanup,
    stopAudio,
  } = usePanditAIVoice({ enabled: isOpen, sharedRoomId });

  /*
   * Clarity dead clicks (session ypvzho, Sep 4, Instagram in-app browser):
   * engaged Pandit AI at 01:11, then rapid clicks from 01:17 to 01:48 with a dead
   * click at 01:28 — 8 clicks, one page, nearly eight minutes and nothing
   * completed.
   *
   * The mic button carried native `disabled={connecting || !isSupported ||
   * sessionEndedLowBalance}`. `isSupported` is `!!navigator.mediaDevices
   * ?.getUserMedia` (see useSarvamSTT), and `navigator.mediaDevices` is commonly
   * absent altogether in embedded in-app browsers — the same constraint the
   * AI-Wow camera screens already document and handle.
   *
   * So in an Instagram WebView the button was natively disabled, dispatching no
   * click event, while the caption still read "Tap to start" over the heading
   * "Tap and ask anything". Nothing anywhere said voice was unavailable. The UI
   * invited the tap and then swallowed it, which is exactly Clarity's "appeared
   * clickable but did not respond".
   *
   * `seq` is bumped per tap so a repeated identical message still remounts the
   * node: Clarity sees a DOM mutation and screen readers re-announce.
   */
  const [micNotice, setMicNotice] = useState(null);
  const noticeSeqRef = useRef(0);

  const voiceUnavailable = !isSupported;

  const announceMicNotice = useCallback((text) => {
    noticeSeqRef.current += 1;
    setMicNotice({ seq: noticeSeqRef.current, text });
  }, []);

  // Hand off to the Pandit AI text chat — the same event the guest path below
  // uses. Voice closing always reopens text, so nothing is stranded.
  const switchToTextChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }));
  }, []);

  const {
    remainingPaidTime: hookRemainingPaidTime,
    isFreePeriod: hookIsFreePeriod,
    freeMinutesRemaining: hookFreeMinutesRemaining,
    showRechargeBanner,
    rechargeBannerMessage,
    walletBalance: hookWalletBalance,
    ratePerMinute: hookRatePerMinute,
    sessionEndedLowBalance,
  } = useAIFreeMinutes({ isOpen, roomId });

  // Declared after useAIFreeMinutes because it reads sessionEndedLowBalance.
  const handleMicClick = useCallback(() => {
    if (voiceUnavailable) {
      announceMicNotice(
        isInAppBrowser()
          ? "Voice needs microphone access, which this app's built-in browser blocks. Use the text chat below, or open shubhastro.ai in Chrome or Safari."
          : "Voice isn't available on this browser. Use the text chat instead."
      );
      return;
    }
    if (sessionEndedLowBalance) {
      announceMicNotice("Your balance ran out. Recharge to continue this voice session.");
      return;
    }
    if (connecting) {
      announceMicNotice("Still preparing your session — one moment.");
      return;
    }
    setMicNotice(null);
    toggleListening();
  }, [announceMicNotice, connecting, sessionEndedLowBalance, toggleListening, voiceUnavailable]);

  // Use hook values, fall back to initial billing seeded from the text chat
  // handover so the badge shows instantly while chat:reconnect round-trips.
  const remainingPaidTime = hookRemainingPaidTime ?? initialBilling?.remainingPaidTime ?? null;
  const walletBalance = hookWalletBalance ?? initialBilling?.walletBalance ?? null;
  const ratePerMinute = hookRatePerMinute ?? initialBilling?.ratePerMinute ?? null;
  const freeMinutesRemaining = hookFreeMinutesRemaining ?? initialBilling?.freeMinutesRemaining ?? null;
  const isFreePeriod = hookIsFreePeriod || (hookFreeMinutesRemaining == null && (initialBilling?.isFreePeriod ?? false));

  // Once the hook produces real session state, drop the seed so it can't keep
  // showing a stale free badge after billing switches to paid.
  useEffect(() => {
    if (hookFreeMinutesRemaining != null || hookRemainingPaidTime != null) {
      setInitialBilling(null);
    }
  }, [hookFreeMinutesRemaining, hookRemainingPaidTime]);

  // Listen for external open event (may include shared roomId from text chat)
  useEffect(() => {
    const handleOpen = (e) => {
      const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
      if (!userIdLocal) {
        // Guests can't start a voice session directly. Instead of bouncing
        // them to the login page, hand off to the Pandit AI text chat which
        // opens the inline guest kundli-details/registration form (same UX as
        // the text bubble). After successful registration the chat starts and
        // they can switch to voice.
        //
        // Defer the dispatch to the next tick: the text bubble also listens for
        // "panditai-voice:open" and closes itself for mutual exclusion. Firing
        // "panditai:ask" now would race with that close handler. Waiting for the
        // current event to finish guarantees the guest form opens and stays open.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }));
        }, 0);
        return;
      }
      const incomingRoomId = e.detail?.roomId || null;
      if (incomingRoomId) {
        setSharedRoomId(incomingRoomId);
      }
      // Seed initial billing / free-minutes data from text chat
      if (
        e.detail &&
        (e.detail.walletBalance != null ||
          e.detail.remainingPaidTime != null ||
          e.detail.freeMinutesRemaining != null)
      ) {
        setInitialBilling(e.detail);
      }
      setIsOpen(true);
    };
    window.addEventListener("panditai-voice:open", handleOpen);
    return () => window.removeEventListener("panditai-voice:open", handleOpen);
  }, []);

  // Close voice popup when chat popup opens (mutual exclusion)
  useEffect(() => {
    const handleChatOpen = () => {
      if (isOpen) {
        endSession?.();
        setIsOpen(false);
      }
    };
    window.addEventListener("panditai:ask", handleChatOpen);
    return () => window.removeEventListener("panditai:ask", handleChatOpen);
  }, [isOpen, endSession]);

  const handleClose = useCallback(() => {
    // Stop any audio playback immediately
    stopAudio();

    // If this was a shared session from text chat, don't end it — just close voice UI
    if (sharedRoomId) {
      markSkipCleanup();
      setIsOpen(false);
      setSharedRoomId(null);
      // Reopen Pandit AI text chat (it will reconnect to the same room) and
      // hand the current billing/free-minutes state back for a seamless badge.
      window.dispatchEvent(new CustomEvent("panditai:reopen", {
        detail: { walletBalance, remainingPaidTime, ratePerMinute, isFreePeriod, freeMinutesRemaining },
      }));
    } else {
      // Standalone voice session — end it fully
      endSession?.();
      setIsOpen(false);
      setSharedRoomId(null);
      // Always reopen text chat when voice closes
      window.dispatchEvent(new CustomEvent("panditai:reopen"));
    }
  }, [endSession, sharedRoomId, markSkipCleanup, stopAudio, walletBalance, remainingPaidTime, ratePerMinute, isFreePeriod, freeMinutesRemaining]);

  // Escape closes the voice window, matching the text chat. Without this the
  // only way out was the small × in the header.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const getStatusText = () => {
    // Checked before everything else: when the microphone can't exist, "Tap to
    // start" is an invitation the screen cannot honour.
    if (voiceUnavailable) return "Voice unavailable";
    if (connecting) return "Connecting...";
    switch (status) {
      case "listening": return "Listening...";
      case "processing": return "Thinking...";
      case "speaking": return "Speaking...";
      default: return "Tap to start";
    }
  };

  const getCaptionTitle = () => {
    if (voiceUnavailable) return "Voice isn't available here";
    if (connecting) return "Preparing your session";
    if (status === "listening") return "Listening to your question";
    if (status === "processing") return "Thinking about your answer";
    if (status === "speaking") return "AI Pandit is speaking";
    if (sessionEndedLowBalance) return "Recharge to continue";
    return "Tap and ask anything";
  };

  const getSubText = () => {
    if (voiceUnavailable) {
      return isInAppBrowser()
        ? "This app's built-in browser blocks microphone access."
        : "This browser doesn't support microphone recording.";
    }
    if (connecting) return "Preparing your AI Pandit session.";
    if (status === "listening") return "Speak your question clearly.";
    if (status === "processing") return "Processing your question...";
    if (status === "speaking") return "";
    return "Ask in English, Hindi or any supported language.";
  };

  const StatusIcon = () => {
    if (connecting || status === "processing") return <Loader2 className={styles.spinIcon} size={16} />;
    if (status === "listening") return <Radio size={16} />;
    if (status === "speaking") return <Volume2 size={16} />;
    return <MousePointerClick size={16} />;
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/*
        This was `<div className={styles.overlay} />` with no handler — a
        transparent `position: fixed; inset: 0; z-index: 9990` layer over the
        whole page. So while the voice window was open, the page stayed fully
        visible behind it and every tap outside the window did nothing: not one
        dead element but a dead page, for as long as voice mode lasted.

        PanditAIBubble already documents and fixes exactly this on its own
        backdrop; the voice bubble was never given the same treatment. Tapping a
        backdrop to dismiss is the near-universal convention, so that is what it
        does — and handleClose already routes back to the text chat, so nothing is
        lost by closing this way.
      */}
      <div
        className={styles.overlay}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className={styles.chatWindow} role="dialog" aria-label="AI Pandit Voice">
        {/* Header - same as PanditAI */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerAvatar}>
              <img src={panditAiIcon} alt="icon" width="36" height="36" />
            </div>
            <div className={styles.headerCopy}>
              <h4 className={styles.headerName}>Pandit AI <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8 }}>(Voice)</span></h4>
              {(connecting || status === "processing") && <span className={styles.headerStatus}>{connecting ? "Connecting..." : "Thinking..."}</span>}
            </div>
          </div>
          <div className={styles.headerActions}>
            {isFreePeriod && freeMinutesRemaining != null && !sessionEndedLowBalance && (
              <div className={styles.freeBadge}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className={styles.freeBadgeText}>{freeMinutesRemaining} min free</span>
              </div>
            )}
            {!isFreePeriod && remainingPaidTime != null && !sessionEndedLowBalance && (
              <div className={styles.countdownBadge}>
                {walletBalance != null && (
                  <span className={styles.countdownBalance}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M16 12h.01"/>
                      <path d="M2 10h20"/>
                    </svg>
                    ₹{walletBalance}
                  </span>
                )}
                <div className={styles.countdownRow}>
                  <div className={styles.countdownTime}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{String(Math.floor(remainingPaidTime / 60)).padStart(2, "0")}:{String(remainingPaidTime % 60).padStart(2, "0")}</span>
                  </div>
                  {ratePerMinute && (
                    <>
                      <span className={styles.countdownDivider} />
                      <span className={styles.countdownRate}>₹{ratePerMinute}/min</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              <IoClose size={20} />
            </button>
          </div>
        </div>

        {/* Voice Stage */}
        <div className={styles.voiceStage}>
          {/* `aria-disabled`, not native `disabled`. A disabled button dispatches
              no click event, so in an in-app browser — where
              navigator.mediaDevices is absent and `isSupported` is false — every
              tap on the one control this screen offers was swallowed while the
              caption still said "Tap to start". See the note at the top. */}
          <button
            className={`${styles.micButton} ${styles[status]}`}
            onClick={handleMicClick}
            aria-disabled={connecting || voiceUnavailable || sessionEndedLowBalance}
            aria-busy={connecting}
            aria-label={getStatusText()}
          >
            <span className={styles.micHalo} />
            <span className={styles.micCore} />
          </button>
        </div>

        {/* Caption */}
        <div className={styles.caption}>
          <span className={styles.statusLine}>
            <StatusIcon />
            {getStatusText()}
          </span>
          <h3>{getCaptionTitle()}</h3>
          <p>{getSubText()}</p>

          {/* Inline, directly under the mic, rather than a top-right toast the
              user cannot see from here and Clarity cannot record. Keyed on seq so
              a repeat tap remounts it. */}
          {micNotice && (
            <p key={micNotice.seq} className={styles.micNotice} role="status">
              {micNotice.text}
            </p>
          )}

          {/* A refused or missing microphone used to be a bare console.error.
              See useSarvamSTT. */}
          {!micNotice && micError && (
            <p className={styles.micNotice} role="status">
              {micError}
            </p>
          )}

          {/* Without this the voice window was a dead end in an in-app browser:
              the only control could not work and nothing offered a way on. Text
              chat needs no microphone and reaches the same AI Pandit. */}
          {voiceUnavailable && (
            <button
              type="button"
              className={styles.textChatBtn}
              onClick={switchToTextChat}
            >
              Use text chat instead
            </button>
          )}
        </div>

        {/* Recharge Banner - inline like PanditAI */}
        {(showRechargeBanner || sessionEndedLowBalance) && (
          <div className={styles.rechargeBanner}>
            <span className={styles.rechargeText}>
              {rechargeBannerMessage || "Low balance! Recharge to continue chatting."}
            </span>
            <button
              className={styles.rechargeNowBtn}
              onClick={() => navigate("/recharge")}
              type="button"
            >
              Recharge
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

export default PanditAIVoiceBubble;
