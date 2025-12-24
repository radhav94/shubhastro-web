import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import VoiceMessage from "../../../../../screens/private/talkToAstrologer/voiceChat/VoiceMessage";

const ChatMessages = ({ messages, isTyping, error, messagesRef }) => {
  return (
    <div className={styles.messages} ref={messagesRef}>
      {error && <div className={styles.errorBox}>⚠️ {error}</div>}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.msgBubble} ${msg.isSender ? styles.senderBubble : styles.receiverBubble
            }`}
        >
          <PrimaryText size={14} color={msg.isSender ? "#fff" : "#111"}>
            {(() => {
              try {
                const voiceMessage = JSON.parse(msg.text);
                return (<VoiceMessage
                  url={voiceMessage.url}
                  duration={voiceMessage.duration}
                  time={msg.time}
                  isSender={msg.isSender}
                />);

              } catch {
                if (msg.text == null) {
                  return msg.text;
                }
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const match = msg.text.match(urlRegex);

                if (match) {
                  return (
                    <a
                      href={match[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "underline",
                        fontWeight: 600,
                        color: msg.isSender ? "#111" : "#111",
                        cursor: "pointer",
                      }}
                    >
                      🔗 View Kundli
                    </a>
                  );
                }
              }

              return msg?.text;
            })()}
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
