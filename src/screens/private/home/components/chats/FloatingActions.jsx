import styles from "./ChatWindow.module.scss";

// Import SVG icons
import SwitchIcon from "../../../../../assets/chat/Horizontal_switch.svg";
import GiftIcon from "../../../../../assets/chat/GIft_fill.svg";
import { IoSparkles } from "react-icons/io5";

const FloatingActions = ({ onShuffle, onSparkles, onGift }) => {
  return (
    <div className={styles.floatingActions}>
      <button
        className={styles.floatingButton}
        onClick={onShuffle}
        aria-label="Shuffle"
      >
        <img src={SwitchIcon} alt="Switch" width="32" height="32" />
      </button>
      <button
        className={styles.floatingButton}
        onClick={onSparkles}
        aria-label="Sparkles"
      >
        <IoSparkles size={32} />
      </button>
      <button
        className={styles.floatingButton}
        onClick={onGift}
        aria-label="Gift"
      >
        <img src={GiftIcon} alt="Gift" width="32" height="32" />
      </button>
    </div>
  );
};

export default FloatingActions;
