import { useState, useCallback, useEffect, useRef } from "react";
import { textToSpeech, chunkText, SARVAM_LANGUAGES } from "../../services/sarvamTTSService";
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

// Cache for TTS audio per chunk to avoid redundant API calls
const audioCache = new Map();
const MAX_CACHE_SIZE = 50;

function cacheSet(key, value) {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioCache.keys().next().value;
    audioCache.delete(firstKey);
  }
  audioCache.set(key, value);
}

// status: "idle" | "loading" | "speaking"
const useTTS = () => {
  const [status, setStatus] = useState("idle");
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const stopRef = useRef(null);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setStatus("idle");
    if (activeStopFn === stopRef.current) {
      activeStopFn = null;
    }
  }, []);

  stopRef.current = stop;

  const speak = useCallback(async (text) => {
    if (!text) return;

    // Clean up any previous playback/request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop any other active TTS instance
    if (activeStopFn && activeStopFn !== stopRef.current) {
      activeStopFn();
    }
    activeStopFn = stopRef.current;

    // Capture request ID for staleness checks
    requestIdRef.current += 1;
    const myRequestId = requestIdRef.current;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentLang = getGoogleTranslateLang();
    const sarvamLang = LANG_TO_SARVAM[currentLang] || SARVAM_LANGUAGES.HINDI;

    setStatus("loading");

    try {
      // Translate if needed
      let speakText = text;
      if (currentLang !== "en") {
        try {
          const translated = await translateText({ text, targetLanguage: currentLang });
          if (translated) speakText = translated;
        } catch {
          // Fall back to original text
        }
      }

      if (requestIdRef.current !== myRequestId) return;

      // Split into small chunks for streaming playback
      const chunks = chunkText(speakText);

      // Prefetch first chunk
      const firstCacheKey = `${sarvamLang}:${chunks[0]}`;
      let firstAudio = audioCache.get(firstCacheKey);
      if (!firstAudio) {
        firstAudio = await textToSpeech(chunks[0], {
          language: sarvamLang,
          speaker: "priya",
          pace: 1.25,
          signal: controller.signal,
        });
        cacheSet(firstCacheKey, firstAudio);
      }

      if (requestIdRef.current !== myRequestId) return;

      // Start playing first chunk, prefetch next in background
      setStatus("speaking");

      // Play chunks sequentially: play current, prefetch next
      for (let i = 0; i < chunks.length; i++) {
        if (requestIdRef.current !== myRequestId) return;

        const cacheKey = `${sarvamLang}:${chunks[i]}`;
        let audioBase64 = audioCache.get(cacheKey);

        // First chunk is already fetched above
        if (!audioBase64) {
          audioBase64 = await textToSpeech(chunks[i], {
            language: sarvamLang,
            speaker: "priya",
            pace: 1.25,
            signal: controller.signal,
          });
          cacheSet(cacheKey, audioBase64);
        }

        if (requestIdRef.current !== myRequestId) return;

        // Start prefetching next chunk while current plays
        let nextChunkPromise = null;
        if (i + 1 < chunks.length) {
          const nextCacheKey = `${sarvamLang}:${chunks[i + 1]}`;
          if (!audioCache.has(nextCacheKey)) {
            nextChunkPromise = textToSpeech(chunks[i + 1], {
              language: sarvamLang,
              speaker: "priya",
              pace: 1.25,
              signal: controller.signal,
            }).then((audio) => {
              cacheSet(nextCacheKey, audio);
            }).catch(() => {});
          }
        }

        // Play current chunk and wait for it to finish
        await new Promise((resolve, reject) => {
          const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
          audioRef.current = audio;

          audio.onended = () => {
            audioRef.current = null;
            resolve();
          };
          audio.onerror = (e) => {
            audioRef.current = null;
            reject(e);
          };

          audio.play().catch(reject);
        });

        // Wait for prefetch to complete before moving to next chunk
        if (nextChunkPromise) {
          await nextChunkPromise;
        }
      }

      // All chunks played
      if (requestIdRef.current === myRequestId) {
        setStatus("idle");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (requestIdRef.current !== myRequestId) return;
      console.error("Sarvam TTS failed:", error);
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    const handleLangChange = () => stop();
    window.addEventListener("translationchange", handleLangChange);
    return () => window.removeEventListener("translationchange", handleLangChange);
  }, [stop]);

  // Stop TTS when window is minimized or page loses visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stop]);

  useEffect(() => {
    return () => {
      // Abort any in-flight requests and stop audio on unmount
      requestIdRef.current += 1;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Derive booleans from status for backward compatibility
  const isLoading = status === "loading";
  const isSpeaking = status === "speaking";

  return { speak, stop, isSpeaking, isLoading };
};

export default useTTS;
