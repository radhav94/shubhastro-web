import React from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";

const WaitingPopup = ({ open, onCancel }) => {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <PrimaryText size_18 isSemiBold>
          ⏳ Waiting for astrologer to accept your call…
        </PrimaryText>

        <PrimaryText size_14 color="#777">
          Please stay on this screen
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button className={styles.rejectBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingPopup;
