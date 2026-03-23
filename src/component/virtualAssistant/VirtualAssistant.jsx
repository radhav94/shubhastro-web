import { useState, useRef, useCallback } from "react";
import { IoClose, IoSend, IoImageOutline, IoRefresh } from "react-icons/io5";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { IoCheckmarkDone } from "react-icons/io5";
import styles from "./VirtualAssistant.module.scss";
import useVirtualAssistant from "./useVirtualAssistant";
import dayjs from "dayjs";

const VirtualAssistant = ({ astrologerId, astrologerName, isOpen, setIsOpen }) => {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  const {
    messages,
    isLoading,
    sending,
    sendText,
    sendImage,
    retryMessage,
    messagesEndRef,
  } = useVirtualAssistant({ astrologerId });

  const handleSend = useCallback(() => {
    if (previewFile) {
      sendImage(previewFile);
      setPreview(null);
      setPreviewFile(null);
      return;
    }
    if (text.trim()) {
      sendText(text);
      setText("");
    }
  }, [text, previewFile, sendText, sendImage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    setPreviewFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const cancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPreviewFile(null);
  };

  const formatTime = (dateStr) => dayjs(dateStr).format("hh:mm A");

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div>
                <h4 className={styles.headerName}>
                  {astrologerName || "Virtual Assistant"}
                </h4>
                <span className={styles.headerStatus}>Virtual Assistant</span>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea}>
            {isLoading ? (
              <div className={styles.skeleton}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.skeletonBubble} ${i % 2 === 0 ? styles.right : styles.left}`}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <IoChatbubbleEllipses size={40} />
                <p>Start your conversation</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg._id}
                    className={`${styles.msgRow} ${isUser ? styles.userRow : styles.assistantRow}`}
                  >
                    <div
                      className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble} ${msg._failed ? styles.failedBubble : ""}`}
                    >
                      {msg.type === "image" ? (
                        <img
                          src={msg.message}
                          alt="Shared"
                          className={styles.msgImage}
                          onClick={() => setImagePreview(msg.message)}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/200x150?text=Image+Error";
                          }}
                        />
                      ) : (
                        <p className={styles.msgText}>{msg.message}</p>
                      )}
                      <div className={styles.msgMeta}>
                        <span className={styles.msgTime}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isUser && !msg._failed && (
                          <IoCheckmarkDone className={styles.checkmark} />
                        )}
                      </div>
                      {msg._failed && (
                        <button
                          className={styles.retryBtn}
                          onClick={() => retryMessage(msg)}
                        >
                          <IoRefresh size={14} /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview */}
          {preview && (
            <div className={styles.previewBar}>
              <img src={preview} alt="Preview" className={styles.previewImg} />
              <button className={styles.previewCancel} onClick={cancelPreview}>
                <IoClose size={16} />
              </button>
            </div>
          )}

          {/* Input */}
          <div className={styles.inputBar}>
            <button
              className={styles.attachBtn}
              onClick={() => fileRef.current?.click()}
              aria-label="Attach image"
            >
              <IoImageOutline size={20} />
            </button>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
            <input
              className={styles.textInput}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={sending}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending && !previewFile && !text.trim()}
              aria-label="Send message"
            >
              <IoSend size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className={styles.imageModal}
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={imagePreview} alt="Preview" className={styles.modalImage} />
        </div>
      )}
    </>
  );
};

export default VirtualAssistant;
