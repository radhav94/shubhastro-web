import { useEffect, useRef } from "react";
import styles from "./WaitlistModal.module.scss";

/**
 * Format dynamic wait time based on confidence level.
 * - high: "~11 min"
 * - medium: "~8-14 min"
 * - low: "Estimated: 5-15 min"
 */
function formatWaitTime(data) {
  if (!data || data.waitingTime === undefined) return null;

  const { waitingTime, minWait, maxWait, confidence } = data;

  const safeWait = Math.max(1, waitingTime);
  const safeMin = Math.max(1, minWait || safeWait);
  const safeMax = Math.max(safeMin, maxWait || safeWait);

  if (confidence === "high") {
    return `~${safeWait} min`;
  } else {
    return `~${safeMin}-${safeMax} min`;
  }
}

/**
 * Multi-request WaitlistModal with dynamic wait time estimation.
 * Props:
 *  - show: boolean
 *  - pendingRequests: array of { roomId, astrologer, type, status, waitingTime, minWait, maxWait, confidence, position, timestamp }
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
  // Auto-show ONLY when a NEW request gets accepted — not on every render while
  // an acceptance persists. Previously `onShow` fired on every render as long as
  // any accepted request existed, so closing (X) immediately re-opened the modal
  // on the next render. We remember which accepted roomIds have already
  // triggered a show, so a manual close stays closed until a fresh acceptance.
  const shownAcceptedRef = useRef(new Set());
  useEffect(() => {
    const acceptedIds = pendingRequests
      .filter((r) => r.status === "astrologer_accepted")
      .map((r) => r.roomId);

    const hasNew = acceptedIds.some((id) => !shownAcceptedRef.current.has(id));
    if (hasNew) {
      acceptedIds.forEach((id) => shownAcceptedRef.current.add(id));
      if (onShow) onShow();
    }

    // Forget accepted ids that are no longer pending, so if the same astrologer
    // re-accepts later it can pop the modal again.
    shownAcceptedRef.current.forEach((id) => {
      if (!acceptedIds.includes(id)) shownAcceptedRef.current.delete(id);
    });
  }, [pendingRequests, onShow]);

  if (!show || pendingRequests.length === 0) return null;

  const handleAccept = (req) => {
    if (onScrollToAstrologer) onScrollToAstrologer(req.astrologer?._id || req.astrologer?.astrologerId);
    if (onAccept) onAccept(req.roomId, req.type);
  };

  const count = pendingRequests.length;
  const acceptedCount = pendingRequests.filter((r) => r.status === "astrologer_accepted").length;
  const ringingCount = pendingRequests.filter((r) => r.status === "ringing").length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Waitlist
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>

        {/* Request list */}
        <div className={styles.list}>
          {pendingRequests.map((req) => {
            const name = req.astrologer?.firstName || req.astrologer?.astrologerName || req.astrologer?.hostName || "Astrologer";
            const initial = name.charAt(0).toUpperCase();
            const isAccepted = req.status === "astrologer_accepted";
            const isOnHold = req.status === "on_hold";
            const isRinging = req.status === "ringing";
            const isWaiting = !isAccepted && !isOnHold && !isRinging;
            const waitData = req.waitingTime !== undefined ? req : null;

            return (
              <div
                key={req.roomId || req.astrologer?._id || req.id}
                className={`${styles.listItem} ${isAccepted ? styles.listItemAccepted : ""} ${isOnHold ? styles.listItemHold : ""} ${isRinging ? styles.listItemRinging : ""}`}
              >
                <div className={styles.listItemLeft}>
                  <div className={`${styles.listAvatar} ${isRinging ? styles.listAvatarRinging : ""}`}>
                    {initial}
                  </div>
                  <div className={styles.listMeta}>
                    <span className={styles.listName}>{name}</span>
                    <span className={styles.listType}>
                      {isAccepted && <span className={styles.acceptedTag}>Accepted</span>}
                      {isOnHold && <span className={styles.holdTag}>Missed Call</span>}
                      {isRinging && <span className={styles.ringingTag}>Ringing...</span>}
                      {isWaiting && waitData && waitData.position && (
                        <span>{`#${waitData.position} in queue${waitData.confidence ? ` • ${formatWaitTime(waitData)}` : ""}`}</span>
                      )}
                      {isWaiting && (!waitData || !waitData.position) && <span className={styles.ringingTag}>Ringing...</span>}
                    </span>
                  </div>
                </div>

                <div className={styles.listItemRight}>
                  {/* Ringing / Waiting state — Cancel button */}
                  {(isRinging || isWaiting) && (
                    <button className={styles.cancelBtn} onClick={() => onCancel && onCancel(req.roomId, req.type)}>
                      Cancel
                    </button>
                  )}

                  {/* Accepted — Accept + Cancel */}
                  {isAccepted && (
                    <div className={styles.actionBtns}>
                      <button className={styles.acceptBtn} onClick={() => handleAccept(req)}>Accept</button>
                      <button className={styles.cancelBtn} onClick={() => onCancel && onCancel(req.roomId, req.type)}>Cancel</button>
                    </div>
                  )}

                  {/* On hold / Missed — Rejoin + Cancel */}
                  {isOnHold && (
                    <div className={styles.actionBtns}>
                      <button className={styles.rejoinBtn} onClick={() => onUnhold && onUnhold(req.roomId, req.type)}>Rejoin</button>
                      <button className={styles.cancelBtn} onClick={() => onCancel && onCancel(req.roomId, req.type)}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer removed — individual cancel buttons handle each item */}
      </div>
    </div>
  );
};

export default WaitlistModal;
