import React, { useRef, useCallback, useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Check, CheckCheck, ExternalLink } from "lucide-react";
import { IoDocument, IoDownload } from "react-icons/io5";
import { FiFile } from "react-icons/fi";
import { GrReactjs } from "react-icons/gr";
import AudioMessageWrapper from "../../../home/components/chats/AudioMessageWrapper";
import styles from "./ChatWindow.module.scss";

// Constants
const FILE_SIZE_UNITS = {
  BYTE: 1024,
  KB: 1024 * 1024,
};

const MESSAGE_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  ATTACHMENT: "attachment",
  KUNDLI: "kundli",
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Helper functions
const getFileExtension = (filename) => {
  return filename?.split(".").pop()?.toLowerCase() || "";
};

const getFileName = (url) => {
  try {
    return url?.split("/").pop() || "attachment";
  } catch {
    return "attachment";
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < FILE_SIZE_UNITS.BYTE) return `${bytes} B`;
  if (bytes < FILE_SIZE_UNITS.KB)
    return `${(bytes / FILE_SIZE_UNITS.BYTE).toFixed(1)} KB`;
  return `${(bytes / FILE_SIZE_UNITS.KB).toFixed(1)} MB`;
};

const detectURL = (text) => {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
};

const ChatWindow = ({ chatSessions, onLoadMore, hasMore, isLoading }) => {
  const chatContainerRef = useRef(null);
  const observerRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [kundliModal, setKundliModal] = useState(null);

  // Listen for close message from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'CLOSE_KUNDLI_MODAL') {
        setKundliModal(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Intersection Observer for infinite scroll
  const lastSessionRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, onLoadMore]
  );

  // Handlers
  const handleImageClick = useCallback((imageUrl) => {
    setImagePreview(imageUrl);
  }, []);

  const handleKundliClick = useCallback((kundliUrl) => {
    setKundliModal(kundliUrl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setImagePreview(null);
    setKundliModal(null);
  }, []);


  // Render message content based on type
  const renderMessageContent = useCallback(
    (message) => {
      const { type, message: content, fileSize } = message;

      console.log("content Chat::",content)
      switch (type) {
        case MESSAGE_TYPES.IMAGE:
          return (
            <div className={styles.imageMessage}>
              <img
                src={content}
                alt="Shared"
                className={styles.messageImage}
                onClick={() => handleImageClick(content)}
                loading="lazy"
              />
            </div>
          );

        case MESSAGE_TYPES.VIDEO:
          return (
            <div className={styles.videoMessage}>
              <div className={styles.videoWrapper}>
                <video
                  src={content}
                  className={styles.messageVideo}
                  controls
                  preload="metadata"
                >
                  Your browser does not support the video element.
                </video>
              </div>
            </div>
          );

        case MESSAGE_TYPES.AUDIO:
          return (
            <AudioMessageWrapper
              url={content}
              duration={message.duration}
              isSender={message.sender === "user"}
            />
          );

        case MESSAGE_TYPES.ATTACHMENT: {
          const fileName = getFileName(content);
          const fileExt = getFileExtension(fileName);

          return (
            <div className={styles.attachmentMessage}>
              <div className={styles.attachmentIcon}>
                {fileExt === "pdf" ? (
                  <IoDocument size={24} />
                ) : (
                  <FiFile size={24} />
                )}
              </div>
              <div className={styles.attachmentInfo}>
                <div className={styles.attachmentName}>{fileName}</div>
                {fileSize && (
                  <div className={styles.attachmentSize}>
                    {formatFileSize(fileSize)}
                  </div>
                )}
              </div>
              <a
                href={content}
                download={fileName}
                className={styles.downloadButton}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Download ${fileName}`}
              >
                <IoDownload size={20} />
              </a>
            </div>
          );
        }

        case MESSAGE_TYPES.KUNDLI:
          return (
            <button
              type="button"
              onClick={() => handleKundliClick(content)}
              className={styles.kundliLink}
              aria-label="View Kundli"
            >
              <GrReactjs />
              {message?.kundliName ? `${message.kundliName}'s Kundli` : "View Kundli"}
            </button>
          );

        default: {
          // Check for external URLs in text messages
          const detectedURL = detectURL(content);
          if (detectedURL && type !== MESSAGE_TYPES.KUNDLI) {
            return (
              <div className={styles.linkMessage}>
                {content !== detectedURL && (
                  <p className={styles.messageText}>{content}</p>
                )}
                <a
                  href={detectedURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkPreview}
                  aria-label="Open link"
                >
                  <ExternalLink size={16} />
                  <span className={styles.linkText}>{detectedURL}</span>
                </a>
              </div>
            );
          }

          // Regular text messages
          return <p className={styles.messageText}>{content}</p>;
        }
      }
    },
    [handleImageClick, handleKundliClick]
  );

  // Memoize empty state
  const emptyState = useMemo(
    () => (
      <div className={styles.emptyState}>
        <p>No chat history found</p>
      </div>
    ),
    []
  );

  if (!chatSessions || chatSessions.length === 0) {
    return emptyState;
  }

  

  return (
    <div className={styles.chatWindow} ref={chatContainerRef}>
      {chatSessions.map((session, sessionIndex) => {
        const isLastSession = sessionIndex === chatSessions.length - 1;

        return (
          <div
            key={session.sessionId}
            className={styles.chatSession}
            ref={isLastSession ? lastSessionRef : null}
          >
            {/* Session Header */}
            <div className={styles.sessionHeader}>
              <h3 className={styles.sessionId}>
                #{session.roomId.slice(-4)}
              </h3>
              <div className={styles.divider} />
              <p className={styles.sessionDateTime}>
                {session.date} • {session.time}
              </p>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {session.messages.map((message) => {
                const isSender = message.sender === "user";
                const MessageWrapper = isSender
                  ? "div"
                  : "div";

                return (
                  <MessageWrapper key={message.id}>
                    {isSender ? (
                      // Sent Message (Right Side)
                      <div className={styles.sentMessageWrapper}>
                        <div className={styles.sentBubble}>
                          {renderMessageContent(message)}
                        </div>
                        <div className={styles.messageMeta}>
                          <span className={styles.time}>{message.time}</span>
                          <span
                            className={styles.messageStatus}
                            aria-label={
                              message.status === "read"
                                ? "Message read"
                                : "Message sent"
                            }
                          >
                            {message.status === "read" ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Received Message (Left Side)
                      <div className={styles.receivedMessageWrapper}>
                        <div className={styles.receivedBubble}>
                          {renderMessageContent(message)}
                        </div>
                        <span className={styles.receivedTime}>
                          {message.time}
                        </span>
                      </div>
                    )}
                  </MessageWrapper>
                );
              })}
            </div>

            {/* Session Divider (except for last session) */}
            {!isLastSession && <div className={styles.sessionDivider} />}
          </div>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingMore} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p>Loading more chats...</p>
        </div>
      )}

      {/* End of data indicator */}
      {!hasMore && chatSessions.length > 0 && (
        <div className={styles.endMessage} role="status">
          <p>No more chat history</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className={styles.imagePreviewModal}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className={styles.imagePreviewContent}>
            <img
              src={imagePreview}
              alt="Preview"
              className={styles.previewImage}
            />
          </div>
        </div>
      )}

      {/* Kundli Modal */}
      {kundliModal && (
        <div
          className={styles.kundliModal}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label="Kundli viewer"
        >
          <div
            className={styles.kundliModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${kundliModal}${kundliModal?.includes('?') ? '&' : '?'}iframe=true`}
              title="Kundli"
              className={styles.kundliIframe}
            />
          </div>
        </div>
      )}
    </div>
  );
};

ChatWindow.propTypes = {
  chatSessions: PropTypes.arrayOf(
    PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      roomId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          sender: PropTypes.string.isRequired,
          message: PropTypes.string.isRequired,
          time: PropTypes.string.isRequired,
          type: PropTypes.string,
          status: PropTypes.string,
          fileSize: PropTypes.number,
        })
      ).isRequired,
    })
  ),
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

ChatWindow.defaultProps = {
  chatSessions: [],
};

export default React.memo(ChatWindow);
