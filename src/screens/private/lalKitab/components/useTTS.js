import { useState, useCallback, useEffect, useRef } from "react";
import { translateText } from "../../../../component/panditAI/translateText";

// Map Google Translate language codes to BCP-47 locale tags for speechSynthesis
const LANG_TO_LOCALE = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ar: "ar-SA",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pl: "pl-PL",
  sv: "sv-SE",
  da: "da-DK",
  cs: "cs-CZ",
  id: "id-ID",
  ms: "ms-MY",
  my: "my-MM",
  th: "th-TH",
  tr: "tr-TR",
};

/**
 * Read the current Google Translate language from the googtrans cookie.
 * Returns a short code like "hi", "en", "ta", etc.
 */
const getGoogleTranslateLang = () => {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("googtrans="));
  if (cookie) {
    const value = decodeURIComponent(cookie.split("=")[1]);
    const parts = value.split("/");
    return parts[2] || "en";
  }
  return "en";
};

/**
 * Find the best matching voice for a given locale from available voices.
 */
const findVoice = (locale, voices) => {
  if (!voices.length) return null;
  const lang = locale.split("-")[0];
  return (
    voices.find((v) => v.lang === locale) ||
    voices.find((v) => v.lang.startsWith(lang + "-")) ||
    voices.find((v) => v.lang.startsWith(lang)) ||
    null
  );
};

/**
 * Speak the given text with the correct locale and voice.
 */
const speakWithVoice = (text, locale, setIsSpeaking, utteranceRef) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice = findVoice(locale, voices);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);
  utteranceRef.current = utterance;

  setIsSpeaking(true);
  window.speechSynthesis.speak(utterance);
};

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!text || !window.speechSynthesis) return;

      // If already speaking, stop
      if (window.speechSynthesis.speaking) {
        stop();
        return;
      }

      const currentLang = getGoogleTranslateLang();
      const locale = LANG_TO_LOCALE[currentLang] || `${currentLang}-${currentLang.toUpperCase()}`;

      // If page is in English, speak directly
      if (currentLang === "en") {
        speakWithVoice(text, locale, setIsSpeaking, utteranceRef);
        return;
      }

      // Translate the text first, then speak in the target language
      setIsSpeaking(true);
      translateText({ text, targetLanguage: currentLang })
        .then((translated) => {
          speakWithVoice(translated || text, locale, setIsSpeaking, utteranceRef);
        })
        .catch(() => {
          // Fallback: speak original text with target locale
          speakWithVoice(text, locale, setIsSpeaking, utteranceRef);
        });
    },
    [stop]
  );

  // Stop speech when the translation language changes
  useEffect(() => {
    const handleLangChange = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
    window.addEventListener("translationchange", handleLangChange);
    return () => window.removeEventListener("translationchange", handleLangChange);
  }, []);

  // Cleanup on unmount and on page refresh/navigation
  useEffect(() => {
    const cancelSpeech = () => window.speechSynthesis.cancel();
    window.addEventListener("beforeunload", cancelSpeech);
    return () => {
      cancelSpeech();
      window.removeEventListener("beforeunload", cancelSpeech);
    };
  }, []);

  return { speak, stop, isSpeaking };
};

export default useTTS;
