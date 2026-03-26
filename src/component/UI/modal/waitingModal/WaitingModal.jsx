import { voiceSocket } from "../../../../services/voiceSocketServices";
import styles from "./WaitingModal.module.scss";

const WaitingModal = ({ callRoomId, resetCallState, connectionType, astrologerName }) => {
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

  const waitingTime = connectionType === 'chat' ? '2' : '5';

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '28px' }}>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Waiting in queue</div>
          <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: 2 }}>Approx {waitingTime} mins</div>
          {astrologerName && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Astrologer: {astrologerName}</div>}
        </div>
        <div className={styles.modalButtons}>
          <button className={styles.rejectBtn} onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default WaitingModal;