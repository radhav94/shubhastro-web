import { createPortal } from "react-dom";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./IframeModal.module.scss";
import { IoClose } from "react-icons/io5";

const IframeModal = ({ open, src, onClose, loading }) => {
  if (!open) return null;

  // Add iframe=true query parameter to hide TopHeader
  const iframeSrc = src ? `${src}${src.includes('?') ? '&' : '?'}iframe=true` : '';

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <IoClose size={22} />
        </button>
        <PrimaryLoader isLoading={loading} />
        <iframe src={iframeSrc} title="Kundli" className={styles.iframe} />
      </div>
    </div>,
    document.body
  );
};

export default IframeModal;
