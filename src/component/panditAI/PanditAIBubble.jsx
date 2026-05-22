import { useState, useCallback, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import {
  IoClose,
  IoSend,
  IoChatbubbleEllipses,
  IoMic,
  IoStopCircle,
  IoWallet,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./PanditAIBubble.module.scss";
import usePanditAI from "./usePanditAI";
import useAIFreeMinutes from "./useAIFreeMinutes";
import useSpeechToText from "./useSpeechToText";
import { transliterateToLatin } from "./translateText";
import AIRechargeBanner from "./AIRechargeBanner";
import AISessionStatus from "./AISessionStatus";
import panditAiIcon from "../../assets/images/AiPandit.png";

// Memoized message bubble to avoid re-rendering the entire list on new messages
const MessageBubble = memo(({ msg }) => {
  const isUser = msg.sender === "user";
  return (
    <div className={`${styles.msgRow} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div className={`${styles.msgBubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        <p className={styles.msgText}>{msg.text}</p>
        <div className={styles.msgMeta}>
          <span className={styles.msgTime}>{msg.time}</span>
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";

const PanditAIBubble = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem("panditai_open") === "true");
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const inputRef = useRef(null);
  const lang = "en-IN";

  // Persist open state for reconnect on refresh
  useEffect(() => {
    sessionStorage.setItem("panditai_open", isOpen ? "true" : "false");
  }, [isOpen]);

  const {
    messages,
    isLoading,
    sending,
    chatDisabled,
    sendText,
    messagesEndRef,
    roomId,
  } = usePanditAI({ isOpen, lang });

  const {
    isFreePeriod,
    freeMinutesRemaining,
    remainingPaidTime,
    showRechargeBanner,
    rechargeBannerMessage,
    minutesUntilPaid,
    minBalanceRequired,
    walletBalance,
    ratePerMinute,
    sessionEndedLowBalance,
    freeWindowRenewed,
    dismissRechargeBanner,
    resetFreeMinutesState,
  } = useAIFreeMinutes({ isOpen, roomId });

  // Listen for external "open and send" events from PanditAISection card
  useEffect(() => {
    const handleOpenAndSend = (e) => {
      const query = e.detail?.query;
      setIsOpen(true);
      if (query?.trim()) {
        sendText(query.trim());
      }
    };
    window.addEventListener("panditai:ask", handleOpenAndSend);
    return () => window.removeEventListener("panditai:ask", handleOpenAndSend);
  }, [sendText]);

  // Close chat popup when voice popup opens (mutual exclusion)
  useEffect(() => {
    const handleVoiceOpen = () => {
      setIsOpen(false);
    };
    window.addEventListener("panditai-voice:open", handleVoiceOpen);
    return () => window.removeEventListener("panditai-voice:open", handleVoiceOpen);
  }, []);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSpeechResult = useCallback(async (transcript) => {
    setInterimText("");
    // Transliterate non-Latin text (e.g., Devanagari) to English letters
    const romanized = await transliterateToLatin(transcript);
    setText((prev) => (prev ? `${prev} ${romanized}` : romanized));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleInterim = useCallback(() => {
    setInterimText("...");
  }, []);

  const handleAutoEnd = useCallback(() => {
    // Auto-send when mic stops on its own (silence timeout)
    // Use a small delay to let the last transliteration finish
    setTimeout(() => {
      setText((currentText) => {
        if (currentText.trim()) {
          sendText(currentText.trim());
          return "";
        }
        return currentText;
      });
      setInterimText("");
    }, 500);
  }, [sendText]);

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechToText({ onResult: handleSpeechResult, onInterim: handleInterim, onEnd: handleAutoEnd });

  const handleSend = useCallback(() => {
    const outgoing = `${text}${text && interimText ? " " : ""}${interimText}`.trim();
    if (outgoing) {
      stopListening();
      setInterimText("");
      sendText(outgoing);
      setText("");
    }
  }, [text, interimText, sendText, stopListening]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
      setInterimText("");
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleClose = useCallback(() => {
    stopListening();
    setInterimText("");
    setIsOpen(false);
  }, [stopListening]);

  const handleOpen = useCallback(() => {
    const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
    if (!userIdLocal) {
      navigate("/login");
      return;
    }
    setIsOpen(true);
  }, [navigate]);

  const handleInputChange = useCallback((e) => setText(e.target.value), []);

  const placeholder = isListening ? "Listening..." : "Ask Pandit AI...";

  const displayValue = interimText
    ? `${text}${text ? " " : ""}${interimText}`
    : text;

  return createPortal(
    <>
      {!isOpen && (
        <button
          className={styles.bubble}
          onClick={handleOpen}
          aria-label="Open Pandit AI chat"
        >
          <span className={styles.bubbleGlow} />
          <span className={styles.bubbleIcon}>
            <img src={panditAiIcon} alt="icon" />
          </span>
          <span className={styles.bubbleText}>
            <span className={styles.bubbleKicker}>Ask</span>
            <span className={styles.bubbleLabel}>Pandit AI</span>
          </span>
        </button>
      )}

      {isOpen && (
        <>
          <div className={styles.overlay} />
          <div className={`${styles.chatWindow} notranslate`} role="dialog" aria-label="Pandit AI Chat" translate="no">
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.headerAvatar}>
                <img src={panditAiIcon} alt="icon" />
              </div>
              <div className={styles.headerCopy}>
                <h4 className={styles.headerName}>Pandit AI</h4>
                <span className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  {sending ? "Typing..." : "AI Assistant"}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              {isFreePeriod && freeMinutesRemaining != null && remainingPaidTime == null && (
                <div className={styles.freeMinBadge}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{freeMinutesRemaining} min free</span>
                </div>
              )}
              {remainingPaidTime != null && !sessionEndedLowBalance && (
                <div className={styles.countdownBadge}>
                  <div className={styles.countdownTime}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{Math.floor(remainingPaidTime / 3600) > 0 ? `${String(Math.floor(remainingPaidTime / 3600)).padStart(2, "0")}:` : ""}{String(Math.floor((remainingPaidTime % 3600) / 60)).padStart(2, "0")}:{String(remainingPaidTime % 60).padStart(2, "0")}</span>
                  </div>
                  {ratePerMinute && (
                    <>
                      <span className={styles.countdownDivider} />
                      <span className={styles.countdownRate}>₹{ratePerMinute}/min</span>
                    </>
                  )}
                </div>
              )}
              <button
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Close chat"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          <div className={styles.messagesArea}>
            {isLoading ? (
              <div className={styles.skeleton}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.skeletonBubble} ${i % 2 === 0 ? styles.right : styles.left}`}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  <IoChatbubbleEllipses size={34} />
                </span>
                <p>Ask Pandit AI anything about your life</p>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg._id} msg={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputBar}>
            {!sessionEndedLowBalance && (
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                className={styles.textInput}
                value={displayValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={chatDisabled ? "Reconnecting..." : placeholder}
                disabled={sending || isLoading || chatDisabled}
              />

              {isSupported && (
                <button
                  className={`${styles.micBtn} ${isListening ? styles.micActive : ""}`}
                  onClick={handleMicClick}
                  disabled={sending || isLoading || chatDisabled}
                  aria-label={isListening ? "Stop recording" : "Start voice input"}
                  type="button"
                >
                  {isListening ? <IoStopCircle size={18} /> : <IoMic size={18} />}
                </button>
              )}

              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || !displayValue.trim()}
                aria-label="Send message"
                type="button"
              >
                <IoSend size={18} />
              </button>
            </div>
            )}
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
        </div>
        </>
      )}
    </>,
    document.body
  );
};

export default PanditAIBubble;
