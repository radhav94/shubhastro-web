import { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { IoArrowBack } from "react-icons/io5";
// import { FaWallet } from "react-icons/fa";
import { PrimaryText } from "../../../../../component";
import ChatFooter from "./ChatFooter";
import { capitalizeWords } from "../../../../../utils/capitalize";
import { getAstrologerDefaultImage } from "../../../../../utils/appImages";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() || "?";
};

const ChatHeader = ({
  fullName,
  isTyping,
  onBack,
  experience,
  walletBalance = 0,
  remainingTime = 0,
  onRecharge,
  isVideoCallActive,
  onChatEnd,
  isChatActive,
  isEnding = false,
  profileImgUrl,
  gender = "male",
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <IoArrowBack className={styles.backIcon} onClick={onBack} />

        <img
          src={(!profileImgUrl || imgError) ? getAstrologerDefaultImage(gender) : profileImgUrl}
          className={styles.headerAvatar}
          alt={fullName || "Astrologer"}
          onError={() => setImgError(true)}
        />

        <div className={styles.userInfo}>
          <PrimaryText size_16 isSemiBold>
            {capitalizeWords(fullName) || "Astrologer"}
          </PrimaryText>
          {experience && (
            <span className={styles.experienceText}>
              Exp. {experience} {experience > 1 ? "years" : "year"}
            </span>
          )}
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
