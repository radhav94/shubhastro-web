import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useWaitingQueue } from "../../../../context/WaitingQueueContext";
import { useCall } from "../../../../context/CallContext";
import { useChat } from "../../../../context/ChatContext";
import styles from "./WaitlistModal.module.scss";

const WaitlistModal = ({ show, callRoomId, resetCallState, onClose, connectionType, waitTime }) => {
  const { pendingConnections, removePendingConnection, addPendingConnection, cancelPendingConnection, cancelAll } = useWaitingQueue();
  const { setWaitingList: setCallWaitingList, resetCallFlow } = useCall();
  const { setWaitingList, resetChatFlow } = useChat();

  if (!show) return null;

  // Use pendingConnections as the source of truth
  const sessions = pendingConnections.length > 0
    ? pendingConnections
    : (callRoomId ? [{ roomId: callRoomId, type: connectionType || "audio", status: "waiting", waitingTime: waitTime || 5 }] : []);

  if (sessions.length === 0) return null;

  const handleCancel = (conn) => {
    cancelPendingConnection(conn.roomId, conn.type, conn.astrologer?._id);
    if (pendingConnections.length <= 1) {
      resetCallState?.();
    }
  };

  const handleAccept = (conn) => {
    if (!conn.roomId) {
      console.warn("[WaitlistModal] handleAccept — no roomId!", conn);
      return;
    }
    const eventName = conn.type === "chat" ? "chat:user_accept" : "call:user_accept";
    console.log("[WaitlistModal] Emitting", eventName, "roomId:", conn.roomId, "socket connected:", voiceSocket.connected);
    voiceSocket.emit(eventName, { roomId: conn.roomId });
  };

  const handleUnhold = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    removePendingConnection(conn.roomId);
    if (conn.astrologer) {
      addPendingConnection({
        id: `${conn.astrologer._id}-${conn.type}-${Date.now()}`,
        astrologer: conn.astrologer,
        type: conn.type,
        roomId: null,
        waitingTime: conn.waitingTime || 5,
        isEmergency: conn.isEmergency || false,
        status: "ringing",
      });
    }
  };

  const handleCancelAll = () => {
    cancelAll();
    setWaitingList(false);
    setCallWaitingList(false);
    resetChatFlow();
    resetCallFlow();
    resetCallState?.();
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "astrologer_accepted": return "Accepted";
      case "on_hold": return "On Hold";
      case "ringing": return "Ringing…";
      default: return "Waiting…";
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Waiting for {sessions.length} astrologer{sessions.length > 1 ? "s" : ""}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.sessionList}>
          {sessions.map((conn) => {
            const name = `${conn.astrologer?.firstName || conn.astrologer?.astrologerName || ""} ${conn.astrologer?.lastName || ""}`.trim() || "Astrologer";
            const status = conn.status || "waiting";
            const isAccepted = status === "astrologer_accepted";
            const isOnHold = status === "on_hold";

            return (
              <div key={conn.roomId || conn.id} className={`${styles.sessionItem} ${isAccepted ? styles.sessionAccepted : ""} ${isOnHold ? styles.sessionOnHold : ""}`}>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionName}>{name}</span>
                  <span className={styles.sessionStatus}>{getStatusLabel(status)}</span>
                </div>
                <div className={styles.sessionActions}>
                  {isAccepted && (
                    <button className={styles.acceptBtn} onClick={() => handleAccept(conn)}>
                      Accept
                    </button>
                  )}
                  {isOnHold && (
                    <button className={styles.unholdBtn} onClick={() => handleUnhold(conn)}>
                      Unhold
                    </button>
                  )}
                  <button className={styles.cancelBtn} onClick={() => handleCancel(conn)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.divider} />

        <button className={styles.joinBtn} onClick={handleCancelAll}>
          Cancel All
        </button>
      </div>
    </div>
  );
};

export default WaitlistModal;
