import { useRef, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoAttach, IoClose } from "react-icons/io5";
import styles from "./VideoCallChat.module.scss";
import { useGetChatHistoryQuery } from "../../redux/api/chatApi";
import { useGetS3SignedUrlMutation } from "../../redux/api/s3SignedApi";
import { useFileSelector } from "../../screens/private/home/components/chats/filePicker/useFileSelector";
import { Toast } from "../index";
import dayjs from "dayjs";
import { useVideoCallChat } from "./useVideoCallChat";
import { GrReactjs } from "react-icons/gr";
import IframeModal from "../../screens/private/home/components/chats/IframeModal";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");

const VideoCallChat = ({
  isOpen,
  onClose,
  videoCallData,
  sendMessageRef
}) => {
  const messagesRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState(null);
  const navigate = useNavigate();

  const { astrologerId, userId, isUserSide, kundliId, chatRoomId, astrologerName } = videoCallData || {};

  // Always call hooks - use the custom hook for chat functionality
  const { messages, sendMessage: sendChatMessage } = useVideoCallChat({
    userId,
    astrologerId,
    roomId: chatRoomId,
    kundliId,
    isActive: isOpen,
    astrologerName
  });

  // Expose sendMessage function via ref
  useLayoutEffect(() => {
    if (sendMessageRef) {
      sendMessageRef.current = sendChatMessage;
    }
  }, [sendChatMessage, sendMessageRef]);

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
    if (!isOpen || !videoCallData) return [];

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
      type: item?.type,
      kundliName: item?.kundliName,
      suggestedProducts: item?.suggestedProducts,
    }));

    const socketMsgs = messages.map((msg, idx) => ({
      id: `socket-${idx}-${msg.time}`,
      text: msg.text,
      isSender: msg.sender,
      time: msg.time,
      date: msg.date || formatDate(new Date()),
      dateTime: msg.dateTime || new Date().toISOString(),
      type: msg?.type,
      kundliName: msg?.kundliName,
      suggestedProducts: msg?.suggestedProducts,
    }));

    return [...historyMsgs, ...socketMsgs].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [history, messages, isUserSide, isOpen, videoCallData]);

  // Auto-scroll to bottom when new messages arrive - ALWAYS call useLayoutEffect
  useLayoutEffect(() => {
    if (!isOpen || !videoCallData) return;

    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [finalMsgs, isOpen, videoCallData]);

  // Early return after ALL hooks are called
  if (!isOpen || !videoCallData) return null;

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

  const getAttachType = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'attachment';
    }
  };

  const handleAttachClick = async () => {
    // console.log("Attach button clicked");
    try {
      const { blob, type } = await openFileSelector(
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
    let isSpecialMessage = false;
    let content = msg.text;

    try {
      if (msg.type === "audio") {
        isSpecialMessage = true;
        content = (
          <div className={styles.voiceMessage}>
            <button className={styles.playButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className={styles.waveformContainer}>
              <audio controls className={styles.audioPlayer}>
                <source src={msg.text} type="audio/mpeg" />
              </audio>
            </div>
            <span className={styles.voiceDuration}>
              {/* {Math.floor(parsed.duration / 60)}:{String(parsed.duration % 60).padStart(2, '0')} */}
            </span>
          </div>
        );
      } else if (msg.type === "video") {
        isSpecialMessage = true;
        content = (
          <div className={styles.videoMessage}>
            <div className={styles.videoWrapper}>
              <video
                className={styles.videoPlayer}
                controls
                preload="metadata"
                onClick={(e) => e.target.play()}
              >
                <source src={msg.text} type="video/mp4" />
                <a
                  href={msg.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileLink}
                >
                  📎 {msg.text}
                </a>
              </video>
            </div>

            <span className={styles.videoDuration}>
              {/* Optional: duration if you calculate later */}
            </span>
          </div>
        );
      } else if (msg.type === "kundli") {
        isSpecialMessage = true;
        content = (
          <div className={styles.KundliMessage}>
            <span
              onClick={() => {
                if (msg.text) setIframeSrc(msg.text);
              }}
            >
              <GrReactjs /> {msg.kundliName ? `${msg.kundliName}'s Kundli` : "View Kundli"}
            </span>
          </div>
        );
      } else if (msg.type === "products") {
        isSpecialMessage = true;
        const products = msg.suggestedProducts || [];
        content = (
          <div className={styles.productsMessage}>
            {msg.text && <p className={styles.productsNote}>{msg.text}</p>}
            {products.map((p) => (
              <div key={p.productId} className={styles.productItem} onClick={() => p.slug && navigate(`/product-details/${p.slug}`)}>
                {(p.image || p.images?.[0]) && (
                  <img src={p.image || p.images?.[0]} alt={p.title} className={styles.productThumb} onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <div className={styles.productMeta}>
                  <span className={styles.productName}>{p.title}</span>
                  <span className={styles.productPrice}>
                    ₹{p.price}
                    {p.mrp && p.mrp > p.price && (
                      <s className={styles.productMrp}>₹{p.mrp}</s>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      } else if (msg.type === "image") {
        isSpecialMessage = true;
        content = (
          <div className={styles.fileMessage}>
            <div>
              <img
                src={msg.text}
                alt={msg.text}
                className={styles.imageAttachment}
                onClick={() => window.open(msg.text, '_blank')}
              />
            </div>
          </div>
        );
      } else {
        if (msg.type !== "message" && msg.type !== "gift") isSpecialMessage = true;
        content = (
          <div className={styles.fileMessage}>
            <a
              href={msg.text}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fileLink}
            >
              📎 {msg.text}
            </a>

          </div>
        );
      }
    } catch (e) {
      // Not a JSON message, treat as regular text
    }

    return (
      <>{isSpecialMessage && (<div
        key={index}
        className={`${styles.message} ${msg.isSender ? styles.sent : styles.received
          }`}
      >
        <div className={styles.messageContent}>
          {content}
        </div>
        <div className={styles.messageTime}>{msg.time}</div>
      </div>)}</>

    );
  };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <h3>Virtual Assistant</h3>
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
      {/* 👇 Modal */}
      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
      />
    </div>
  );
};

export default VideoCallChat;