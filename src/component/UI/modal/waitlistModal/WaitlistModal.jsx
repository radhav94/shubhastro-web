import { useState, useEffect, useRef } from "react";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { getUserFromStorage } from "../../../../utils/authStorage";
import styles from "./WaitlistModal.module.scss";

const WaitlistModal = ({ show, callRoomId, resetCallState, onClose, connectionType, waitTime, offlineUsers }) => {
  const [elapsed, setElapsed] = useState(0);
  const [showOffline, setShowOffline] = useState(false);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const user = getUserFromStorage();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";
  const initials = fullName.split(" ").map(w => w.charAt(0).toUpperCase()).join("").slice(0, 2);

  // Start timer once when callRoomId is set, never reset on show/hide
  useEffect(() => {
    if (callRoomId && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    if (!callRoomId) {
      startTimeRef.current = null;
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [callRoomId]);

  if (!show) return null;

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  const handleCancel = () => {
    if (callRoomId) {
      if (connectionType === "chat") {
        voiceSocket.emit("chat:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      } else {
        voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      }
    }
    resetCallState();
  };

  const estimatedWait = waitTime || (connectionType === "chat" ? 2 : 5);
  const offlineCount = offlineUsers || 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Waitlist</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>

        <p className={styles.description}>
          You are in the waitlist. Please wait while the astrologer connects with you.
        </p>

        <div className={styles.userRow}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initials}</div>
            <span className={styles.userName}>{fullName}</span>
          </div>
          <div className={styles.timer}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>{mins}m {secs}s</span>
          </div>
        </div>

        {offlineCount > 0 && (
          <button className={styles.offlineToggle} onClick={() => setShowOffline(!showOffline)}>
            +{offlineCount} Offline users
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showOffline ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        <div className={styles.divider} />

        <div className={styles.waitTimeRow}>
          <span className={styles.waitLabel}>Wait Time :</span>
          <span className={styles.waitValue}>~{estimatedWait} min</span>
        </div>

        <button className={styles.joinBtn} onClick={handleCancel}>
          Cancel Waitlist
        </button>
      </div>
    </div>
  );
};

export default WaitlistModal;
