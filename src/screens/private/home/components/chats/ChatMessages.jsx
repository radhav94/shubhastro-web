import React from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";

const ChatMessages = ({ messages, isTyping, error }) => {
  return (
    <div className={styles.messages}>
      {error && <div className={styles.errorBox}>⚠️ {error}</div>}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.msgBubble} ${
            msg.isSender ? styles.senderBubble : styles.receiverBubble
          }`}
        >
          <PrimaryText size={14} color={msg.isSender ? "#fff" : "#111"}>
            {msg.text}
          </PrimaryText>
          <span className={styles.msgTime}>{msg.time}</span>
        </div>
      ))}

      {isTyping && (
        <div className={`${styles.msgBubble} ${styles.receiverBubble}`}>
          <div className={styles.typingIndicator}>
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
