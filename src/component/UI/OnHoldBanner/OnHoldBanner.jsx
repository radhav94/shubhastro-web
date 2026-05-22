import { Play, X } from "lucide-react";
import styles from "./OnHoldBanner.module.scss";

/**
 * OnHoldBanner — persistent bottom banner shown when a session is on hold.
 *
 * Props:
 *  - data: { roomId, sessionId, astrologerId, type, message }
 *  - astrologerName: string
 *  - onUnhold(roomId) — re-initiate the session
 *  - onCancel(roomId) — cancel the on-hold session
 */
const OnHoldBanner = ({ data, astrologerName, onUnhold, onCancel }) => {
  if (!data) return null;

  const { roomId, message, type } = data;
  const typeLabel = type === "chat" ? "Chat" : type === "video" ? "Video" : "Call";

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <p className={styles.message}>
          {message || `Your ${typeLabel.toLowerCase()} with ${astrologerName || "the astrologer"} is on hold.`}
        </p>
      </div>
      <div className={styles.actions}>
        <button className={styles.unholdBtn} onClick={() => onUnhold?.(roomId)} aria-label="Unhold">
          <Play size={16} />
          <span>Unhold</span>
        </button>
        <button className={styles.cancelBtn} onClick={() => onCancel?.(roomId)} aria-label="Cancel">
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default OnHoldBanner;
