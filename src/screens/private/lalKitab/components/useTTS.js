import { useState, useCallback, useEffect, useRef } from "react";

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) return;

    // If already speaking, stop
    if (window.speechSynthesis.speaking) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, isSpeaking };
};

export default useTTS;
