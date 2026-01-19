import styles from "./ChatWindow.module.scss";
import { IoArrowBack } from "react-icons/io5";
import { FaWallet } from "react-icons/fa";
import { PrimaryText } from "../../../../../component";

const ChatHeader = ({
  fullName,
  isTyping,
  onBack,
  onAudioCall,
  onVideoCall,
  disabled,
  experience = "20 Years",
  walletBalance = 0
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <IoArrowBack className={styles.backIcon} onClick={onBack} />

        <img
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          className={styles.headerAvatar}
          alt="User"
        />

        <div className={styles.userInfo}>
          <PrimaryText size_16 isSemiBold>
            {fullName || "Chat User"}
          </PrimaryText>
          <span className={styles.experienceText}>
            Exp. {experience}
          </span>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.walletBadge}>
          <FaWallet className={styles.walletIcon} />
          <span className={styles.walletAmount}>₹{walletBalance}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
