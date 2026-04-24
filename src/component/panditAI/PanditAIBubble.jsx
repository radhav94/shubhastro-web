import { useState, useCallback, useEffect, useRef } from "react";
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
import panditAiIcon from "../../assets/images/AiPandit.svg";

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

const PanditAIBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en-IN");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [translating, setTranslating] = useState(false);
  const translationRequestRef = useRef(0);
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
      if (query?.trim()) {
        setIsOpen(true);
        sendText(query.trim());
      }
    };
    window.addEventListener("panditai:ask", handleOpenAndSend);
    return () => window.removeEventListener("panditai:ask", handleOpenAndSend);
  }, [sendText]);

  const handleSpeechResult = useCallback(
    (transcript) => {
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    },
    []
  );

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechToText({ lang, onResult: handleSpeechResult });

  useEffect(() => {
    const textToTranslate = text.trim();

    if (!textToTranslate || sending || isLoading) return undefined;

    const lastTranslation = lastTranslationRef.current;
    const alreadyTranslated =
      lastTranslation.targetLanguage === lang &&
      lastTranslation.result === textToTranslate;

    const alreadyTried =
      lastTranslation.targetLanguage === lang &&
      lastTranslation.source === textToTranslate;

    if (alreadyTranslated || alreadyTried) return undefined;

    const timeoutId = setTimeout(async () => {
      const latestTranslation = lastTranslationRef.current;
      if (
        latestTranslation.targetLanguage === lang &&
        (latestTranslation.source === textToTranslate ||
          latestTranslation.result === textToTranslate)
      ) {
        return;
      }

      const requestId = translationRequestRef.current + 1;
      translationRequestRef.current = requestId;
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

        setText((currentText) =>
          currentText.trim() === textToTranslate ? translatedText : currentText
        );
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
      sendText(text);
      setText("");
    }
  }, [text, sendText]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageSelect = async (selectedLang) => {
    setLang(selectedLang);
    setShowLangPicker(false);

    const textToTranslate = text.trim();
    if (!textToTranslate) return;

    const requestId = translationRequestRef.current + 1;
    translationRequestRef.current = requestId;
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

      setText((currentText) =>
        currentText.trim() === textToTranslate ? translatedText : currentText
      );
    } catch (error) {
      console.error("[PanditAI] Translation error:", error);
      toast.error("Could not translate text. Please try again.");
    } finally {
      if (translationRequestRef.current === requestId) {
        setTranslating(false);
      }
    }
  };

  const currentLangLabel =
    LANGUAGES.find((l) => l.code === lang)?.label || "English";

  return (
    <>
      {/* Floating Bubble */}
      {!isOpen && (
        <button
          className={styles.bubble}
          onClick={() => setIsOpen(true)}
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

      {/* Chat Window */}
      {isOpen && (
        <div
          className={styles.chatWindow}
          role="dialog"
          aria-label="Pandit AI Chat"
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.headerAvatar}>
                {/* <Sparkles size={19} /> */}
                <img src={panditAiIcon} alt="icon" />
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
                onClick={() => {
                  setIsOpen(false);
                  setShowLangPicker(false);
                }}
                aria-label="Close chat"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
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
              messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg._id}
                    className={`${styles.msgRow} ${isUser ? styles.userRow : styles.aiRow}`}
                  >
                    <div
                      className={`${styles.msgBubble} ${isUser ? styles.userBubble : styles.aiBubble}`}
                    >
                      <p className={styles.msgText}>{msg.text}</p>
                      <div className={styles.msgMeta}>
                        <span className={styles.msgTime}>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputBar}>
            <div className={styles.inputWrapper}>
              <div className={styles.langWrapper}>
                <button
                  className={styles.langBtn}
                  onClick={() => setShowLangPicker((p) => !p)}
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
                className={styles.textInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={translating ? "Translating..." : "Ask Pandit AI..."}
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
      )}
    </>
  );
};

export default PanditAIBubble;
