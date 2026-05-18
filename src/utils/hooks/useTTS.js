import { useState, useCallback, useEffect, useRef } from "react";
import { textToSpeech, SARVAM_LANGUAGES } from "../../services/sarvamTTSService";
import { translateText } from "../../component/panditAI/translateText";

const LANG_TO_SARVAM = {
  en: SARVAM_LANGUAGES.ENGLISH,
  hi: SARVAM_LANGUAGES.HINDI,
  bn: SARVAM_LANGUAGES.BENGALI,
  ta: SARVAM_LANGUAGES.TAMIL,
  te: SARVAM_LANGUAGES.TELUGU,
  mr: SARVAM_LANGUAGES.MARATHI,
  gu: SARVAM_LANGUAGES.GUJARATI,
  kn: SARVAM_LANGUAGES.KANNADA,
  ml: SARVAM_LANGUAGES.MALAYALAM,
  pa: SARVAM_LANGUAGES.PUNJABI,
  or: SARVAM_LANGUAGES.ODIA,
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

// Global reference to the currently active TTS instance's stop function.
let activeStopFn = null;

// Cache for TTS audio to avoid redundant API calls
const audioCache = new Map();
const MAX_CACHE_SIZE = 20;

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const speakingRef = useRef(false);
  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);

  const setSpeaking = useCallback((val) => {
    speakingRef.current = val;
    setIsSpeaking(val);
  }, []);

  const stopRef = useRef(null);

  const stop = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
    setIsLoading(false);
    if (activeStopFn === stopRef.current) {
      activeStopFn = null;
    }
  }, [setSpeaking]);

  stopRef.current = stop;

  const speak = useCallback(
    async (text) => {
      if (!text) return;

      if (speakingRef.current) {
        stop();
        return;
      }

      // Stop any other active TTS instance
      if (activeStopFn && activeStopFn !== stopRef.current) {
        activeStopFn();
      }
      activeStopFn = stopRef.current;

      const currentLang = getGoogleTranslateLang();
      const sarvamLang = LANG_TO_SARVAM[currentLang] || SARVAM_LANGUAGES.HINDI;

      setSpeaking(true);
      setIsLoading(true);
      abortRef.current = false;

      try {
        const cacheKey = `${sarvamLang}:${text}`;
        let audioBase64 = audioCache.get(cacheKey);

        if (!audioBase64) {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          // Translate text if language is not English
          let speakText = text;
          if (currentLang !== "en") {
            try {
              const translated = await translateText({ text, targetLanguage: currentLang });
              if (translated) speakText = translated;
            } catch {
              // Fall back to original text if translation fails
            }
          }

          if (abortRef.current) return;

          audioBase64 = await textToSpeech(speakText, {
            language: sarvamLang,
            speaker: "ishita",
            pace: 1.0,
            signal: controller.signal,
          });

          abortControllerRef.current = null;

          // Store in cache, evict oldest if full
          if (audioCache.size >= MAX_CACHE_SIZE) {
            const firstKey = audioCache.keys().next().value;
            audioCache.delete(firstKey);
          }
          audioCache.set(cacheKey, audioBase64);
        }

        if (abortRef.current) return;

        setIsLoading(false);
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        audioRef.current = audio;

        audio.onended = () => {
          audioRef.current = null;
          setSpeaking(false);
        };

        audio.onerror = () => {
          audioRef.current = null;
          setSpeaking(false);
        };

        audio.play();
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Sarvam TTS failed:", error);
        setSpeaking(false);
        setIsLoading(false);
      }
    },
    [stop, setSpeaking]
  );

  useEffect(() => {
    const handleLangChange = () => stop();
    window.addEventListener("translationchange", handleLangChange);
    return () => window.removeEventListener("translationchange", handleLangChange);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return { speak, stop, isSpeaking, isLoading };
};

export default useTTS;
