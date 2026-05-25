import styles from "../Community.module.scss";

const SuccessModal = ({ onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.successIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="#22c55e" />
            <path d="M25 40l10 10 20-20" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Confetti dots */}
          <span className={styles.confetti} />
        </div>
        <h2 className={styles.successTitle}>Posted Successfully Lorem Ipsum!</h2>
        <p className={styles.successDesc}>
          Our internal team will review,<br />
          Lorem Ipsum is simply dummy text of the
        </p>
        <button className={styles.ctaBtn} onClick={onClose}>
          CTA Name
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
