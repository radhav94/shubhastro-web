import styles from "./InactivityModal.module.scss";
import { IoClose } from "react-icons/io5";

const InactivityModal = ({ isOpen, onContinue, onDisconnect }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBox}>
        <button className={styles.closeBtn} onClick={onContinue}>
          <IoClose size={22} />
        </button>

        <h2>No Activity Detected</h2>
        <p>
          There has been no activity from your side for{" "}
          <strong>2 minutes</strong>. Would you like to disconnect the session?
        </p>

        <div className={styles.actions}>
          <button className={styles.disconnectBtn} onClick={onDisconnect}>
            Disconnect
          </button>

          <button className={styles.continueBtn} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal;
