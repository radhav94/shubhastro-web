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

  // Escape closes the modal. Without this the only exits were the close button
  // and the sliver of overlay around a 90%x90% panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /*
    Lock the page behind while the modal is open. On iOS a scroll that starts on
    the overlay is handed to the document, which moves the page under a
    position:fixed layer and drags the close button out from under the finger —
    so a tap aimed at it lands somewhere else and the modal appears stuck open.
  */
  useEffect(() => {
    if (!open) return undefined;
    const { overflow, position, width } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.width = width;
    };
  }, [open]);

  if (!open) return null;

  // Add iframe=true query parameter to show minimal header
  const iframeSrc = src ? `${src}${src.includes('?') ? '&' : '?'}iframe=true` : '';

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/*
          Rendered unconditionally. It used to be gated on `!iframeLoading`, so
          while the kundli was loading there was no way out of the modal except
          the ~5% of overlay left visible around the panel — on a phone that is a
          ~19px strip down each side. If `onLoad` never fired (stalled request,
          in-app browser) the spinner stayed up with no exit at all, and taps
          aimed at where the close button should be registered as dead clicks.
        */}
        <button
          type="button"
          className={`${styles.closeBtn} notranslate`}
          onClick={onClose}
          translate="no"
          aria-label="Close kundli"
        >
          <IoClose size={22} />
        </button>
        <PrimaryLoader isLoading={iframeLoading} fullscreen={false} message="Loading Kundli..." />
        {/*
          The wrapper is what scrolls. iOS Safari sizes an iframe to its content
          and ignores overflow on the frame itself, so without a touch-scrollable
          parent a kundli taller than the panel simply cannot be reached.
        */}
        <div className={styles.iframeWrap}>
          <iframe
            src={iframeSrc}
            title="Kundli"
            className={`${styles.iframe} ${iframeLoading ? styles.iframeHidden : ''}`}
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IframeModal;
