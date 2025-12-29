import { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import { GrReactjs } from "react-icons/gr";
import IframeModal from "./IframeModal";

const ChatMessages = ({ messages, isTyping, error, messagesRef }) => {
  const [iframeSrc, setIframeSrc] = useState(null);

  const extractKundliPath = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname; // "/kundli/:id"
    } catch {
      return null;
    }
  };

  return (
    <>
      <div className={styles.messages} ref={messagesRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgBubble} ${
              msg.isSender ? styles.senderBubble : styles.receiverBubble
            }`}
          >
            <PrimaryText size={14}>
              {(() => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const match = msg.text.match(urlRegex);

                if (match) {
                  return (
                    <div
                      onClick={() => {
                        const path = extractKundliPath(match[0]);
                        if (path) setIframeSrc(path);
                      }}
                      style={{
                        textDecoration: "underline",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <GrReactjs />
                      View Kundli
                    </div>
                  );
                }

                return msg.text;
              })()}
            </PrimaryText>

            <span className={styles.msgTime}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* 👇 Modal */}
      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
      />
    </>
  );
};

export default ChatMessages;
