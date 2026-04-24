import styles from "./ChatWindow.module.scss";
import { IoArrowBack } from "react-icons/io5";
// import { FaWallet } from "react-icons/fa";
import { PrimaryText } from "../../../../../component";
import ChatFooter from "./ChatFooter";
import { capitalizeWords } from "../../../../../utils/capitalize";
import { getAstrologerDefaultImage } from "../../../../../utils/appImages";

const ChatHeader = ({
  fullName,
  isTyping,
  onBack,
  experience = "20 Years",
  walletBalance = 0,
  remainingTime = 0,
  onRecharge,
  isVideoCallActive,
  onChatEnd,
  isChatActive,
  isEnding = false,
  profileImgUrl,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <IoArrowBack className={styles.backIcon} onClick={onBack} />

        <img
          src={profileImgUrl || getAstrologerDefaultImage()}
          className={styles.headerAvatar}
          alt={fullName || "Astrologer"}
          onError={(e) => {
            e.target.src = getAstrologerDefaultImage();
          }}
        />

        <div className={styles.userInfo}>
          <PrimaryText size_16 isSemiBold>
            {capitalizeWords(fullName) || "Chat User"}
          </PrimaryText>
          <span className={styles.experienceText}>
            Exp. {experience} {experience > 1 ? "years" : "year"}
          </span>
        </div>
      </div>

      <div className={styles.headerRight}>
     {!isVideoCallActive && <ChatFooter remainingTime={remainingTime} onRecharge={onRecharge} walletBalance={walletBalance} onChatEnd={onChatEnd} isChatActive={isChatActive} isEnding={isEnding}/>}
        {/* <div className={styles.walletBadge}>
          <FaWallet className={styles.walletIcon} />
          <span className={styles.walletAmount}>₹{walletBalance}</span>
        </div> */}
      </div>
    </div>
  );
};

export default ChatHeader;
