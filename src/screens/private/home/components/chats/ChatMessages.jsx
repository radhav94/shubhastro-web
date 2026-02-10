import { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import AudioMessageWrapper from "./AudioMessageWrapper";
import { GrReactjs } from "react-icons/gr";
import { IoCheckmarkDone, IoDocument, IoDownload, IoPlay } from "react-icons/io5";
import { FiFile } from "react-icons/fi";
import IframeModal from "./IframeModal";
import dayjs from "dayjs";

const ChatMessages = ({ messages, isTyping, messagesRef }) => {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const getFileExtension = (filename) => {
    return filename?.split('.').pop()?.toLowerCase() || '';
  };

  const getFileName = (url) => {
    try {
      return url?.split('/').pop() || 'attachment';
    } catch {
      return 'attachment';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
                  className={`${styles.msgBubble} ${msg.isSender ? styles.senderBubble : styles.receiverBubble
                    }`}
                >
                  <div className={styles.bubbleContent}>
                    {(() => {
                      // Voice messages
                      if (msg?.type === "audio") {
                        return (
                          <AudioMessageWrapper
                            url={msg.text}
                            duration={msg.duration}
                            time={msg.time}
                            isSender={msg.isSender}
                          />
                        );
                      }

                      // Image messages
                      if (msg?.type === "image") {
                        return (
                          <div className={styles.imageMessage}>
                            <img
                              src={msg.text}
                              alt="Shared image"
                              className={styles.messageImage}
                              onClick={() => setImagePreview(msg.text)}
                            />
                          </div>
                        );
                      }

                      // Video messages
                      if (msg?.type === "video") {
                        return (
                          <div className={styles.videoMessage}>
                            <div className={styles.videoWrapper}>
                              <video
                                src={msg.text}
                                className={styles.messageVideo}
                                controls
                                preload="metadata"
                              />
                            </div>
                          </div>
                        );
                      }

                      // Attachment/Document messages
                      if (msg?.type === "attachment") {
                        const fileName = getFileName(msg.text);
                        const fileExt = getFileExtension(fileName);
                        
                        return (
                          <div className={styles.attachmentMessage}>
                            <div className={styles.attachmentIcon}>
                              {fileExt === 'pdf' ? (
                                <IoDocument size={24} />
                              ) : (
                                <FiFile size={24} />
                              )}
                            </div>
                            <div className={styles.attachmentInfo}>
                              <div className={styles.attachmentName}>{fileName}</div>
                              {msg.fileSize && (
                                <div className={styles.attachmentSize}>
                                  {formatFileSize(msg.fileSize)}
                                </div>
                              )}
                            </div>
                            <a
                              href={msg.text}
                              download={fileName}
                              className={styles.downloadButton}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IoDownload size={20} />
                            </a>
                          </div>
                        );
                      }

                      // Gift messages (detected by presence of giftData)
                      if (msg?.giftData) {
                        // Parse the message to insert gift image
                        const giftText = msg?.text || "";
                        const parts = giftText.split("a gift");
                        
                        return (
                          <div className={styles.giftMessage}>
                            <div className={styles.giftTextWithImage}>
                              <span>You have sent a gift</span>
                              <span>{parts[1]}</span>
                            </div>
                            {/* Gift preview image below text */}
                            {msg.giftData?.giftImg && (
                              <div className={styles.giftPreviewContainer}>
                                <img 
                                  src={msg.giftData.giftImg} 
                                  alt={msg.giftData?.giftName || "Gift"}
                                  className={styles.giftPreviewImg}
                                  onError={(e) => console.error("❌ Gift preview image failed to load:", msg.giftData.giftImg)}
                                />
                                {msg.giftData?.giftName && (
                                  <div className={styles.giftPreviewName}>
                                    {msg.giftData.giftName}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Kundli messages
                      if (msg?.type === "kundli") {
                        return (
                          <div
                            onClick={() => {
                              setIframeSrc(msg.text);
                            }}
                            className={styles.kundliLink}
                          >
                            <GrReactjs />
                            View Kundli
                          </div>
                        );
                      }

                      // Text messages
                      return (
                        <PrimaryText size={14} color={"#4a4a4a"}>
                          {msg?.text}
                        </PrimaryText>
                      );
                    })()}
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

      {/* Kundli Modal */}
      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
        loading={loading}
      />

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className={styles.imagePreviewModal} onClick={() => setImagePreview(null)}>
          <div className={styles.imagePreviewContent}>
            <img src={imagePreview} alt="Preview" className={styles.previewImage} />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessages;
