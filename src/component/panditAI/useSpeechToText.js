import { useState, useRef, useCallback, useEffect } from "react";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useSpeechToText({ lang = "hi-IN", onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef(null);
  const hasResultRef = useRef(false);

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

    hasResultRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult?.(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      hasResultRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      hasResultRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
