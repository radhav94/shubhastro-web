import { createPortal } from "react-dom";
import { IoVideocam, IoCall } from "react-icons/io5";
import styles from "./SwitchWaitingPopup.module.scss";

/**
 * Reusable popup shown when switching call types (audio↔video or chat→call).
 *
 * Props:
 * - isVisible: boolean — show/hide the popup
 * - switchType: "audio" | "video" — the type being switched TO
 * - onCancel: () => void — cancel the switch
 */
const SwitchWaitingPopup = ({ isVisible, switchType = "video", onCancel }) => {
  if (!isVisible) return null;

  const isVideo = switchType === "video";
  const label = isVideo ? "video" : "audio";
  const Icon = isVideo ? IoVideocam : IoCall;

  return createPortal(
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Icon size={20} />
        </div>
        <div className={styles.info}>
          <p className={styles.message}>Switching to {label}...</p>
          <span className={styles.subtext}>Waiting for astrologer to accept</span>
        </div>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} />
      </div>
    </div>,
    document.body
  );
};

export default SwitchWaitingPopup;
