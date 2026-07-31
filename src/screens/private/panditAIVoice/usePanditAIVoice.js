import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../../services/voiceSocketServices";
import {
  useCreateChatRoomMutation,
} from "../../../redux/api/chatApi";
import { textToSpeech, SARVAM_LANGUAGES, SARVAM_SPEAKERS } from "../../../services/sarvamTTSService";
import useSarvamSTT from "./useSarvamSTT";
import { setPanditAIChatActive } from "../../../component/panditAI/usePanditAI";
import toast from "../../../component/toast";

export const PANDIT_AI_ID = "6928390dc00d56953b586c04";

// A valid, silent WAV used to "unlock" audio playback on iOS Safari. iOS only
// allows programmatic audio.play() after an element has been played once inside
// a real user gesture. We prime a single reusable element with this clip on the
// user's tap, then reuse that same element for TTS playback.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// Map language codes from backend response to Sarvam TTS language codes
const LANG_CODE_TO_SARVAM = {
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
};

// Detect language from text using Unicode script ranges
function detectLanguageFromText(text) {
  if (!text) return "hi";

  // Check for script-specific characters
  const tamil = /[\u0B80-\u0BFF]/;
  const telugu = /[\u0C00-\u0C7F]/;
  const kannada = /[\u0C80-\u0CFF]/;
  const malayalam = /[\u0D00-\u0D7F]/;
  const bengali = /[\u0980-\u09FF]/;
  const gujarati = /[\u0A80-\u0AFF]/;
  const punjabi = /[\u0A00-\u0A7F]/;
  const devanagari = /[\u0900-\u097F]/;
  const latin = /[a-zA-Z]/;

  if (tamil.test(text)) return "ta";
  if (telugu.test(text)) return "te";
  if (kannada.test(text)) return "kn";
  if (malayalam.test(text)) return "ml";
  if (bengali.test(text)) return "bn";
  if (gujarati.test(text)) return "gu";
  if (punjabi.test(text)) return "pa";
  if (devanagari.test(text)) return "hi"; // Could be Hindi or Marathi — fallback to hi
  if (latin.test(text)) return "en";

  return "hi";
}

