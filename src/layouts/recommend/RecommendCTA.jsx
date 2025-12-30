import styles from "./recommend.module.scss";
import { IoClose } from "react-icons/io5";

const RecommendCTA = ({ mode = "chat", onClick, onClose }) => {
  return (
    <div className={styles.wrapper}>
      {/* Close */}
      <button className={styles.closeBtn} onClick={onClose}>
        <IoClose size={18} />
      </button>

      {/* Illustration */}
      <div className={styles.illustration}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
          alt="recommend"
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h4>Not sure whom to connect?</h4>
        <p>
          We’ll recommend the best astrologers based on their skills &
          experience.
        </p>
      </div>

      {/* CTA */}
      <button className={styles.ctaBtn} onClick={onClick}>
        {mode === "chat" ? "Chat Now" : "Talk Now"}
      </button>
    </div>
  );
};

export default RecommendCTA;
