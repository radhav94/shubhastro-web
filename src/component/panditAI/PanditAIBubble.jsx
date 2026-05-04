import { useState, useCallback, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import {
  IoClose,
  IoSend,
  IoChatbubbleEllipses,
  IoMic,
  IoStopCircle,
} from "react-icons/io5";
import { Sparkles, Globe } from "lucide-react";
import styles from "./PanditAIBubble.module.scss";
import usePanditAI from "./usePanditAI";
import useSpeechToText from "./useSpeechToText";
import toast from "../toast";
import { translateText } from "./translateText";
import panditAiIcon from "../../assets/images/AiPandit.png";

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
];

const TRANSLATION_DEBOUNCE_MS = 700;

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
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en-IN");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [interimText, setInterimText] = useState("");
  const inputRef = useRef(null);
  const translationRequestRef = useRef(0);
  const langRef = useRef(lang);
  langRef.current = lang;
  const lastTranslationRef = useRef({
    source: "",
    targetLanguage: "",
    result: "",
  });

  const {
    messages,
    isLoading,
    sending,
    sendText,
    messagesEndRef,
  } = usePanditAI({ isOpen, lang });

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

  const handleSpeechResult = useCallback(async (transcript) => {
    setInterimText("");
    const currentLang = langRef.current;
    // If speech lang (hi-IN) matches selected lang, no translation needed
    if (currentLang === "hi-IN") {
      setText((prev) => (prev ? prev + " " + transcript : transcript));
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    // Translate before showing in input
    setTranslating(true);
    try {
      const translated = await translateText({
        text: transcript,
        targetLanguage: currentLang,
      });
      setText((prev) => (prev ? prev + " " + translated : translated));
    } catch {
      // Fallback to raw transcript if translation fails
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    } finally {
      setTranslating(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const handleInterim = useCallback((transcript) => {
    // Don't show raw interim text — it'll be in Hindi (speech lang)
    // Just show a generic "Listening..." indicator instead
    setInterimText("...");
  }, []);

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechToText({ onResult: handleSpeechResult, onInterim: handleInterim });

  // Debounced auto-translation when text or lang changes
  useEffect(() => {
    const textToTranslate = text.trim();
    if (!textToTranslate || sending || isLoading) return undefined;

    const lastT = lastTranslationRef.current;
    if (
      lastT.targetLanguage === lang &&
      (lastT.result === textToTranslate || lastT.source === textToTranslate)
    ) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      const latest = lastTranslationRef.current;
      if (
        latest.targetLanguage === lang &&
        (latest.source === textToTranslate || latest.result === textToTranslate)
      ) {
        return;
      }

      const requestId = ++translationRequestRef.current;
      setTranslating(true);

      try {
        const translatedText = await translateText({
          text: textToTranslate,
          targetLanguage: lang,
        });

        lastTranslationRef.current = {
          source: textToTranslate,
          targetLanguage: lang,
          result: translatedText,
        };

        if (translationRequestRef.current !== requestId) return;

        setText((cur) => (cur.trim() === textToTranslate ? translatedText : cur));
      } catch (error) {
        console.error("[PanditAI] Translation error:", error);
      } finally {
        if (translationRequestRef.current === requestId) {
          setTranslating(false);
        }
      }
    }, TRANSLATION_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [isLoading, lang, sending, text]);

  const handleSend = useCallback(() => {
    if (text.trim()) {
      stopListening();
      setInterimText("");
      sendText(text);
      setText("");
    }
  }, [text, sendText, stopListening]);

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

  const handleLanguageSelect = useCallback(
    async (selectedLang) => {
      setLang(selectedLang);
      setShowLangPicker(false);

      const textToTranslate = text.trim();
      if (!textToTranslate) return;

      const requestId = ++translationRequestRef.current;
      setTranslating(true);

      try {
        const translatedText = await translateText({
          text: textToTranslate,
          targetLanguage: selectedLang,
        });

        if (translationRequestRef.current !== requestId) return;

        lastTranslationRef.current = {
          source: textToTranslate,
          targetLanguage: selectedLang,
          result: translatedText,
        };

        setText((cur) =>
          cur.trim() === textToTranslate ? translatedText : cur
        );
      } catch (error) {
        console.error("[PanditAI] Translation error:", error);
        toast.error("Could not translate text. Please try again.");
      } finally {
        if (translationRequestRef.current === requestId) {
          setTranslating(false);
        }
      }
    },
    [text]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowLangPicker(false);
  }, []);

  const handleOpen = useCallback(() => setIsOpen(true), []);

  const toggleLangPicker = useCallback(() => setShowLangPicker((p) => !p), []);

  const handleInputChange = useCallback((e) => setText(e.target.value), []);

  const currentLangLabel =
    LANGUAGES.find((l) => l.code === lang)?.label || "English";

  const placeholder = translating
    ? "Translating..."
    : isListening
      ? "Listening..."
      : "Ask Pandit AI...";

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
            {/* <Sparkles size={21} /> */}
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
          <div className={styles.chatWindow} role="dialog" aria-label="Pandit AI Chat">
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.headerAvatar}>
                <Sparkles size={19} />
                {/* <img src={panditAiIcon} alt="icon" /> */}
              </div>
              <div className={styles.headerCopy}>
                <h4 className={styles.headerName}>Pandit AI</h4>
                <span className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  {translating ? "Translating..." : sending ? "Typing..." : "AI Assistant"}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
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
            <div className={styles.inputWrapper}>
              <div className={styles.langWrapper}>
                <button
                  className={styles.langBtn}
                  onClick={toggleLangPicker}
                  aria-label={`Select language, current ${currentLangLabel}`}
                  title={currentLangLabel}
                  type="button"
                  disabled={translating}
                >
                  <Globe size={14} />
                  <span className={styles.langCode}>
                    {translating ? "..." : lang.split("-")[0].toUpperCase()}
                  </span>
                </button>
                {showLangPicker && (
                  <div className={styles.langDropdown}>
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        className={`${styles.langOption} ${lang === l.code ? styles.langActive : ""}`}
                        onClick={() => handleLanguageSelect(l.code)}
                        type="button"
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                className={styles.textInput}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={sending || isLoading}
              />

              {isSupported && (
                <button
                  className={`${styles.micBtn} ${isListening ? styles.micActive : ""}`}
                  onClick={handleMicClick}
                  disabled={sending || isLoading}
                  aria-label={isListening ? "Stop recording" : "Start voice input"}
                  type="button"
                >
                  {isListening ? <IoStopCircle size={18} /> : <IoMic size={18} />}
                </button>
              )}

              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || translating || !text.trim()}
                aria-label="Send message"
                type="button"
              >
                <IoSend size={18} />
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </>,
    document.body
  );
};

export default PanditAIBubble;
