import { voiceSocket } from "../../../../services/voiceSocketServices";
import PrimaryText from "../../../PrimaryText";
import styles from "./WaitingModal.module.scss";

const WaitingModal = ({ callRoomId, resetCallState, connectionType }) => {
  const handleCancel = () => {
    console.log("🔴 WaitingModal: Cancel clicked", { callRoomId, connectionType });
    
    if (callRoomId) {
      // Emit correct cancel event based on connection type
      if (connectionType === 'chat') {
        voiceSocket.emit("chat:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      } else if (connectionType === 'audio' || connectionType === 'video') {
        voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      } else {
        // Fallback: emit both if type is unknown
        voiceSocket.emit("chat:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
        voiceSocket.emit("call:cancel", { roomId: callRoomId, canceledBy: "CUSTOMER" });
      }
    }
    
    resetCallState();
  };

  // Get waiting time based on connection type
  const waitingTime = connectionType === 'chat' ? '2' : '5';

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>⏳</span>
          <PrimaryText size_18 isSemiBold>
            Waiting in queue
          </PrimaryText>
        </div>
        <PrimaryText size_14 color="#777">
          Approx {waitingTime} mins
        </PrimaryText>
        <PrimaryText size_12 color="#999" style={{ marginTop: '8px' }}>
          Please wait or cancel to connect with another astrologer
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button
            className={styles.rejectBtn}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingModal;
