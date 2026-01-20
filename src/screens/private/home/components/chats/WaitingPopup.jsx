import { createPortal } from "react-dom";
import styles from "./ChatWindow.module.scss";

import { PrimaryText } from "../../../../../component";

const WaitingPopup = ({ onCancel }) => {
  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <PrimaryText size_18 isSemiBold>
          🔔 Calling Astrologer…
        </PrimaryText>

        <PrimaryText size_14 color="#777">
          Please wait while astrologer accepts the call
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button className={styles.rejectBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body // 🔥 This guarantees fullscreen
  );
};

export default WaitingPopup;
