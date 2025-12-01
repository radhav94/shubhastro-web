import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";
import { combineClasses } from "../../../utils/utlis";
import { useEffect } from "react";

const Modal = ({
  modalOpen,
  setModalOpen,
  heading,
  children,
  doNotClose = false,
  className = "",
  isSubmitting,
  width,
}) => {
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  if (!modalOpen) return null;

  return createPortal(
    <div
      className={styles.mainContainer}
      onMouseDown={(e) => {
        e.stopPropagation();
        !isSubmitting && !doNotClose && setModalOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      <div
        className={combineClasses(styles.modalDiv, className)}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: width || "auto" }}
      >
        {heading && (
          <div className={styles.modalHeader}>
            <p>{heading}</p>
          </div>
        )}

        <div
          className={combineClasses(
            styles.modalBody,
            className ? "modalBody" : ""
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body // ← THIS IS THE FIX
  );
};

export default Modal;