export default function usePanditAIVoice({ enabled = true, sharedRoomId = null } = {}) {
  const [status, setStatus] = useState("idle"); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [connecting, setConnecting] = useState(false);

  const roomIdRef = useRef(sharedRoomId || sessionStorage.getItem("panditai_voice_roomId") || null);
  const initiatedRef = useRef(false);
  const audioRef = useRef(null);
  // A single, reusable audio element that we unlock on a user gesture so iOS
  // Safari lets us play TTS audio that arrives later over the socket.
  const unlockedAudioRef = useRef(null);
  const abortRef = useRef(null);
  const pendingMessageRef = useRef(null);
  const sendTextRef = useRef(null);
  const [roomId, setRoomId] = useState(roomIdRef.current);
  const chatEndedRef = useRef(false);
  // When true, unmount won't emit chat:end (session handed back to text chat)
  const skipCleanupRef = useRef(false);
  // Tracks if user has sent at least one voice message — ignore responses before that
  const voiceActiveRef = useRef(!sharedRoomId);

  // Keep voiceActiveRef in sync when sharedRoomId changes (e.g. passed late)
  // Also track when voice mode started to ignore messages arriving immediately after switch
  const voiceModeStartedAt = useRef(Date.now());
  useEffect(() => {
    if (sharedRoomId) {
      voiceActiveRef.current = false;
      voiceModeStartedAt.current = Date.now();
    }
  }, [sharedRoomId]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const [createChatRoom] = useCreateChatRoomMutation();

  // Persist roomId to sessionStorage for reconnect on refresh
  const setRoomIdPersist = useCallback((id) => {
    roomIdRef.current = id;
    setRoomId(id);
    if (id) {
      sessionStorage.setItem("panditai_voice_roomId", id);
    } else {
      sessionStorage.removeItem("panditai_voice_roomId");
    }
  }, []);

  // Initiate chat session on mount
  useEffect(() => {
    if (!enabled || !userIdLocal || initiatedRef.current) return;

    const initChat = async () => {
      setConnecting(true);
      initiatedRef.current = true;
      chatEndedRef.current = false;

      // Ensure socket is connected
      if (!voiceSocket.connected) {
        voiceSocket.io.opts.query = {
          userId: userIdLocal,
          role: "CUSTOMER",
        };
        voiceSocket.connect();
        // The handleSocketReconnect listener will handle the rest once connected
        setConnecting(false);
        return;
      }

      const savedRoomId = sharedRoomId || roomIdRef.current;

      // If we have a roomId (shared from text chat or page refresh), reconnect
      if (savedRoomId) {
        setRoomIdPersist(savedRoomId);
        setPanditAIChatActive(true, savedRoomId);
        voiceSocket.emit("chat:reconnect", {
          roomId: savedRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
        setConnecting(false);
        return;
      }

      try {
        await createChatRoom({
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        }).unwrap();
      } catch (err) {
        console.log("[PanditAIVoice] Room creation:", err?.data?.message || "exists");
      }

      setPanditAIChatActive(true);
      voiceSocket.emit("chat:initiate", {
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
      });
      setConnecting(false);
    };

    initChat();

    // Handle socket reconnect while voice session is active
    const handleSocketReconnect = () => {
      if (chatEndedRef.current) return;
      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        console.log("[PanditAIVoice] Socket reconnected, emitting chat:reconnect");
        setPanditAIChatActive(true, currentRoomId);
        voiceSocket.emit("chat:reconnect", {
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          callType: "chat",
        });
      } else {
        setPanditAIChatActive(true);
        voiceSocket.emit("chat:initiate", {
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
      }
      setConnecting(false);
    };

    voiceSocket.on("connect", handleSocketReconnect);

    return () => {
      voiceSocket.off("connect", handleSocketReconnect);
    };
  }, [enabled, userIdLocal, createChatRoom, setRoomIdPersist]);

  // Seamless text -> voice handover: when a shared room is passed in, reconnect
  // to that exact room (even if voice already initiated its own/empty session),
  // and sync roomId so billing/free-minutes events match.
  useEffect(() => {
    if (!enabled || !sharedRoomId || chatEndedRef.current) return;
    if (roomIdRef.current === sharedRoomId) return; // already on it
    setRoomIdPersist(sharedRoomId);
    setPanditAIChatActive(true, sharedRoomId);
    if (voiceSocket.connected) {
      console.log("[PanditAIVoice] Handover — reconnecting to shared room", sharedRoomId);
      voiceSocket.emit("chat:reconnect", {
        roomId: sharedRoomId,
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
        callType: "chat",
      });
    }
  }, [enabled, sharedRoomId, userIdLocal, setRoomIdPersist]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // If handing back to text chat, don't end the session
      if (skipCleanupRef.current) {
        skipCleanupRef.current = false;
        initiatedRef.current = false;
        if (abortRef.current) abortRef.current.abort();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
          audioRef.current = null;
        }
        return;
      }
      const currentRoomId = roomIdRef.current;
      if (currentRoomId && voiceSocket.connected) {
        voiceSocket.emit("chat:end", {
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
      }
      chatEndedRef.current = true;
      setRoomIdPersist(null);
      initiatedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
    };
  }, [userIdLocal, setRoomIdPersist]);

  // Socket event listeners — only active when voice session is enabled
  useEffect(() => {
    if (!enabled) return;

    const handleChatRoom = (data) => {
      console.log("[PanditAIVoice] chat:room received", data);
      if (data?.roomId) {
        setRoomIdPersist(data.roomId);
        setPanditAIChatActive(true, data.roomId);
      }
    };

    const handleChatAccepted = (data) => {
      console.log("[PanditAIVoice] chat:accepted received", data);
      if (data?.roomId) {
        setRoomIdPersist(data.roomId);
        setPanditAIChatActive(true, data.roomId);
        const pending = pendingMessageRef.current;
        if (pending) {
          pendingMessageRef.current = null;
          sendTextRef.current?.(pending);
        }
      }
    };

    const handleMessage = async (data) => {
      console.log("[PanditAIVoice] message:recieved", data);
      console.log("[PanditAIVoice] language fields:", {
        languageCode: data.languageCode,
        language: data.language,
        targetLanguage: data.targetLanguage,
        targetLanguageName: data.targetLanguageName,
      });
      if (data?.astrologerId !== PANDIT_AI_ID && data?.sender !== PANDIT_AI_ID) return;
      if (data.sender === "user") return;

      // If session was ended, ignore incoming messages
      if (chatEndedRef.current) return;

      // If shared session and user hasn't spoken yet, ignore (pending text chat response)
      if (!voiceActiveRef.current) {
        console.log("[PanditAIVoice] Ignoring message — voice not yet active (voiceActiveRef:", voiceActiveRef.current, ")");
        return;
      }

      // Extra guard: ignore messages arriving within 3s of voice mode start (stale text responses)
      if (Date.now() - voiceModeStartedAt.current < 3000) {
        console.log("[PanditAIVoice] Ignoring message — too soon after voice mode start");
        return;
      }

      const responseText = data.message || data.response;
      setAiResponse(responseText);

      // Stop any currently playing audio before starting new one
      if (abortRef.current) abortRef.current.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }

      // Use the user's STT-detected language as primary for TTS
      // Fallback to backend response fields, then text detection
      const detectedLangCode =
        detectedLangRef.current ||
        data.languageCode ||
        data.targetLanguage ||
        data.language?.split("-")?.[0] ||
        detectLanguageFromText(responseText);
      const ttsLanguage = LANG_CODE_TO_SARVAM[detectedLangCode] || SARVAM_LANGUAGES.HINDI;
      console.log("[PanditAIVoice] TTS language resolved:", detectedLangCode, "→", ttsLanguage);

      // Convert response to speech via Sarvam TTS
      try {
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        const audioBase64 = await textToSpeech(responseText, {
          language: ttsLanguage,
          speaker: SARVAM_SPEAKERS.PRIYA,
          pace: 1.25,
          signal,
        });

        // Check if session was ended while TTS was loading
        if (chatEndedRef.current || signal.aborted) return;

        const audioBlob = base64ToBlob(audioBase64, "audio/wav");
        const audioUrl = URL.createObjectURL(audioBlob);
        // Reuse the element unlocked during the user's tap so iOS Safari allows
        // this programmatic playback. Fall back to a fresh element otherwise.
        const audio = unlockedAudioRef.current || new Audio();
        audio.playsInline = true;
        audio.src = audioUrl;
        audioRef.current = audio;

        audio.onended = () => {
          setStatus("idle");
          URL.revokeObjectURL(audioUrl);
          if (audioRef.current === audio) audioRef.current = null;
        };

        audio.onerror = () => {
          setStatus("idle");
          URL.revokeObjectURL(audioUrl);
          if (audioRef.current === audio) audioRef.current = null;
        };

        setStatus("speaking");
        await audio.play();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[PanditAIVoice] TTS error:", err);
          toast.error("Failed to play audio response");
        }
        setStatus("idle");
      }
    };

    const handleError = (err) => {
      console.error("[PanditAIVoice] Socket error:", err);
      if (err?.code === "CONTENT_BLOCKED") {
        toast.error("Message was blocked. Please try a different question.");
      }
      setStatus("idle");
    };

    const handleReconnected = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      console.log("[PanditAIVoice] Chat reconnected:", data?.roomId);
      if (data?.roomId) {
        setRoomIdPersist(data.roomId);
        setPanditAIChatActive(true, data.roomId);
        chatEndedRef.current = false;
      }
    };

    const handleChatEnded = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      chatEndedRef.current = true;
      setRoomIdPersist(null);
      setPanditAIChatActive(false, null);
      initiatedRef.current = false;
      setStatus("idle");
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("chat:reconnected", handleReconnected);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("message:recieved", handleMessage);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("chat:reconnected", handleReconnected);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("message:recieved", handleMessage);
      voiceSocket.off("error", handleError);
    };
  }, [enabled]);

  // Send text message via socket
  const sendText = useCallback(
    (text, sttLangCode) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Mark voice as active — now responses should be spoken
      voiceActiveRef.current = true;
      // Reset the start timestamp so the 3s guard doesn't block legitimate responses
      voiceModeStartedAt.current = 0;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) {
        pendingMessageRef.current = trimmed;
        return;
      }

      setStatus("processing");
      setTranscript(trimmed);

      // Use Sarvam STT detected language, or fallback to script detection
      const detectedCode = sttLangCode || detectLanguageFromText(trimmed);
      const LANG_NAMES = { en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi" };
      const LANG_LOCALES = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN" };

      if (voiceSocket.connected) {
        console.log("[PanditAIVoice] Sending chat:message", { roomId: currentRoomId, message: trimmed, detectedLang: detectedCode });
        voiceSocket.emit("chat:message", {
          sender: "user",
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          message: trimmed,
          type: "message",
          language: LANG_LOCALES[detectedCode] || "hi-IN",
          languageCode: detectedCode,
          targetLanguage: detectedCode,
          targetLanguageName: LANG_NAMES[detectedCode] || "Hindi",
        });
      } else {
        toast.error("Connection lost. Please try again.");
        setStatus("idle");
      }
    },
    [userIdLocal]
  );

  sendTextRef.current = sendText;

  // Sarvam STT result handler — receives transcript and detected language
  const detectedLangRef = useRef("hi");

  const handleSTTResult = useCallback((transcript, languageCode) => {
    if (!transcript?.trim()) return;
    setTranscript(transcript.trim());
    // Store detected language for sendText to use
    detectedLangRef.current = languageCode || detectLanguageFromText(transcript);
  }, []);

  const handleSTTEnd = useCallback((result) => {
    const text = result?.transcript?.trim();
    console.log("[PanditAIVoice] handleSTTEnd called:", { text, language_code: result?.language_code, roomId: roomIdRef.current });
    if (text) {
      const langCode = result.language_code || detectLanguageFromText(text);
      detectedLangRef.current = langCode;
      sendTextRef.current?.(text, langCode);
    } else {
      // No speech detected, go back to idle
      setStatus("idle");
    }
  }, []);

  const { isListening, isSupported, startListening, stopListening } = useSarvamSTT({
    onResult: handleSTTResult,
    onEnd: handleSTTEnd,
  });

  // Unlock audio playback for iOS Safari. Must be called from within a user
  // gesture (e.g. the tap that starts/stops the mic). It primes a single
  // reusable <audio> element by playing a silent clip; that element is then
  // reused for TTS playback so iOS won't block the later play() call.
  const ensureAudioUnlocked = useCallback(() => {
    try {
      if (!unlockedAudioRef.current) {
        const a = new Audio();
        a.playsInline = true;
        a.setAttribute("playsinline", "");
        a.preload = "auto";
        unlockedAudioRef.current = a;
      }
      const a = unlockedAudioRef.current;
      if (a._unlocked) return;
      a.src = SILENT_WAV;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a._unlocked = true;
        }).catch(() => {
          /* Priming failed (rare) — playback will fall back to a new Audio(). */
        });
      }
    } catch {
      /* no-op */
    }
  }, []);

  // Toggle mic
  const toggleListening = useCallback(() => {
    // Runs inside the user's tap — unlock audio so iOS allows TTS playback.
    ensureAudioUnlocked();

    if (status === "speaking") {
      // Stop current audio playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortRef.current) abortRef.current.abort();
      setStatus("idle");
      return;
    }

    if (isListening) {
      // Stop recording — let onstop handler process the audio and call sendText
      stopListening();
      setStatus("processing");
    } else {
      setTranscript("");
      setAiResponse("");
      startListening();
      setStatus("listening");
    }
  }, [isListening, status, startListening, stopListening, ensureAudioUnlocked]);

  // Update status when listening state changes
  useEffect(() => {
    if (isListening) {
      setStatus("listening");
    } else if (status === "listening") {
      // Auto-stopped (silence detection) — move to processing
      setStatus("processing");
    }
  }, [isListening]);

  // End session explicitly (called on popup close)
  const endSession = useCallback(() => {
    // Stop any active recording first
    stopListening();

    const currentRoomId = roomIdRef.current;
    if (currentRoomId && voiceSocket.connected) {
      voiceSocket.emit("chat:end", {
        roomId: currentRoomId,
        userId: userIdLocal,
        astrologerId: PANDIT_AI_ID,
      });
    }
    chatEndedRef.current = true;
    setRoomIdPersist(null);
    initiatedRef.current = false;
    setPanditAIChatActive(false, null);
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setStatus("idle");
  }, [userIdLocal, setRoomIdPersist, stopListening]);

  // Mark cleanup as skippable (used when handing back to text chat)
  const markSkipCleanup = useCallback(() => {
    skipCleanupRef.current = true;
  }, []);

  // Stop audio playback without ending session
  const stopAudio = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setStatus("idle");
  }, []);

  return {
    status,
    transcript,
    aiResponse,
    toggleListening,
    isSupported,
    connecting,
    roomId,
    endSession,
    markSkipCleanup,
    stopAudio,
  };
}

function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}
