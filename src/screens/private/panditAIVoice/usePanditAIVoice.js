import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../../services/voiceSocketServices";
import {
  useCreateChatRoomMutation,
  useGetChatHistoryQuery,
} from "../../../redux/api/chatApi";
import { textToSpeech, SARVAM_LANGUAGES, SARVAM_SPEAKERS } from "../../../services/sarvamTTSService";
import useSpeechToText from "../../../component/panditAI/useSpeechToText";
import { transliterateToLatin } from "../../../component/panditAI/translateText";
import toast from "../../../component/toast";

export const PANDIT_AI_ID = "6928390dc00d56953b586c04";

const LANGUAGE_OPTIONS = [
  { code: "en", locale: "en-IN", name: "English", label: "EN", sarvamCode: SARVAM_LANGUAGES.ENGLISH },
  { code: "hi", locale: "hi-IN", name: "Hindi", label: "HI", sarvamCode: SARVAM_LANGUAGES.HINDI },
  { code: "bn", locale: "bn-IN", name: "Bengali", label: "BN", sarvamCode: SARVAM_LANGUAGES.BENGALI },
  { code: "ta", locale: "ta-IN", name: "Tamil", label: "TA", sarvamCode: SARVAM_LANGUAGES.TAMIL },
  { code: "te", locale: "te-IN", name: "Telugu", label: "TE", sarvamCode: SARVAM_LANGUAGES.TELUGU },
  { code: "mr", locale: "mr-IN", name: "Marathi", label: "MR", sarvamCode: SARVAM_LANGUAGES.MARATHI },
  { code: "gu", locale: "gu-IN", name: "Gujarati", label: "GU", sarvamCode: SARVAM_LANGUAGES.GUJARATI },
  { code: "kn", locale: "kn-IN", name: "Kannada", label: "KN", sarvamCode: SARVAM_LANGUAGES.KANNADA },
  { code: "ml", locale: "ml-IN", name: "Malayalam", label: "ML", sarvamCode: SARVAM_LANGUAGES.MALAYALAM },
  { code: "pa", locale: "pa-IN", name: "Punjabi", label: "PA", sarvamCode: SARVAM_LANGUAGES.PUNJABI },
];

export { LANGUAGE_OPTIONS };

