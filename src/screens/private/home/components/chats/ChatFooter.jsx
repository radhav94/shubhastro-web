import styles from "./ChatWindow.module.scss";
import ArrowRightIcon from "../../../../../assets/chat/arrow-right.svg";

const ChatFooter = ({ remainingTime = 0, onRecharge, walletBalance = 0 }) => {
  // Format time as MM:SS
  const formatTime = (seconds) => {
    // Handle invalid values
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show button if: no balance OR remaining time is less than 5 minutes (300 seconds)
  const shouldShowRechargeButton = walletBalance <= 0 || remainingTime < 300;

  return (
    <div className={styles.chatFooter}>
      <div className={styles.timerText}>
        Chat Ends in <span className={styles.timerHighlight}>{formatTime(remainingTime)}</span>
      </div>
      {shouldShowRechargeButton && (
        <button className={styles.rechargeButton} onClick={onRecharge}>
          Recharge Now
          <img src={ArrowRightIcon} alt="Arrow" width="18" height="18" />
        </button>
      )}
    </div>
  );
};

export default ChatFooter;
