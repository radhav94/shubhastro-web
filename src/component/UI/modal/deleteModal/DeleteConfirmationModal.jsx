import PrimaryText from "../../../PrimaryText";
import styles from "./DeleteConfirmationModal.module.scss";

const DeleteConfirmationModal = ({
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this?",
  onCancel,
  onConfirm,
  isOpen = false,
  onClose,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <PrimaryText size_18 isSemiBold>
           {title}
        </PrimaryText>

        <PrimaryText size_14 color="#777">
          {message}
        </PrimaryText>

        <div className={styles.modalButtons}>
          <button 
            className={styles.cancelBtn} 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className={styles.rejectBtn} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