export default function usePanditAIVoice() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_OPTIONS[0]);
  const [status, setStatus] = useState("idle"); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [connecting, setConnecting] = useState(false);

  const roomIdRef = useRef(null);
  const initiatedRef = useRef(false);
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const pendingMessageRef = useRef(null);
  const sendTextRef = useRef(null);
  const [roomId, setRoomId] = useState(null);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const [createChatRoom] = useCreateChatRoomMutation();

  // Initiate chat session on mount
  useEffect(() => {
    if (!userIdLocal || initiatedRef.current) return;

    const initChat = async () => {
      setConnecting(true);
      initiatedRef.current = true;

      // Ensure socket is connected
      if (!voiceSocket.connected) {
        voiceSocket.io.opts.query = {
          userId: userIdLocal,
          role: "CUSTOMER",
        };
        voiceSocket.connect();
      }

      try {
        await createChatRoom({
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        }).unwrap();
      } catch (err) {
        console.log("[PanditAIVoice] Room creation:", err?.data?.message || "exists");
      }

      // Wait for socket to connect before emitting
      const emitInitiate = () => {
        console.log("[PanditAIVoice] Emitting chat:initiate");
        voiceSocket.emit("chat:initiate", {
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
        setConnecting(false);
      };

      if (voiceSocket.connected) {
        emitInitiate();
      } else {
        voiceSocket.once("connect", emitInitiate);
      }
    };

    initChat();
  }, [userIdLocal, createChatRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentRoomId = roomIdRef.current;
      if (currentRoomId && voiceSocket.connected) {
        voiceSocket.emit("chat:end", {
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
        });
      }
      roomIdRef.current = null;
      initiatedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [userIdLocal]);

  // Socket event listeners
  useEffect(() => {
    const handleChatRoom = (data) => {
      console.log("[PanditAIVoice] chat:room received", data);
      if (data?.roomId) {
        roomIdRef.current = data.roomId;
        setRoomId(data.roomId);
      }
    };

    const handleChatAccepted = (data) => {
      console.log("[PanditAIVoice] chat:accepted received", data);
      if (data?.roomId) {
        roomIdRef.current = data.roomId;
        setRoomId(data.roomId);
        const pending = pendingMessageRef.current;
        if (pending) {
          pendingMessageRef.current = null;
          sendTextRef.current?.(pending);
        }
      }
    };

    const handleMessage = async (data) => {
      console.log("[PanditAIVoice] message:recieved", data);
      if (data?.astrologerId !== PANDIT_AI_ID && data?.sender !== PANDIT_AI_ID) return;
      if (data.sender === "user") return;

      const responseText = data.message || data.response;
      setAiResponse(responseText);

      // Convert response to speech via Sarvam TTS
      try {
        abortRef.current = new AbortController();
        const audioBase64 = await textToSpeech(responseText, {
          language: selectedLang.sarvamCode,
          speaker: SARVAM_SPEAKERS.ISHITA,
          pace: 1.0,
          signal: abortRef.current.signal,
        });

        const audioBlob = base64ToBlob(audioBase64, "audio/wav");
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setStatus("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setStatus("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
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

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("message:recieved", handleMessage);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("message:recieved", handleMessage);
      voiceSocket.off("error", handleError);
    };
  }, [selectedLang]);

  // Send text message via socket
  const sendText = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) {
        pendingMessageRef.current = trimmed;
        return;
      }

      setStatus("processing");
      setTranscript(trimmed);

      if (voiceSocket.connected) {
        console.log("[PanditAIVoice] Sending chat:message", { roomId: currentRoomId, message: trimmed });
        voiceSocket.emit("chat:message", {
          sender: "user",
          roomId: currentRoomId,
          userId: userIdLocal,
          astrologerId: PANDIT_AI_ID,
          message: trimmed,
          type: "message",
          language: selectedLang.locale,
          languageCode: selectedLang.code,
          targetLanguage: selectedLang.code,
          targetLanguageName: selectedLang.name,
        });
      } else {
        toast.error("Connection lost. Please try again.");
        setStatus("idle");
      }
    },
    [selectedLang, userIdLocal]
  );

  sendTextRef.current = sendText;

  // Speech-to-text handlers
  const handleSpeechResult = useCallback(async (speechText) => {
    // For non-English languages, send the original script directly
    // Transliteration converts Hindi to Latin which confuses the backend
    if (selectedLang.code === "en") {
      const romanized = await transliterateToLatin(speechText);
      setTranscript((prev) => (prev ? `${prev} ${romanized}` : romanized));
    } else {
      setTranscript((prev) => (prev ? `${prev} ${speechText}` : speechText));
    }
  }, [selectedLang]);

  const handleInterim = useCallback(() => {}, []);

  const handleSpeechEnd = useCallback(() => {
    // Auto-send when speech recognition ends naturally
    setTimeout(() => {
      setTranscript((current) => {
        if (current.trim()) {
          sendTextRef.current?.(current.trim());
          return "";
        }
        return current;
      });
    }, 300);
  }, []);

  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    onResult: handleSpeechResult,
    onInterim: handleInterim,
    onEnd: handleSpeechEnd,
  });

  // Toggle mic
  const toggleListening = useCallback(() => {
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
      stopListening();
      setStatus("idle");
    } else {
      setTranscript("");
      setAiResponse("");
      startListening();
      setStatus("listening");
    }
  }, [isListening, status, startListening, stopListening]);

  // Update status when listening state changes
  useEffect(() => {
    if (isListening) {
      setStatus("listening");
    }
  }, [isListening]);

  return {
    status,
    transcript,
    aiResponse,
    selectedLang,
    setSelectedLang,
    toggleListening,
    isSupported,
    connecting,
    roomId,
    languageOptions: LANGUAGE_OPTIONS,
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
