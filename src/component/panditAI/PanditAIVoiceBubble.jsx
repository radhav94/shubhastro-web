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
  const [isOpen, setIsOpen] = useState(false);

  const {
    status,
    toggleListening,
    isSupported,
    connecting,
    roomId,
    endSession,
  } = usePanditAIVoice({ enabled: isOpen });

  const {
    showRechargeBanner,
    rechargeBannerMessage,
    sessionEndedLowBalance,
  } = useAIFreeMinutes({ isOpen, roomId });

  // Listen for external open event
  useEffect(() => {
    const handleOpen = () => {
      const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
      if (!userIdLocal) {
        navigate("/login");
        return;
      }
      setIsOpen(true);
    };
    window.addEventListener("panditai-voice:open", handleOpen);
    return () => window.removeEventListener("panditai-voice:open", handleOpen);
  }, [navigate]);

  const handleClose = useCallback(() => {
    endSession?.();
    setIsOpen(false);
  }, [endSession]);

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
              <img src={panditAiIcon} alt="icon" />
            </div>
            <div className={styles.headerCopy}>
              <h4 className={styles.headerName}>Pandit AI (Voice)</h4>
              <span className={styles.headerStatus}>
                <span className={styles.statusDot} />
                {connecting ? "Connecting..." : status === "processing" ? "Thinking..." : "AI Assistant"}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
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
