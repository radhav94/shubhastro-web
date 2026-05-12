import { useState, useRef, useCallback, useEffect } from "react";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useSpeechToText({ onResult, onInterim, onEnd }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const lastInterimRef = useRef("");
  const manualStopRef = useRef(false);

  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const onEndRef = useRef(onEnd);
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;
  onEndRef.current = onEnd;

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
    // hi-IN recognizes Hindi/Hinglish and outputs in Devanagari script
    recognition.lang = "hi-IN";
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
        onResultRef.current?.(finalTranscript.trim());
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
      // If mic stopped automatically (not manual), flush interim and notify
      if (!manualStopRef.current) {
        if (lastInterimRef.current) {
          onResultRef.current?.(lastInterimRef.current.trim());
          lastInterimRef.current = "";
        }
        onEndRef.current?.();
      }
      manualStopRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      manualStopRef.current = true;
      if (lastInterimRef.current) {
        onResultRef.current?.(lastInterimRef.current.trim());
        lastInterimRef.current = "";
      }
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    lastInterimRef.current = "";
  }, []);

  return { isListening, isSupported, startListening, stopListening, resetTranscript };
}
