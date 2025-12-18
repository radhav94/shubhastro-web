import React from "react";
import styles from "./ChatWindow.module.scss";
import {
  IoArrowBack,
  IoCallOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { PrimaryText } from "../../../../../component";

const ChatHeader = ({
  fullName,
  isTyping,
  onBack,
  onAudioCall,
  onVideoCall,
  disabled,
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
          <span className={styles.statusText}>
            {isTyping ? "Typing..." : "Online"}
          </span>
        </div>
      </div>

      <div className={styles.headerRight}>
        <IoCallOutline
          className={styles.callIcon}
          onClick={disabled ? null : onAudioCall}
        />
        <IoVideocamOutline
          className={styles.videoIcon}
          onClick={disabled ? null : onVideoCall}
        />
      </div>
    </div>
  );
};

export default ChatHeader;
