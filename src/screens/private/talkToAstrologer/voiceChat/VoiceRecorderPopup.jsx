import { IoStop } from "react-icons/io5";
import styles from "./VoiceRecorderPopup.module.scss";

const VoiceRecorderPopup = ({ seconds, onStop }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.waves}>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.timer}>{seconds}s</div>

        <button className={styles.stopBtn} onClick={onStop}>
          <IoStop size={22} />
          Stop
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorderPopup;
