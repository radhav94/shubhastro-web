import { useEffect, useRef, useState, useCallback } from "react";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import socketService from "../../../../../services/socketService";

const IDLE_DEBOUNCE_MS = 2000;
const AUTO_EXPIRE_MS = 5000;

/**
 * Hook that manages typing indicator logic:
 * - Emits activity:update events with debounce (user side)
 * - Listens for activity events from astrologer
 * - Auto-expires typing indicator if no idle arrives
 * - Cleans up on unmount / chat exit
 */
export default function useTypingIndicator({ roomId, sender = "user" }) {
  const [isTyping, setIsTyping] = useState(false);

  const isCurrentlyTypingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const autoExpireTimerRef = useRef(null);

  const emitActivity = useCallback((activity) => {
    if (!roomId) return;

    const payload = { roomId, activity, sender };

    // Prefer socketService if connected, fallback to voiceSocket
    if (socketService.socket?.connected) {
      socketService.sendActivity(payload);
    } else if (voiceSocket.connected) {
      voiceSocket.emit("activity:update", payload);
    }
  }, [roomId, sender]);

  // Called on every text input change
  const handleTextChange = useCallback(() => {
    if (!roomId) return;

    // Only emit "typing" once when user starts typing
    if (!isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = true;
      emitActivity("typing");
    }

    // Reset the idle debounce on every keystroke
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      isCurrentlyTypingRef.current = false;
      emitActivity("idle");
    }, IDLE_DEBOUNCE_MS);
  }, [roomId, emitActivity]);

  // Called when user sends a message
  const handleMessageSent = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;

    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false;
      emitActivity("idle");
    }
  }, [emitActivity]);

  // Called on unmount / navigation away
  const cleanup = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    clearTimeout(autoExpireTimerRef.current);
    debounceTimerRef.current = null;
    autoExpireTimerRef.current = null;

    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false;
      emitActivity("idle");
    }

    setIsTyping(false);
  }, [emitActivity]);

  // Listen for activity events from the other party
  useEffect(() => {
    if (!roomId) return;

    const handleActivity = ({ roomId: eventRoomId, activity, sender: eventSender }) => {
      // Only process events for current room from the other party
      if (eventRoomId !== roomId) return;
      if (eventSender === sender) return; // ignore own events

      if (activity === "typing") {
        setIsTyping(true);

        // Auto-expire after 5s (safety net if idle never arrives)
        clearTimeout(autoExpireTimerRef.current);
        autoExpireTimerRef.current = setTimeout(() => {
          setIsTyping(false);
        }, AUTO_EXPIRE_MS);
      } else {
        setIsTyping(false);
        clearTimeout(autoExpireTimerRef.current);
        autoExpireTimerRef.current = null;
      }
    };

    // Hide typing when a message is received from the other party
    const handleMessageReceived = (data) => {
      if (data?.sender !== sender) {
        setIsTyping(false);
        clearTimeout(autoExpireTimerRef.current);
        autoExpireTimerRef.current = null;
      }
    };

    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("message:recieved", handleMessageReceived);

    return () => {
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("message:recieved", handleMessageReceived);
      cleanup();
    };
  }, [roomId, sender, cleanup]);

  return { isTyping, handleTextChange, handleMessageSent, cleanup };
}
