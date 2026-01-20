import { voiceSocket } from "../../../../services/voiceSocketServices";
import PrimaryText from "../../../PrimaryText";
import styles from "./WaitingModal.module.scss";

const WaitingModal = ({ callRoomId, resetCallState }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <PrimaryText size_18 isSemiBold>
          ⏳ Connecting to astrologer…
        </PrimaryText>
        <PrimaryText size_14 color="#777">
          Please wait while astrologer accepts the call
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button
            className={styles.rejectBtn}
            onClick={() => {
              if (callRoomId) {
                voiceSocket.emit("cancel_call", { roomId: callRoomId });
              }
              resetCallState();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingModal;
