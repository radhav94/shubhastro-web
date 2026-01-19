import styles from "./ChatWindow.module.scss";
import { IoShuffle, IoSparkles, IoGift } from "react-icons/io5";

const FloatingActions = ({ onShuffle, onSparkles, onGift }) => {
  return (
    <div className={styles.floatingActions}>
      <button
        className={styles.floatingButton}
        onClick={onShuffle}
        aria-label="Shuffle"
      >
        <IoShuffle size={20} />
      </button>
      <button
        className={styles.floatingButton}
        onClick={onSparkles}
        aria-label="Sparkles"
      >
        <IoSparkles size={20} />
      </button>
      <button
        className={styles.floatingButton}
        onClick={onGift}
        aria-label="Gift"
      >
        <IoGift size={20} />
      </button>
    </div>
  );
};

export default FloatingActions;
