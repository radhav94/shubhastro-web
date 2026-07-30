import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
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
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import styles from "./PanditAIBubble.module.scss";
import usePanditAI, { setPanditAIVoiceHandover } from "./usePanditAI";
import { GuestKundliAuthModal } from "../UI/Profile";
import { setSelectedKundli } from "../../redux/kundli/kundliSlice";
import { setSelectedKundliProfile } from "../../redux/aiwow/aiwowSlice";
import useAIFreeMinutes from "./useAIFreeMinutes";
import useSpeechToText from "./useSpeechToText";
import useSarvamSTT from "../../screens/private/panditAIVoice/useSarvamSTT";
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
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem("panditai_open") === "true");
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  // True while a captured speech segment is still being transliterated to
  // English (async network call). Used to keep Send disabled until the real
  // text has landed, so the "..." placeholder is never sent.
  const [isTranscribing, setIsTranscribing] = useState(false);
  // Counts in-flight transliterations so overlapping speech segments don't
  // clear the flag prematurely.
  const transcribeCountRef = useRef(0);
  const [initialBilling, setInitialBilling] = useState(null);
  // Guest flow: show the kundli details + OTP form inline (as a message) inside
  // the chat, keeping the normal header and input footer.
  // On a page refresh the chat reopens from persisted state, but this React
  // state would reset to false and hide the form. Re-derive it: if the chat is
  // (re)opening and there's no logged-in customer, we're still in guest mode.
  const [guestMode, setGuestMode] = useState(
    () =>
      sessionStorage.getItem("panditai_open") === "true" &&
      !localStorage.getItem("shubhtalk_customer_id")
  );
  // Holds a query (from the "Ask Pandit AI" card) to send once a guest logs in.
  const pendingQueryRef = useRef(null);
  const inputRef = useRef(null);
  const lang = "en-IN";

  // Persist open state for reconnect on refresh
  useEffect(() => {
    sessionStorage.setItem("panditai_open", isOpen ? "true" : "false");
  }, [isOpen]);

  // The chat/billing hooks should only activate once the guest flow is done.
  // While `guestMode` is true the details form is showing; login completes
  // mid-flow (before the welcome-bonus/back popup closes), so gating on
  // `!guestMode` ensures the chat session starts only after that popup is
  // dismissed (guestMode flips to false in handleGuestAuthSuccess).
  const chatActive = isOpen && !guestMode;

  const {
    messages,
    isLoading,
    sending,
    chatDisabled,
    sendText,
    followupQuestions,
    messagesEndRef,
    lastAiMsgRef,
    roomId,
  } = usePanditAI({ isOpen: chatActive, lang });

  const {
    remainingPaidTime: hookRemainingPaidTime,
    isFreePeriod: hookIsFreePeriod,
    freeMinutesRemaining: hookFreeMinutesRemaining,
    showRechargeBanner,
    rechargeBannerMessage,
    walletBalance: hookWalletBalance,
    ratePerMinute: hookRatePerMinute,
    sessionEndedLowBalance,
  } = useAIFreeMinutes({ isOpen: chatActive, roomId });

  // Seed billing/free-minutes from a voice→text handover so the badge shows
  // instantly while the chat:reconnect round-trips.
  const remainingPaidTime = hookRemainingPaidTime ?? initialBilling?.remainingPaidTime ?? null;
  const walletBalance = hookWalletBalance ?? initialBilling?.walletBalance ?? null;
  const ratePerMinute = hookRatePerMinute ?? initialBilling?.ratePerMinute ?? null;
  const freeMinutesRemaining = hookFreeMinutesRemaining ?? initialBilling?.freeMinutesRemaining ?? null;
  const isFreePeriod = hookIsFreePeriod || (hookFreeMinutesRemaining == null && (initialBilling?.isFreePeriod ?? false));

  // Drop the seed once the hook reports real session state.
  useEffect(() => {
    if (hookFreeMinutesRemaining != null || hookRemainingPaidTime != null) {
      setInitialBilling(null);
    }
  }, [hookFreeMinutesRemaining, hookRemainingPaidTime]);

  // Group messages by date for date separators
  const messageGroups = useMemo(() => {
    const groups = {};
    messages.forEach((msg) => {
      const dateKey = msg.createdAt
        ? dayjs(msg.createdAt).format("MMM DD, YYYY")
        : dayjs().format("MMM DD, YYYY");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  }, [messages]);

  const getDateLabel = (dateStr) => {
    const today = dayjs().format("MMM DD, YYYY");
    const yesterday = dayjs().subtract(1, "day").format("MMM DD, YYYY");
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return dateStr;
  };

  // Listen for external "open and send" events from PanditAISection card
  useEffect(() => {
    const handleOpenAndSend = (e) => {
      const query = e.detail?.query;
      // Guests: open the chat and show the details form as an inline message;
      // remember the query to send after they finish the guest flow.
      if (!localStorage.getItem("shubhtalk_customer_id")) {
        if (query?.trim()) pendingQueryRef.current = query.trim();
        setGuestMode(true);
        setIsOpen(true);
        return;
      }
      setIsOpen(true);
      if (query?.trim()) {
        sendText(query.trim());
      }
    };
    window.addEventListener("panditai:ask", handleOpenAndSend);
    return () => window.removeEventListener("panditai:ask", handleOpenAndSend);
  }, [sendText]);

  // Close chat popup when voice popup opens (mutual exclusion)
  // Pass roomId so voice reuses the same session
  useEffect(() => {
    const handleVoiceOpen = () => {
      setIsOpen(false);
    };
    window.addEventListener("panditai-voice:open", handleVoiceOpen);
    return () => window.removeEventListener("panditai-voice:open", handleVoiceOpen);
  }, []);

  // Reopen text chat when voice popup is closed (carry billing/free state back)
  useEffect(() => {
    const handleReopen = (e) => {
      if (e.detail) setInitialBilling(e.detail);
      setIsOpen(true);
    };
    window.addEventListener("panditai:reopen", handleReopen);
    return () => window.removeEventListener("panditai:reopen", handleReopen);
  }, []);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSpeechResult = useCallback(async (transcript) => {
    setInterimText("");
    transcribeCountRef.current += 1;
    setIsTranscribing(true);
    try {
      // Transliterate non-Latin text (e.g., Devanagari) to English letters
      const romanized = await transliterateToLatin(transcript);
      setText((prev) => (prev ? `${prev} ${romanized}` : romanized));
    } finally {
      transcribeCountRef.current = Math.max(0, transcribeCountRef.current - 1);
      if (transcribeCountRef.current === 0) setIsTranscribing(false);
    }
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

  // Server-based STT (records audio, transcribes on the backend) returns the
  // final transcript in one shot after recording stops — no interim results.
  const handleSarvamResult = useCallback(
    async (transcript) => {
      const spoken = (transcript || "").trim();
      if (!spoken) return;
      await handleSpeechResult(spoken);
    },
    [handleSpeechResult]
  );

  const handleSarvamEnd = useCallback(() => {
    setInterimText("");
  }, []);

  // Web Speech API — real-time interim results, but unsupported on most mobile
  // browsers / in-app WebViews.
  const webStt = useSpeechToText({
    onResult: handleSpeechResult,
    onInterim: handleInterim,
    onEnd: handleAutoEnd,
  });
  // Recorder + server STT fallback — works wherever getUserMedia does (mobile),
  // so the mic stays available when the Web Speech API is missing.
  const sarvamStt = useSarvamSTT({ onResult: handleSarvamResult, onEnd: handleSarvamEnd });

  const useWebStt = webStt.isSupported;
  const activeStt = useWebStt ? webStt : sarvamStt;
  const { isListening, startListening, stopListening } = activeStt;
  // Mic shows if either engine is available.
  const isSupported = webStt.isSupported || sarvamStt.isSupported;
  // Combined "busy" signal: local transliteration (both paths) plus the
  // server transcription window of the fallback engine.
  const sttTranscribing = isTranscribing || (!useWebStt && sarvamStt.isTranscribing);

  // Show the "..." placeholder while the fallback engine transcribes on the
  // server (the Web Speech path drives interim text via its own callbacks).
  useEffect(() => {
    if (useWebStt) return;
    setInterimText(sarvamStt.isTranscribing ? "..." : "");
  }, [useWebStt, sarvamStt.isTranscribing]);

  const handleSend = useCallback(() => {
    // Block sending while speech-to-text is still in progress so the "..."
    // placeholder / partial transcription is never sent.
    if (isListening || sttTranscribing) return;
    // Send only the confirmed text — never the interim "..." placeholder.
    const outgoing = text.trim();
    if (outgoing) {
      stopListening();
      setInterimText("");
      sendText(outgoing);
      setText("");
    }
  }, [text, sendText, stopListening, isListening, sttTranscribing]);

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
    // Guest: open the chat and show the kundli-details form as an inline
    // message (header + input footer stay as-is) instead of redirecting to login.
    if (!userIdLocal) {
      setGuestMode(true);
    }
    setIsOpen(true);
  }, []);

  // After a guest completes the auth flow, select their new profile and let the
  // chat initialize (sending any pending query captured from the "Ask" card).
  const handleGuestAuthSuccess = useCallback(
    (profile) => {
      setGuestMode(false);
      if (profile?._id) {
        dispatch(setSelectedKundli(profile));
        dispatch(setSelectedKundliProfile(profile));
        localStorage.setItem("selectedKundliProfile", JSON.stringify(profile));
      }
      setIsOpen(true);
      const pending = pendingQueryRef.current;
      pendingQueryRef.current = null;
      if (pending) {
        // sendText queues the message until the chat session is accepted.
        sendText(pending);
      }
    },
    [dispatch, sendText]
  );

  const handleInputChange = useCallback((e) => setText(e.target.value), []);

  const placeholder = isListening ? "Listening..." : "Ask Pandit AI...";

  const displayValue = interimText
    ? `${text}${text ? " " : ""}${interimText}`
    : text;

  // Send is allowed only when there is confirmed text and speech-to-text is
  // fully done — not while recording (isListening) or transliterating
  // (isTranscribing). This prevents sending the "..." placeholder.
  const canSend = !!text.trim() && !isListening && !sttTranscribing;

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
            <img src={panditAiIcon} alt="icon" width="40" height="40" fetchPriority="high" />
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
                <img src={panditAiIcon} alt="icon" width="36" height="36" />
              </div>
              <div className={styles.headerCopy}>
                <h4 className={styles.headerName}>Pandit AI</h4>
                {sending && <span className={styles.headerStatus}>Typing...</span>}
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
            {guestMode && (
              <>
                <div className={`${styles.msgRow} ${styles.aiRow}`}>
                  <div className={`${styles.msgBubble} ${styles.aiBubble}`}>
                    <p className={styles.msgText}>
                      Namaste! Please share a few birth details so I can personalize your reading.
                    </p>
                  </div>
                </div>
                <div className={`${styles.msgRow} ${styles.aiRow}`}>
                  <div style={{ width: "100%" }}>
                    <GuestKundliAuthModal
                      inline
                      isOpen={guestMode}
                      onClose={() => {
                        setGuestMode(false);
                        pendingQueryRef.current = null;
                      }}
                      onSuccess={handleGuestAuthSuccess}
                    />
                  </div>
                </div>
              </>
            )}
            {!guestMode && isLoading ? (
              <div className={styles.skeleton}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.skeletonBubble} ${i % 2 === 0 ? styles.right : styles.left}`}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              guestMode ? null : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  <IoChatbubbleEllipses size={34} />
                </span>
                <p>Ask Pandit AI anything about your life</p>
              </div>
              )
            ) : (
              (() => {
                // Find the last AI message to attach scroll ref
                const allMsgs = Object.values(messageGroups).flat();
                const lastAiId = [...allMsgs].reverse().find((m) => m.sender !== "user")?._id;
                return Object.entries(messageGroups).map(([date, msgs], groupIndex) => (
                  <div key={`${date}-${groupIndex}`} className={styles.messageGroup}>
                    <div className={styles.dateHeader}>
                      <span className={styles.dateText}>{getDateLabel(date)}</span>
                    </div>
                    {msgs.map((msg) => (
                      <div key={msg._id} ref={msg._id === lastAiId ? lastAiMsgRef : undefined}>
                        <MessageBubble msg={msg} />
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
            <div ref={messagesEndRef} />
          </div>

          {followupQuestions.length > 0 && (
            <div className={styles.followupSection}>
              {followupQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className={styles.followupBtn}
                  onClick={() => sendText(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {!guestMode && (
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
                disabled={isLoading || chatDisabled}
              />

              {isSupported && (
                <button
                  className={`${styles.micBtn} ${isListening ? styles.micActive : ""}`}
                  onClick={handleMicClick}
                  disabled={isLoading || chatDisabled}
                  aria-label={isListening ? "Stop recording" : "Start voice input"}
                  type="button"
                >
                  {isListening ? <IoStopCircle size={18} /> : <IoMic size={18} />}
                </button>
              )}

              <button
                className={styles.voiceChatBtn}
                onClick={() => {
                  setPanditAIVoiceHandover(true);
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent("panditai-voice:open", { detail: { roomId, walletBalance, remainingPaidTime, ratePerMinute, isFreePeriod, freeMinutesRemaining } }));
                }}
                aria-label="Switch to voice chat"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="10" width="2.5" height="4" rx="1.25" />
                  <rect x="6.5" y="7" width="2.5" height="10" rx="1.25" />
                  <rect x="11" y="4" width="2.5" height="16" rx="1.25" />
                  <rect x="15.5" y="7" width="2.5" height="10" rx="1.25" />
                  <rect x="20" y="10" width="2.5" height="4" rx="1.25" />
                </svg>
              </button>

              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!canSend}
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
          )}
        </div>
        </>
      )}

    </>,
    document.body
  );
};

export default PanditAIBubble;
