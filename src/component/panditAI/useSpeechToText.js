import { useState, useRef, useCallback, useEffect } from "react";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useSpeechToText({ lang = "hi-IN", onResult, onInterim }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const lastInterimRef = useRef("");

  // Keep callbacks in refs so startListening/stopListening stay stable
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const langRef = useRef(lang);
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;
  langRef.current = lang;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    finalTranscriptRef.current = "";
    lastInterimRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = langRef.current;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        lastInterimRef.current = "";
        onResultRef.current?.(finalTranscript);
      } else if (interimTranscript) {
        lastInterimRef.current = interimTranscript;
        onInterimRef.current?.(interimTranscript);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "aborted") {
        console.warn("[SpeechToText] error:", e.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      if (lastInterimRef.current) {
        onResultRef.current?.(lastInterimRef.current);
        lastInterimRef.current = "";
      }
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
