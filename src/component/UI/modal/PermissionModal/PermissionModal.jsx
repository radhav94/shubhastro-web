import { createPortal } from "react-dom";
import styles from "./PermissionModal.module.scss";

const PERMISSION_CONFIG = {
  microphone: {
    icon: "🎙️",
    title: "Microphone Access Required",
    description:
      "To make voice calls or send voice messages, please allow microphone access in your browser settings.",
    settingName: "Microphone",
  },
  camera: {
    icon: "📷",
    title: "Camera Access Required",
    description:
      "To make video calls, please allow camera access in your browser settings.",
    settingName: "Camera",
  },
  both: {
    icon: "🎥",
    title: "Camera & Microphone Access Required",
    description:
      "To make video calls, please allow camera and microphone access in your browser settings.",
    settingName: "Camera and Microphone",
  },
};

/**
 * Reusable permission modal for mic/camera access.
 * @param {{ isOpen: boolean, onClose: () => void, type: "microphone"|"camera"|"both" }} props
 */
const PermissionModal = ({ isOpen, onClose, type = "microphone" }) => {
  if (!isOpen) return null;

  const { icon, title, description, settingName } =
    PERMISSION_CONFIG[type] || PERMISSION_CONFIG.microphone;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>{icon}</div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={onClose}>
            OK, Got it
          </button>
          <p className={styles.hint}>
            Click the 🔒 lock icon in your browser's address bar → find{" "}
            <strong>{settingName}</strong> → set to <strong>Allow</strong> →
            refresh the page
          </p>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PermissionModal;
