import { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import VoiceMessage from "../../../../../screens/private/talkToAstrologer/voiceChat/VoiceMessage";
import { GrReactjs } from "react-icons/gr";
import IframeModal from "./IframeModal";

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

  return (
    <>
      <div className={styles.messages} ref={messagesRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgBubble} ${msg.isSender ? styles.senderBubble : styles.receiverBubble
              }`}
          >
            <PrimaryText size={14}>
              {(() => {
                try {
                  const voiceMessage = JSON.parse(msg.text);
                  return (<VoiceMessage
                    url={voiceMessage.audioUrl}
                    duration={voiceMessage.duration}
                    time={msg.time}
                    isSender={msg.isSender}
                  />);

                } catch {
                  if (msg.text == null) {
                    return msg?.text;
                  }
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
                }
                return msg?.text;
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
        loading={loading}
      />
    </>
  );
};

export default ChatMessages;
