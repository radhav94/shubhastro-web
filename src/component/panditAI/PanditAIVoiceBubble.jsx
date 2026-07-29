import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { Loader2, MousePointerClick, Radio, Volume2 } from "lucide-react";
import styles from "./PanditAIVoiceBubble.module.scss";
import usePanditAIVoice from "../../screens/private/panditAIVoice/usePanditAIVoice";
import useAIFreeMinutes from "./useAIFreeMinutes";
import panditAiIcon from "../../assets/images/AiPandit.png";

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
    connecting,
    roomId,
    endSession,
    markSkipCleanup,
    stopAudio,
  } = usePanditAIVoice({ enabled: isOpen, sharedRoomId });

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

  const getStatusText = () => {
    if (connecting) return "Connecting...";
    switch (status) {
      case "listening": return "Listening...";
      case "processing": return "Thinking...";
      case "speaking": return "Speaking...";
      default: return "Tap to start";
    }
  };

  const getCaptionTitle = () => {
    if (connecting) return "Preparing your session";
    if (status === "listening") return "Listening to your question";
    if (status === "processing") return "Thinking about your answer";
    if (status === "speaking") return "AI Pandit is speaking";
    if (sessionEndedLowBalance) return "Recharge to continue";
    return "Tap and ask anything";
  };

  const getSubText = () => {
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
      <div className={styles.overlay} />
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
          <button
            className={`${styles.micButton} ${styles[status]}`}
            onClick={toggleListening}
            disabled={connecting || !isSupported || sessionEndedLowBalance}
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
