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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <PrimaryLoader isLoading={loading} />
        <iframe src={iframeSrc} title="Kundli" className={styles.iframe} />
      </div>
    </div>
  );
};

export default IframeModal;
