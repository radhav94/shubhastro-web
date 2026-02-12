import styles from "./ChatWindow.module.scss";
import { IoArrowBack } from "react-icons/io5";
// import { FaWallet } from "react-icons/fa";
import { PrimaryText } from "../../../../../component";
import ChatFooter from "./ChatFooter";

const ChatHeader = ({
  fullName,
  isTyping,
  onBack,
  experience = "20 Years",
  walletBalance = 0,
  remainingTime = 0,
  onRecharge,
  isVideoCallActive,
  onChatEnd
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
            Exp. {experience} {experience > 1 ? "years" : "year"}
          </span>
        </div>
      </div>

      <div className={styles.headerRight}>
     {!isVideoCallActive && <ChatFooter remainingTime={remainingTime} onRecharge={onRecharge} walletBalance={walletBalance} onChatEnd={onChatEnd}/>}
        {/* <div className={styles.walletBadge}>
          <FaWallet className={styles.walletIcon} />
          <span className={styles.walletAmount}>₹{walletBalance}</span>
        </div> */}
      </div>
    </div>
  );
};

export default ChatHeader;
