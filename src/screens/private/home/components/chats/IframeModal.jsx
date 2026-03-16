import { createPortal } from "react-dom";
// components/IframeModal.jsx
import { useEffect } from "react";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./IframeModal.module.scss";
import { IoClose } from "react-icons/io5";

const IframeModal = ({ open, src, onClose, loading }) => {
  // Listen for close message from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'CLOSE_KUNDLI_MODAL') {
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  if (!open) return null;

  // Add iframe=true query parameter to show minimal header
  const iframeSrc = src ? `${src}${src.includes('?') ? '&' : '?'}iframe=true` : '';

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={`${styles.closeBtn} notranslate`} onClick={onClose} translate="no">
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
