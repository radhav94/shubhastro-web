import { useState, useRef, useLayoutEffect, useMemo } from "react";
import { IoSend, IoAttach, IoClose } from "react-icons/io5";
import styles from "./VideoCallChat.module.scss";
import { useGetChatHistoryQuery } from "../../redux/api/chatApi";
import { useGetS3SignedUrlMutation } from "../../redux/api/s3SignedApi";
import { useFileSelector } from "../../screens/private/home/components/chats/filePicker/useFileSelector";
import { Toast } from "../index";
import dayjs from "dayjs";
import { useVideoCallChat } from "./useVideoCallChat";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");

const VideoCallChat = ({ 
  isOpen, 
  onClose, 
  videoCallData
}) => {
  const [message, setMessage] = useState("");
  const messagesRef = useRef(null);
  
  const { astrologerId, userId, isUserSide, kundliId, chatRoomId, astrologerName } = videoCallData;
  
  // Use the custom hook for chat functionality
  const { messages, isTyping, sendMessage: sendChatMessage, sendTyping } = useVideoCallChat({
    userId,
    astrologerId,
    roomId: chatRoomId,
    kundliId,
    isActive: isOpen,
    astrologerName
  });
  
  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const { openFileSelector } = useFileSelector();

  // Get chat history
  const { data } = useGetChatHistoryQuery(
    { userId: astrologerId },
    { refetchOnMountOrArgChange: true }
  );
  const history = data?.data || [];

  // Combine history and real-time messages
  const finalMsgs = useMemo(() => {
    const historyMsgs = history.map((item) => ({
      text: item.message || "",
      isSender: isUserSide
        ? item.sender === "user"
        : item.sender === "astrologer",
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateTime: item.createdAt,
    }));

    const socketMsgs = messages.map((msg, idx) => ({
      id: `socket-${idx}-${msg.time}`,
      text: msg.text,
      isSender: msg.sender,
      time: msg.time,
      date: msg.date || formatDate(new Date()),
      dateTime: msg.dateTime || new Date().toISOString(),
    }));

    return [...historyMsgs, ...socketMsgs].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [history, messages, isUserSide]);

  // Auto-scroll to bottom when new messages arrive
  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [finalMsgs]);

  // const handleSend = () => {
  //   console.log("Send button clicked, message:", message);
  //   if (!message.trim()) return;
  //   sendChatMessage(message);
  //   setMessage("");
  // };

  // const handleMessageChange = (e) => {
  //   setMessage(e.target.value);
  //   sendTyping();
  // };

  const sendFiles = async (blob, attachType) => {
    try {
      const signedUrl = await getS3SignedUrl({
        fileType: blob.type,
      }).unwrap();
      const uploadUrl = signedUrl.uploadUrl;
      const fileUrl = uploadUrl.split("?")[0];
      await uploadFileToS3(uploadUrl, blob);
      sendChatMessage(fileUrl, attachType);
      Toast.success("File sent successfully");
    } catch (error) {
      Toast.error("Failed to send file");
      console.error("File upload error:", error);
    }
  };

  const uploadFileToS3 = async (uploadUrl, blob) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type,
      },
    });

    if (!res.ok) {
      throw new Error("S3 upload failed");
    }

    return "success";
  };

  const handleAttachClick = async () => {
    // console.log("Attach button clicked");
    try {
      const { blob, name, type, size } = await openFileSelector(
        "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
      );
      // console.log("File selected:", { name, type, size });
      const attachType = getAttachType(type);
      await sendFiles(blob, attachType);
    } catch (err) {
      console.log("File selection cancelled or failed:", err);
    }
  };

  const renderMessage = (msg, index) => {
    let content = msg.text;
    let isSpecialMessage = false;
    // Try to parse as JSON for special message types
    try {
      if (msg.type === "audio") {
        isSpecialMessage = true;
        content = (
          <div className={styles.voiceMessage}>
            <button className={styles.playButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <div className={styles.waveformContainer}>
              <audio controls className={styles.audioPlayer}>
                <source src={content} type="audio/mpeg" />
              </audio>
            </div>
            <span className={styles.voiceDuration}>
              {/* {Math.floor(parsed.duration / 60)}:{String(parsed.duration % 60).padStart(2, '0')} */}
            </span>
          </div>
        );
      } else if (msg.type === "attachment" || msg.type === "image") {
        isSpecialMessage = true;
        content = (
          <div className={styles.fileMessage}>
            {msg.type === "image" ? (
              <img 
                src={content} 
                alt={content}
                className={styles.imageAttachment}
                onClick={() => window.open(content, '_blank')}
              />
            ) : (
              <a 
                href={content} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.fileLink}
              >
                📎 {content}
              </a>
            )}
          </div>
        );
      }
    } catch (e) {
      // Not a JSON message, treat as regular text
    }

    return (
      <>{isSpecialMessage && (<div
        key={index}
        className={`${styles.message} ${
          msg.isSender ? styles.sent : styles.received
        }`}
      >
        <div className={styles.messageContent}>
          <span>{content}</span>
        </div>
        <div className={styles.messageTime}>{msg.time}</div>
      </div>)}</>
      
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <h3>Chat</h3>
        <button className={styles.closeButton} onClick={onClose}>
          <IoClose size={20} />
        </button>
      </div>

      <div className={styles.messagesContainer} ref={messagesRef}>
        {finalMsgs.map((msg, index) => renderMessage(msg, index))}
        
        {/* {isTyping && (
          <div className={`${styles.message} ${styles.received}`}>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )} */}
      </div>

      <div className={styles.inputContainer}>
        <button
          type="button"
          className={styles.attachButton}
          onClick={handleAttachClick}
          title="Attach file"
        >
          <IoAttach size={18} />
        </button>

        {/* <input
          className={styles.messageInput}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />

        <button 
          className={styles.sendButton} 
          onClick={() => handleSend()}
          disabled={!message.trim()}
        >
          <IoSend size={18} />
        </button> */}
      </div>
    </div>
  );
};

export default VideoCallChat;