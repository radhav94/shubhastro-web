import { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import VoiceMessage from "../../../../../screens/private/talkToAstrologer/voiceChat/VoiceMessage";
import { GrReactjs } from "react-icons/gr";
import IframeModal from "./IframeModal";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
import dayjs from "dayjs";
import LinkPreview from "./LinkPreview";
import { detectURL } from "../../../../../utils/helper/linkPreview";

const ChatMessages = ({ messages, isTyping, error, messagesRef }) => {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const extractKundliPath = (url) => {
    setLoading(true);
    try {
      const parsed = new URL(url);
      setLoading(false);
      return parsed.pathname; // "/kundli/:id"
    } catch {
      setLoading(false);
      return null;
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = msg.date || dayjs(msg.dateTime).format("MMM DD, YYYY");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Get first message time for date header
  const getFirstMessageTime = (msgs) => {
    if (msgs && msgs.length > 0) {
      return msgs[0].time;
    }
    return '';
  };

  return (
    <>
      <div className={styles.messages} ref={messagesRef}>
        {Object.entries(messageGroups).map(([date, msgs], groupIndex) => (
          <div key={`${date}-${groupIndex}`} className={styles.messageGroup}>
            <div className={styles.dateHeader}>
              <span className={styles.dateText}>
                {date} • {getFirstMessageTime(msgs)}
              </span>
            </div>
            {msgs.map((msg, i) => (
              <div
                key={`${date}-${i}-${msg.time}`}
                className={styles.messageWrapper}
              >
                <div
                  className={`${styles.msgBubble} ${
                    msg.isSender ? styles.senderBubble : styles.receiverBubble
                  }`}
                >
                  <div className={styles.bubbleContent}>
                    <PrimaryText size={14} color={"#4a4a4a"}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(msg.text);
                          // ONLY handle voice messages
                          if (parsed?.type === "voice") {
                            return (
                              <VoiceMessage
                                url={parsed.audioUrl}
                                duration={parsed.duration}
                                time={msg.time}
                                isSender={msg.isSender}
                              />
                            );
                          }
                          if (parsed?.type === "file") {
                            return null;
                          }
                        } catch {
                          if (msg.text == null) {
                            return msg?.text;
                          }

                          if (msg.type == "kundli") {
                            return (
                              <div
                                onClick={() => {
                                  setIframeSrc(msg.text);
                                }}
                                style={{
                                  textDecoration: "underline",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color: "#4a4a4a",
                                }}
                              >
                                <GrReactjs />
                                View Kundli
                              </div>
                            );
                          }

                          // Check if message contains a URL (but not kundli type)
                          const detectedURL = detectURL(msg.text);
                          if (detectedURL && msg.type !== "kundli") {
                            return (
                              <>
                                {/* Show the text if it's more than just the URL */}
                                {msg.text !== detectedURL && (
                                  <div style={{ marginBottom: 8 }}>
                                    {msg.text}
                                  </div>
                                )}
                                <LinkPreview 
                                  url={detectedURL} 
                                  isSender={msg.isSender}
                                />
                              </>
                            );
                          }
                        }
                        return msg?.text;
                      })()}
                    </PrimaryText>
                  </div>
                  <div className={styles.msgTimeWrapper}>
                    <span className={styles.msgTime}>{msg.time}</span>
                    {msg.isSender && (
                      <IoCheckmarkDone className={styles.checkmark} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {isTyping && (
          <div className={styles.messageWrapper}>
            <div className={`${styles.msgBubble} ${styles.receiverBubble}`}>
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 👇 Modal */}
      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
        loading={loading}
      />
    </>
  );
};

export default ChatMessages;
