import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneOff, MessageSquare, X } from "lucide-react";
import styles from "./AstrologerRingModal.module.scss";
import { getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const RING_TIMEOUT = 60; // seconds

/**
 * AstrologerRingModal — shown when astrologer accepts and user must accept/reject.
 *
 * Props:
 *  - data: { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency }
 *  - onAccept(roomId)
 *  - onReject(roomId)
 *  - onDismiss()  — just close the modal without canceling
 *  - onTimeout(roomId)  — called when 60s expires locally (server also sends on_hold)
 *  - variant: "modal" | "toast"  — "toast" renders as a non-blocking banner
 */
const AstrologerRingModal = ({ data, onAccept, onReject, onDismiss, onTimeout, variant = "modal" }) => {
  const [countdown, setCountdown] = useState(RING_TIMEOUT);
  const timerRef = useRef(null);
  const hasTimedOut = useRef(false);

  const roomId = data?.roomId;
  const astrologer = data?.astrologerDetail || {};
  const type = data?.type || "audio";
  const isEmergency = data?.isEmergency || false;

  const name = getAstrologerDisplayName(astrologer) || "Astrologer";
  const imageUrl = getAstrologerImageUrl(astrologer);

  // Start countdown
  useEffect(() => {
    if (!data) return;
    hasTimedOut.current = false;
    setCountdown(RING_TIMEOUT);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (!hasTimedOut.current) {
            hasTimedOut.current = true;
            onTimeout?.(roomId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data?.roomId]);

  const handleAccept = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onAccept?.(roomId);
  }, [roomId, onAccept]);

  const handleReject = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onReject?.(roomId);
  }, [roomId, onReject]);

  const handleDismiss = useCallback(() => {
    // Just close the modal — don't cancel the session
    // User can still accept/reject from the StickyWaitingQueue
    onDismiss?.();
  }, [onDismiss]);

  if (!data) return null;

  const typeLabel = type === "chat" ? "Chat" : type === "video" ? "Video Call" : "Voice Call";
  const TypeIcon = type === "chat" ? MessageSquare : Phone;

  // Progress for the countdown ring
  const progress = countdown / RING_TIMEOUT;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - progress);

  const content = (
    <div className={variant === "toast" ? styles.toastContainer : styles.overlay}>
      <div className={variant === "toast" ? styles.toastCard : styles.modal}>
        {variant === "modal" && (
          <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
            <X size={18} />
          </button>
        )}

        <div className={styles.profileSection}>
          <div className={styles.avatarRing}>
            <svg className={styles.countdownRing} viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#e0e0e0" strokeWidth="3" />
              <circle
                cx="48" cy="48" r="44"
                fill="none"
                stroke={isEmergency ? "#F75801" : "#4CAF50"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 48 48)"
                className={styles.progressCircle}
              />
            </svg>
            <img
              src={imageUrl}
              alt={name}
              className={styles.avatar}
              onError={(e) => { e.target.src = getAstrologerDefaultImage(astrologer.gender); }}
            />
          </div>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.typeLabel}>
            {isEmergency && <span className={styles.emergencyTag}>Emergency</span>}
            {typeLabel} Request Accepted
          </p>
          <p className={styles.countdown}>{countdown}s</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.rejectBtn} onClick={handleReject} aria-label="Reject">
            <PhoneOff size={22} />
            <span>Decline</span>
          </button>
          <button className={styles.acceptBtn} onClick={handleAccept} aria-label="Accept">
            <TypeIcon size={22} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AstrologerRingModal;
