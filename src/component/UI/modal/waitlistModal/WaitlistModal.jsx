import { useState, useEffect, useRef } from "react";
import styles from "./WaitlistModal.module.scss";

/**
 * Multi-request WaitlistModal
 * Props:
 *  - show: boolean
 *  - pendingRequests: array of { roomId, astrologer, type, status, waitingTime, timestamp }
 *  - onClose: () => void
 *  - onShow: () => void
 *  - onAccept: (roomId, type) => void
 *  - onReject: (roomId, type) => void
 *  - onUnhold: (roomId, type) => void
 *  - onCancel: (roomId, type) => void
 *  - onCancelAll: () => void
 *  - onScrollToAstrologer: (astrologerId) => void
 */
const WaitlistModal = ({
  show,
  pendingRequests = [],
  onClose,
  onShow,
  onAccept,
  onReject,
  onUnhold,
  onCancel,
  onCancelAll,
  onScrollToAstrologer,
}) => {
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(null);

  // Global tick for elapsed time display
  useEffect(() => {
    if (show && pendingRequests.length > 0) {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [show, pendingRequests.length]);

  // Auto-show when any request gets accepted
  useEffect(() => {
    const hasAccepted = pendingRequests.some((r) => r.status === "astrologer_accepted");
    if (hasAccepted && onShow) onShow();
  }, [pendingRequests, onShow]);

  if (!show || pendingRequests.length === 0) return null;

  const getElapsed = (timestamp) => {
    if (!timestamp) return "00m 00s";
    const secs = Math.floor((now - timestamp) / 1000);
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}m ${s}s`;
  };

  const handleAccept = (req) => {
    if (onScrollToAstrologer) onScrollToAstrologer(req.astrologer?._id || req.astrologer?.astrologerId);
    if (onAccept) onAccept(req.roomId, req.type);
  };

  const count = pendingRequests.length;
  const acceptedCount = pendingRequests.filter((r) => r.status === "astrologer_accepted").length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Waitlist <span className={styles.badge}>{count}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>

        <p className={styles.description}>
          {acceptedCount > 0
            ? `${acceptedCount} astrologer${acceptedCount > 1 ? "s" : ""} ready to connect.`
            : `Waiting for ${count} astrologer${count > 1 ? "s" : ""} to accept.`}
        </p>

        {/* Request list */}
        <div className={styles.list}>
          {pendingRequests.map((req) => {
            const name = req.astrologer?.firstName || req.astrologer?.astrologerName || req.astrologer?.hostName || "Astrologer";
            const initial = name.charAt(0).toUpperCase();
            const isAccepted = req.status === "astrologer_accepted";
            const isOnHold = req.status === "on_hold";

            return (
              <div
                key={req.roomId || req.astrologer?._id || req.id}
                className={`${styles.listItem} ${isAccepted ? styles.listItemAccepted : ""} ${isOnHold ? styles.listItemHold : ""}`}
              >
                <div className={styles.listItemLeft}>
                  <div className={styles.listAvatar}>{initial}</div>
                  <div className={styles.listMeta}>
                    <span className={styles.listName}>{name}</span>
                    <span className={styles.listType}>
                      {req.type === "chat" ? "Chat" : req.type === "video" ? "Video" : "Audio"}
                      {isAccepted && <span className={styles.acceptedTag}> · Ready</span>}
                      {isOnHold && <span className={styles.holdTag}> · On Hold</span>}
                    </span>
                  </div>
                </div>

                <div className={styles.listItemRight}>
                  {/* Waiting state — show timer + cancel */}
                  {!isAccepted && !isOnHold && (
                    <>
                      <span className={styles.listTimer}>{getElapsed(req.timestamp)}</span>
                      <button className={styles.cancelIconBtn} onClick={() => onCancel && onCancel(req.roomId, req.type)} aria-label="Cancel">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Accepted — show accept + reject */}
                  {isAccepted && (
                    <div className={styles.actionBtns}>
                      <button className={styles.acceptBtn} onClick={() => handleAccept(req)}>Accept</button>
                      <button className={styles.rejectBtn} onClick={() => onReject && onReject(req.roomId, req.type)}>Reject</button>
                    </div>
                  )}

                  {/* On hold — show unhold + cancel */}
                  {isOnHold && (
                    <div className={styles.actionBtns}>
                      <button className={styles.unholdBtn} onClick={() => onUnhold && onUnhold(req.roomId, req.type)}>Unhold</button>
                      <button className={styles.rejectBtn} onClick={() => onCancel && onCancel(req.roomId, req.type)}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — cancel all */}
        {count > 1 && (
          <>
            <div className={styles.divider} />
            <button className={styles.joinBtn} onClick={onCancelAll}>
              Cancel All ({count})
            </button>
          </>
        )}
        {count === 1 && !pendingRequests[0]?.status?.includes("accepted") && (
          <>
            <div className={styles.divider} />
            <button className={styles.joinBtn} onClick={() => onCancel && onCancel(pendingRequests[0].roomId, pendingRequests[0].type)}>
              Cancel Waitlist
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;
