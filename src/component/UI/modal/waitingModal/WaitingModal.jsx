import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useWaitingQueue } from "../../../../context/WaitingQueueContext";
import styles from "./WaitingModal.module.scss";

function formatWait(conn) {
  if (!conn || conn.confidence === undefined) return null;
  const { waitingTime, minWait, maxWait, confidence } = conn;
  const safeWait = Math.max(1, waitingTime || 1);
  const safeMin = Math.max(1, minWait || safeWait);
  const safeMax = Math.max(safeMin, maxWait || safeWait);
  if (confidence === "high") return `~${safeWait} min`;
  return `~${safeMin}-${safeMax} min`;
}

const WaitingModal = ({ callRoomId, resetCallState, connectionType, astrologerName, className, hideCancel }) => {
  const { getConnectionByRoomId } = useWaitingQueue();

  const handleCancel = () => {
    if (callRoomId) {
      if (connectionType === 'chat') {
        voiceSocket.emit("chat:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      } else if (connectionType === 'audio' || connectionType === 'video') {
        voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      } else {
        voiceSocket.emit("chat:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
        voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      }
    }
    resetCallState();
  };

  const conn = callRoomId ? getConnectionByRoomId(callRoomId) : null;
  const dynamicWait = formatWait(conn);
  const fallback = connectionType === 'chat' ? '~2 min' : '~5 min';
  const waitDisplay = dynamicWait || fallback;

  return (
    <div className={`${styles.modalOverlay} ${className || ''}`} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '28px' }}>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Waiting in queue</div>
          <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: 2 }}>Approx {waitDisplay}</div>
          {astrologerName && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Astrologer: {astrologerName}</div>}
        </div>
        {!hideCancel && (
          <div className={styles.modalButtons}>
            <button className={styles.rejectBtn} onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingModal;