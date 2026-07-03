import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  MousePointerClick,
  Radio,
  Volume2,
} from "lucide-react";
import styles from "./PanditAIVoice.module.scss";
import usePanditAIVoice from "./usePanditAIVoice";
import useAIFreeMinutes from "../../../component/panditAI/useAIFreeMinutes";
import AIRechargeBanner from "../../../component/panditAI/AIRechargeBanner";
import { useEffect } from "react";
import { trackEvent } from "../../../utils/analytics";

const PanditAIVoice = () => {
  const navigate = useNavigate();

  // Track AI Pandit opened in voice mode (once on mount)
  useEffect(() => {
    trackEvent("ai_pandit_opened", { mode: "voice" });
    trackEvent("ai_pandit_voice_mode_used", {});
  }, []);

  const {
    status,
    toggleListening,
    isSupported,
    connecting,
    roomId,
  } = usePanditAIVoice();

  const {
    showRechargeBanner,
    sessionEndedLowBalance,
    walletBalance,
    ratePerMinute,
    minutesUntilPaid,
    minBalanceRequired,
    dismissRechargeBanner,
  } = useAIFreeMinutes({ isOpen: true, roomId });

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const getStatusText = () => {
    if (connecting) return "Connecting...";
    switch (status) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      default:
        return "Tap to start";
    }
  };

  const getSubText = () => {
    if (connecting) return "Preparing your AI Pandit session.";
    if (status === "listening") return "Speak your question clearly.";
    if (status === "processing") return "Processing your question...";
    if (status === "speaking") return "";
    return "Ask in English, Hindi or any supported language.";
  };

  const getCaptionTitle = () => {
    if (connecting) return "Preparing your session";
    if (status === "listening") return "Listening to your question";
    if (status === "processing") return "Thinking about your answer";
    if (status === "speaking") return "AI Pandit is speaking";
    if (sessionEndedLowBalance) return "Recharge to continue";
    return "Tap and ask anything";
  };

  const StatusIcon = () => {
    if (connecting || status === "processing") return <Loader2 className={styles.spinIcon} size={18} />;
    if (status === "listening") return <Radio size={18} />;
    if (status === "speaking") return <Volume2 size={18} />;
    return <MousePointerClick size={18} />;
  };

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <h1>Ai Pandit (Voice)</h1>
              <span className={styles.onlineDot} aria-label={roomId ? "Session live" : "Ready"} />
            </div>
            <p>AI Voice Assistant</p>
          </div>

          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.voiceScreen}>
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

          <div className={styles.caption}>
            <span className={styles.statusLine}>
              <StatusIcon />
              {getStatusText()}
            </span>
            <h2>{getCaptionTitle()}</h2>
            <p>{getSubText()}</p>
          </div>
        </section>

        {!isSupported && (
          <p className={styles.unsupported}>
            Speech recognition is not supported in this browser.
          </p>
        )}
      </main>

      {(showRechargeBanner || sessionEndedLowBalance) && (
        <div className={styles.rechargeBannerWrap}>
          <AIRechargeBanner
            walletBalance={walletBalance}
            ratePerMinute={ratePerMinute}
            minutesUntilPaid={minutesUntilPaid}
            minBalanceRequired={minBalanceRequired}
            sessionEnded={sessionEndedLowBalance}
            onRecharge={() => navigate("/recharge")}
            onDismiss={dismissRechargeBanner}
          />
        </div>
      )}
    </div>
  );
};

export default PanditAIVoice;
