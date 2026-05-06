import { useState, useCallback, useEffect, useRef } from "react";
import { translateText } from "../../component/panditAI/translateText";

const LANG_TO_LOCALE = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
  mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
  ar: "ar-SA", fr: "fr-FR", de: "de-DE", es: "es-ES", it: "it-IT",
  pl: "pl-PL", sv: "sv-SE", da: "da-DK", cs: "cs-CZ", id: "id-ID",
  ms: "ms-MY", my: "my-MM", th: "th-TH", tr: "tr-TR",
};

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

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const watchdogRef = useRef(null);
  const speakingRef = useRef(false);
  const busyRef = useRef(false);

  const setSpeaking = useCallback((val) => {
    speakingRef.current = val;
    setIsSpeaking(val);
  }, []);

  const startWatchdog = useCallback(() => {
    clearInterval(watchdogRef.current);
    watchdogRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking && !busyRef.current) {
        setSpeaking(false);
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
    }, 500);
  }, [setSpeaking]);

  const stopWatchdog = useCallback(() => {
    clearInterval(watchdogRef.current);
    watchdogRef.current = null;
  }, []);

  const stop = useCallback(() => {
    busyRef.current = false;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    stopWatchdog();
  }, [setSpeaking, stopWatchdog]);

  const speak = useCallback(
    (text) => {
      if (!text || !window.speechSynthesis) return;

      if (speakingRef.current || busyRef.current) {
        stop();
        return;
      }

      const currentLang = getGoogleTranslateLang();
      const locale = LANG_TO_LOCALE[currentLang] || `${currentLang}-${currentLang.toUpperCase()}`;

      const doSpeak = (speakText) => {
        if (!speakingRef.current) {
          busyRef.current = false;
          return;
        }

        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.lang = locale;
        utterance.rate = 0.95;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const voice = findVoice(locale, voices);
        if (voice) utterance.voice = voice;

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        utteranceRef.current = utterance;

        busyRef.current = false;
        window.speechSynthesis.speak(utterance);
        startWatchdog();
      };

      setSpeaking(true);

      if (currentLang === "en") {
        doSpeak(text);
      } else {
        busyRef.current = true;
        translateText({ text, targetLanguage: currentLang })
          .then((translated) => doSpeak(translated || text))
          .catch(() => doSpeak(text));
      }
    },
    [stop, setSpeaking, startWatchdog]
  );

  useEffect(() => {
    const handleLangChange = () => stop();
    window.addEventListener("translationchange", handleLangChange);
    return () => window.removeEventListener("translationchange", handleLangChange);
  }, [stop]);

  useEffect(() => {
    const cancelSpeech = () => {
      window.speechSynthesis.cancel();
      stopWatchdog();
    };
    window.addEventListener("beforeunload", cancelSpeech);
    return () => {
      cancelSpeech();
      window.removeEventListener("beforeunload", cancelSpeech);
    };
  }, [stopWatchdog]);

  return { speak, stop, isSpeaking };
};

export default useTTS;
