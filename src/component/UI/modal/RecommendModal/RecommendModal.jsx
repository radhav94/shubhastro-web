import styles from "./recommendModal.module.scss";
import { IoClose } from "react-icons/io5";

const RecommendModal = ({ open, onClose, mode = "chat", data = [] }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* FIXED HEADER */}
        <div className={styles.modalHeader}>
          <h3>Recommended Astrologers</h3>
          <button className={styles.close} onClick={onClose}>
            <IoClose size={22} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className={styles.modalBody}>
          <div className={styles.grid}>
            {data.map((astro) => (
              <div key={astro._id} className={styles.card}>
                <img src={astro?.imageUrl} alt={astro?.firstName} />
                <h4>{astro.firstName}</h4>
                {/* <p className={styles.price}>₹ {astro.price}/min</p> */}

                <button className={styles.actionBtn}>
                  {mode === "chat" ? "Chat" : "Call"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendModal;
