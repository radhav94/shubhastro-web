import styles from "./ChatWindow.module.scss";

const ChatFooter = ({ remainingTime, onRecharge }) => {
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.chatFooter}>
      <div className={styles.timerText}>
        Chat Ends in <span className={styles.timerHighlight}>{formatTime(remainingTime)}</span>
      </div>
      <button className={styles.rechargeButton} onClick={onRecharge}>
        Recharge Now
      </button>
    </div>
  );
};

export default ChatFooter;
