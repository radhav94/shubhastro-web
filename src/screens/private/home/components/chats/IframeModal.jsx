import { createPortal } from "react-dom";
// components/IframeModal.jsx
import { useEffect, useState } from "react";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./IframeModal.module.scss";
import { IoClose } from "react-icons/io5";

const IframeModal = ({ open, src, onClose }) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  // Reset loading state when src changes
  useEffect(() => {
    if (open) {
      setIframeLoading(true);
    }
  }, [open, src]);

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
        {!iframeLoading && (
          <button className={`${styles.closeBtn} notranslate`} onClick={onClose} translate="no">
            <IoClose size={22} />
          </button>
        )}
        <PrimaryLoader isLoading={iframeLoading} fullscreen={false} message="Loading Kundli..." />
        <iframe
          src={iframeSrc}
          title="Kundli"
          className={`${styles.iframe} ${iframeLoading ? styles.iframeHidden : ''}`}
          onLoad={() => setIframeLoading(false)}
        />
      </div>
    </div>,
    document.body
  );
};

export default IframeModal;
