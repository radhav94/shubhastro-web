import PrimaryText from "../../../PrimaryText";
import styles from "./DeleteConfirmationModal.module.scss";

const DeleteConfirmationModal = ({
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this?",
  onCancel,
  onConfirm,
  isOpen = false,
  onClose,
  isLoading = false,
  confirmText = "Delete",
  loadingText = "Deleting...",
  cancelText = "Cancel",
  tone = "danger", // "danger" (red) | "primary" (orange)
}) => {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <PrimaryText as="h3" size_20 isBold color="#111827" className={styles.title}>
           {title}
        </PrimaryText>

        <PrimaryText size_14 color="#6b7280" className={styles.message}>
          {message}
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button 
            className={styles.cancelBtn} 
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={tone === "primary" ? styles.confirmPrimary : styles.rejectBtn} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
