import { ChevronLeft, MessageSquareText, AlertCircle, ChevronRight, Send, Paperclip, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetTicketByIdQuery, useReplyToTicketMutation } from "../../../redux/api/supportApi/supportApi";
import { useGetS3SignedUrlMutation } from "../../../redux/api/s3SignedApi";
import { Toast } from "../../../component/index";
import RatingCard from "./RatingCard";
import styles from "./TicketDetails.module.scss";

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [replyText, setReplyText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: ticketData, isLoading, refetch } = useGetTicketByIdQuery(ticketId);
  const [replyToTicket, { isLoading: isSending }] = useReplyToTicketMutation();
  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const ticket = ticketData?.data || {};

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusLabel = (status) => {
    if (status === "resolved" || status === "closed") return "● Resolved";
    return "● " + (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending");
  };

  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages]);

  const handleSendReply = async () => {
    const text = replyText.trim();
    if ((!text && attachments.length === 0) || isSending) return;
    try {
      const body = { message: text || "Attachment", isUserMessage: true };
      if (attachments.length > 0) {
        body.attachments = attachments;
      }
      await replyToTicket({ ticketId: ticket._id || ticketId, ...body }).unwrap();
      setReplyText("");
      setAttachments([]);
      refetch();
    } catch {
      // handled by privateRequestNew
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 10 * 1024 * 1024) {
      Toast.error("File size must be under 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileType = ext ? `application/${ext}` : file.type;
      const signedUrl = await getS3SignedUrl({ fileType }).unwrap();
      const uploadUrl = signedUrl.uploadUrl;
      const fileUrl = uploadUrl.split("?")[0];

      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("Upload failed");

      setAttachments((prev) => [
        ...prev,
        { url: fileUrl, fileName: file.name, fileType: file.type, fileSize: file.size },
      ]);
    } catch {
      Toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.ticketDetailsPage}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ticketDetailsPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>{ticket.ticketId || `#${ticketId}`}</h1>
        <span
          className={`${styles.statusBadge} ${isResolved ? styles.statusResolved : styles.statusOngoing}`}
        >
          {getStatusLabel(ticket.status)}
        </span>
      </div>

      <div className={styles.chatContainer}>
        {/* First message card */}
        {(() => {
          const firstMsg = ticket.messages?.[0];
          const initMsg = firstMsg?.initialMessage;
          const entityDetails = initMsg?.entityDetails;
          const concernText = initMsg?.concernText || ticket.concernText;
          const subTopic = initMsg?.subTopic;
          const astrologerName = entityDetails?.astrologerName || entityDetails?.name;
          const astrologerImg = entityDetails?.profileImgUrl;

          return (
            <motion.div
              className={`${styles.messageWrapper} ${styles.sentWrapper} ${styles.fmWrapper}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className={styles.firstMessageCard}>
                <div className={styles.fmHeader}>
                  <div className={styles.fmHeaderIcon}>
                    <AlertCircle size={18} />
                  </div>
                  <div className={styles.fmHeaderText}>
                    <p className={styles.fmTopic}>{ticket.topicName || initMsg?.topic}</p>
                    {subTopic && <span className={styles.fmSubTopic}>{subTopic}</span>}
                    {concernText && <span className={styles.fmConcernChip}>{concernText}</span>}
                  </div>
                </div>

                <div className={styles.fmBody}>
                  {astrologerName && (
                    <div className={styles.fmAstrologer}>
                      {astrologerImg ? (
                        <img src={astrologerImg} alt={astrologerName} className={styles.fmAstrologerImg} />
                      ) : (
                        <div className={styles.fmAstrologerAvatar}>
                          {astrologerName.charAt(0)}
                        </div>
                      )}
                      <div className={styles.fmAstrologerInfo}>
                        <span className={styles.fmAstrologerName}>{astrologerName}</span>
                        <span className={styles.fmAstrologerLabel}>Astrologer</span>
                      </div>
                      <ChevronRight size={16} className={styles.fmAstrologerArrow} />
                    </div>
                  )}

                  {ticket.issue && (
                    <div className={styles.fmIssueWrap}>
                      <MessageSquareText size={14} className={styles.fmIssueIcon} />
                      <p className={styles.fmIssue}>{ticket.issue}</p>
                    </div>
                  )}
                </div>
              </div>
              <span className={styles.fmTime}>{formatTime(firstMsg?.createdAt || ticket.createdAt)}</span>
            </motion.div>
          );
        })()}

        {/* Remaining messages (skip first since it's rendered above) */}
        {ticket.messages?.slice(1).map((message, index) => (
          <motion.div
            key={message._id || index}
            className={`${styles.messageWrapper} ${
              message.isUserMessage ? styles.sentWrapper : styles.receivedWrapper
            } ${styles.msgOuter}`}
            initial={{ opacity: 0, x: message.isUserMessage ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 * (index + 1), ease: "easeOut" }}
          >
            <div
              className={`${styles.message} ${
                message.isUserMessage ? styles.sentMessage : styles.receivedMessage
              }`}
            >
              <p className={styles.messageText}>{message.messageText || message.text}</p>
              {message.attachments?.length > 0 && (
                <div className={styles.msgAttachments}>
                  {message.attachments.map((att, ai) => (
                    att.fileType?.startsWith("image/") ? (
                      <a key={ai} href={att.url} target="_blank" rel="noreferrer">
                        <img src={att.url} alt={att.fileName} className={styles.msgAttachImg} />
                      </a>
                    ) : (
                      <a key={ai} href={att.url} target="_blank" rel="noreferrer" className={styles.msgAttachFile}>
                        📎 {att.fileName}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
            <span className={styles.msgTime}>{formatTime(message.createdAt)}</span>
          </motion.div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom section - Rating for resolved, Input for open */}
      <motion.div
        className={styles.bottomFixed}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        {isResolved ? (
          ticket.rating > 0 ? (
            <div className={styles.ratedDisplay}>
              <div className={styles.ratedStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} width="44" height="44" viewBox="0 0 48 48" fill={star <= ticket.rating ? "#ff6b35" : "#e0e0e0"}>
                    <path d="M24 4L28.944 18.528H44.472L32.264 27.472L37.208 42L24 33.056L10.792 42L15.736 27.472L3.528 18.528H19.056L24 4Z" />
                  </svg>
                ))}
              </div>
              <p className={styles.ratedText}>Thank you for your feedback!</p>
            </div>
          ) : (
            <RatingCard ticketId={ticket._id || ticketId} existingRating={0} />
          )
        ) : (
          <div className={styles.replyBar}>
            {attachments.length > 0 && (
              <div className={styles.attachmentPreview}>
                {attachments.map((att, i) => (
                  <div key={i} className={styles.attachmentChip}>
                    <span className={styles.attachmentName}>{att.fileName}</span>
                    <button className={styles.attachmentRemove} onClick={() => removeAttachment(i)}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.replyInputRow}>
              <button
                className={styles.attachButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Attach file"
              >
                {isUploading ? (
                  <span className={styles.uploadingDot}>...</span>
                ) : (
                  <Paperclip size={20} />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              <input
                type="text"
                className={styles.replyInput}
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <button
                className={styles.sendButton}
                onClick={handleSendReply}
                disabled={(!replyText.trim() && attachments.length === 0) || isSending}
                aria-label="Send reply"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TicketDetails;
