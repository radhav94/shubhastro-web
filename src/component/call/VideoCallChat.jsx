import { useRef, useLayoutEffect, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoAttach, IoClose } from "react-icons/io5";
import { FaFileAlt } from "react-icons/fa";
import PdfIcon from "../../assets/chat/PDF.svg";
import DocIcon from "../../assets/chat/DOC.svg";
import XlsIcon from "../../assets/chat/XLS.svg";
import styles from "./VideoCallChat.module.scss";
import { useGetChatHistoryQuery } from "../../redux/api/chatApi";
import { useGetS3SignedUrlMutation } from "../../redux/api/s3SignedApi";
import { useFileSelector } from "../../screens/private/home/components/chats/filePicker/useFileSelector";
import { Toast } from "../index";
import dayjs from "dayjs";
import { useVideoCallChat } from "./useVideoCallChat";
import { isShubhMallEnabled } from "../../utils/featureConfig";
import { GrReactjs } from "react-icons/gr";
import IframeModal from "../../screens/private/home/components/chats/IframeModal";
import KundliSelectModal from "../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";
import AudioMessageWrapper from "../../screens/private/home/components/chats/AudioMessageWrapper";
import { buildKundliLink } from "../../utils/helper/kundliMessage";
import { getAttachmentDisplayName } from "../../utils/helper/getAttachmentDisplayName";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");

const VideoCallChat = ({ isOpen, onClose, videoCallData, sendMessageRef }) => {
  const messagesRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    astrologerId,
    userId,
    isUserSide,
    kundliId,
    chatRoomId,
    astrologerName,
  } = videoCallData || {};

  // Always call hooks - use the custom hook for chat functionality
  const { messages, sendMessage: sendChatMessage } = useVideoCallChat({
    userId,
    astrologerId,
    roomId: chatRoomId,
    kundliId,
    isActive: isOpen,
    astrologerName,
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
    { refetchOnMountOrArgChange: true },
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
        hour12: true,
      }).toUpperCase(),
      dateTime: item.createdAt,
      type: item?.type,
      kundliName: item?.kundliName,
      suggestedProducts: item?.suggestedProducts,
      kundliId: item?.kundliId,
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
      kundliId: msg?.kundliId,
    }));

    return [...historyMsgs, ...socketMsgs].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime),
    );
  }, [history, messages, isUserSide, isOpen, videoCallData]);

  // Auto-scroll to bottom when new messages arrive - ALWAYS call useLayoutEffect
  useLayoutEffect(() => {
    if (!isOpen || !videoCallData) return;

    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [finalMsgs, isOpen, videoCallData]);

  // Camera stream management - MUST be before early return (React hooks rule)
  useEffect(() => {
    // Also gate on `isOpen`: this is a persistent floating widget that renders
    // null (without unmounting) when closed, so we must stop the camera when the
    // widget is closed / hidden as well as on unmount and browser Back.
    if (!cameraOpen || !isOpen) return undefined;
    let active = true;
    const startStream = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (active) {
          Toast.error("Camera access denied");
          setCameraOpen(false);
        }
      }
    };
    startStream();
    return () => {
      active = false;
      // Release the camera on teardown (camera closed, facing switch, widget
      // closed, unmount, or browser Back) so it never stays on.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, facingMode, isOpen]);

  // Reset camera/attach state whenever the widget is closed so it never reopens
  // silently with the camera running.
  useEffect(() => {
    if (!isOpen) {
      setCameraOpen(false);
      setAttachMenuOpen(false);
    }
  }, [isOpen]);

  // This widget stays mounted across route changes, so the browser Back button
  // won't unmount it. Stop the camera explicitly on back/forward navigation.
  useEffect(() => {
    const handlePopState = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  // OLD: broken kundli handler — referenced undefined `toast` and `onSend`
  // const handleChatAfterKundliSelect = async (kundli) => {
  //     setKundliModalOpen(false);
  //     if (!kundli?._id) return toast.error("Kundli not selected properly");
  //     onSend(kundli);
  //   };

  // OLD: ProfileManager handler — auto-selected self kundli
  // const handleKundliSelect = (selectedProfile) => {
  //   setKundliModalOpen(false);
  //   if (!selectedProfile?._id) { Toast.error("Kundli not selected properly"); return; }
  //   sendChatMessage(selectedProfile._id, "kundli");
  // };

  // NEW: KundliSelectModal handler — user picks from list, sends kundli link with correct kundliId
  const handleChatAfterKundliSelect = (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) {
      Toast.error("Kundli not selected properly");
      return;
    }
    // Send the bare kundliId as the message (origin-independent). Pass it as the
    // third arg too so the socket payload uses the selected kundli's id.
    sendChatMessage(kundli._id, "kundli", kundli._id);
  };

  // NEW: handle attach menu option selection (aligned with ChatInput.jsx)
  const handleAttachOption = async (type) => {
    setAttachMenuOpen(false);
    if (type === "kundali") {
      setKundliModalOpen(true);
      return;
    }
    if (type === "camera") {
      setCameraOpen(true);
      return;
    }
    try {
      const accept =
        type === "photo" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx";
      const { blob } = await openFileSelector(accept);
      const attachType = getAttachType(blob.type);
      await sendFiles(blob, attachType);
    } catch {
      console.log("File selection cancelled");
    }
  };

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
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType.startsWith("video/")) {
      return "video";
    } else if (mimeType.startsWith("audio/")) {
      return "audio";
    } else {
      return "attachment";
    }
  };

  // OLD: directly opened file selector on attach click
  // const handleAttachClick = async () => {
  //   try {
  //     const { blob, type } = await openFileSelector(
  //       "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx",
  //     );
  //     const attachType = getAttachType(type);
  //     await sendFiles(blob, attachType);
  //   } catch (err) {
  //     console.log("File selection cancelled or failed:", err);
  //   }
  // };

  // Camera helper functions
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  const handleCameraClose = () => {
    stopStream();
    setCameraOpen(false);
  };
  const handleSwitchCamera = () =>
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        stopStream();
        setCameraOpen(false);
        setCameraPreview({ url, blob });
      },
      "image/jpeg",
      0.92,
    );
  };
  const handleCameraPreviewSend = async () => {
    if (!cameraPreview || isSending) return;
    setIsSending(true);
    try {
      await sendFiles(cameraPreview.blob, "image");
      URL.revokeObjectURL(cameraPreview.url);
      setCameraPreview(null);
    } finally {
      setIsSending(false);
    }
  };
  const handleCameraRetake = () => {
    URL.revokeObjectURL(cameraPreview?.url);
    setCameraPreview(null);
    setCameraOpen(true);
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return <img src={PdfIcon} alt="PDF" className="w-5 h-5 flex-shrink-0" />;
      case 'doc': case 'docx':
        return <img src={DocIcon} alt="DOC" className="w-5 h-5 flex-shrink-0" />;
      case 'xls': case 'xlsx': case 'csv':
        return <img src={XlsIcon} alt="XLS" className="w-5 h-5 flex-shrink-0" />;
      default:
        return <FaFileAlt className="text-lg flex-shrink-0" style={{ color: '#757575' }} />;
    }
  };

  const renderMessage = (msg, index) => {
    let isSpecialMessage = false;
    let content = msg.text;
    try {
      if (msg.type === "audio") {
        isSpecialMessage = true;
        content = (
          <AudioMessageWrapper
            url={msg.text}
            duration={msg.duration}
            time={msg.time}
            isSender={msg.isSender}
          />
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
        // Resolve from kundliId, falling back to parsing the message text
        // (bare id or full URL).
        const kundliLink = buildKundliLink(msg.kundliId, msg.text ?? msg.message);
        content = (
          <div className={styles.KundliMessage}>
            {/* A <button>, not a span: this is an action. And when the link
                can't be resolved the tap used to do nothing at all. */}
            <button
              type="button"
              onClick={() => {
                if (!kundliLink) {
                  Toast.error("This kundli is no longer available to view.");
                  return;
                }
                setIframeSrc(kundliLink);
              }}
            >
              <GrReactjs />{" "}
              {msg.kundliName ? `${msg.kundliName}'s Kundli` : "View Kundli"}
            </button>
          </div>
        );
      } else if (msg.type === "products") {
        if (!isShubhMallEnabled()) {
          return null;
        }
        isSpecialMessage = true;
        const products = msg.suggestedProducts || [];
        content = (
          <div className={styles.productsMessage}>
            {msg.text && <p className={styles.productsNote}>{msg.text}</p>}
            {products.map((p, idx) => (
              // A <button>, not a div: the whole tile is a navigation target.
              // The Shubh Mall check is already handled above (the block
              // returns null when it is off), so a missing slug is the only
              // reason a tap can't go anywhere — say so rather than no-op.
              <button
                type="button"
                key={p.productId || idx}
                className={styles.productItem}
                onClick={() => {
                  if (!p.slug) {
                    Toast.error("This product is no longer available.");
                    return;
                  }
                  navigate(`/product-details/${p.slug}`);
                }}
              >
                {(p.variantImage || p.image || p.images?.[0]) && (
                  <img
                    src={p.variantImage || p.image || p.images?.[0]}
                    alt={p.title}
                    className={styles.productThumb}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <div className={styles.productMeta}>
                  <span className={styles.productName}>{p.title}</span>
                  {p.variantTitle && (
                    <span className={styles.productVariant}>{p.variantTitle}</span>
                  )}
                  {p.brand && (
                    <span className={styles.productBrand}>
                      {typeof p.brand === "object" ? p.brand?.name : p.brand}
                    </span>
                  )}
                  {p.short_description && (
                    <span className={styles.productDesc}>{p.short_description}</span>
                  )}
                  {(p.variantPrice != null || p.price != null) && (
                    <span className={styles.productPrice}>
                      ₹{p.variantPrice ?? p.price}
                      {(p.variantMrp || p.mrp) && (p.variantMrp || p.mrp) > (p.variantPrice ?? p.price) && (
                        <>
                          <s className={styles.productMrp}>₹{p.variantMrp || p.mrp}</s>
                          <span className={styles.productDiscount}>
                            {Math.round((((p.variantMrp || p.mrp) - (p.variantPrice ?? p.price)) / (p.variantMrp || p.mrp)) * 100)}% off
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  {p.category?.length > 0 && (
                    <div className={styles.productCategories}>
                      {p.category.map((cat) => (
                        <span key={cat.ID} className={styles.productCategoryTag}>{cat.name}</span>
                      ))}
                    </div>
                  )}
                  {p.slug && (
                    <span className={styles.viewProductLink}>View Product →</span>
                  )}
                </div>
              </button>
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
                draggable={false}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreview(msg.text); }}
              />
            </div>
          </div>
        );
      } else if (msg.type === "attachment") {
        isSpecialMessage = true;
        const displayName = getAttachmentDisplayName(msg.text);
        let fileUrl = msg.text;
        try {
          const parsed = typeof msg.text === "string" ? JSON.parse(msg.text) : msg.text;
          if (parsed?.url) fileUrl = parsed.url;
        } catch { /* use msg.text as URL */ }
        const handleDownload = async (e) => {
          e.preventDefault();
          try {
            const res = await fetch(fileUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = displayName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          } catch {
            window.open(fileUrl, "_blank");
          }
        };
        content = (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-sm font-semibold text-inherit cursor-pointer bg-transparent border-none p-0"
          >
            {getFileIcon(displayName)}
            <span className="truncate max-w-[180px]">{displayName}</span>
          </button>
        );
      } else {
        if (msg.type !== "message" && msg.type !== "gift")
          isSpecialMessage = true;
        const fallbackName = getAttachmentDisplayName(msg.text);
        const fallbackUrl = msg.text;
        const handleFallbackDownload = async (e) => {
          e.preventDefault();
          try {
            const res = await fetch(fallbackUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fallbackName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          } catch {
            window.open(fallbackUrl, "_blank");
          }
        };
        content = (
          <div className={styles.fileMessage}>
            <button
              onClick={handleFallbackDownload}
              className="flex items-center gap-2 text-sm font-semibold text-inherit cursor-pointer bg-transparent border-none p-0"
            >
              {getFileIcon(fallbackName)}
              <span className="truncate max-w-[180px]">{fallbackName}</span>
            </button>
          </div>
        );
      }
    } catch (e) {
      // Not a JSON message, treat as regular text
    }

    return (
      <>
        {isSpecialMessage && (
          <div
            key={index}
            className={`${styles.message} ${
              msg.isSender ? styles.sent : styles.received
            }`}
          >
            <div className={`${styles.messageContent} ${msg.type === "audio" ? styles.messageContentAudio : ""}`}>{content}</div>
            <div className={styles.messageTime}>{msg.time}</div>
          </div>
        )}
      </>
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
          onClick={() => setAttachMenuOpen(true)}
          title="Attach file"
        >
          <IoAttach size={25} /> Attach File
        </button>

        {/* Attach File Modal */}
        {attachMenuOpen && (
          <div
            className={styles.attachOverlay}
            onClick={() => setAttachMenuOpen(false)}
          >
            <div
              className={styles.attachSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.attachHeader}>
                <div>
                  <h3 className={styles.attachTitle}>Attach File</h3>
                  <p className={styles.attachSubtitle}>
                    Please attach the file you would like to include.
                  </p>
                </div>
                <button
                  className={styles.attachClose}
                  onClick={() => setAttachMenuOpen(false)}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle
                      cx="11"
                      cy="11"
                      r="10"
                      stroke="#F75801"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5"
                      stroke="#F75801"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className={styles.attachOptions}>
                {[
                  {
                    key: "camera",
                    label: "Camera",
                    icon: (
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="13"
                          r="4"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </svg>
                    ),
                  },
                  {
                    key: "photo",
                    label: "Photo",
                    icon: (
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="3"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
                        <path
                          d="M21 15L16 10L5 21"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    key: "document",
                    label: "Document",
                    icon: (
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="8"
                          y1="13"
                          x2="16"
                          y2="13"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="8"
                          y1="17"
                          x2="16"
                          y2="17"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    key: "kundali",
                    label: "Kundali",
                    icon: (
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <text
                          x="3"
                          y="19"
                          fontSize="18"
                          fill="white"
                          fontFamily="serif"
                        >
                          卐
                        </text>
                      </svg>
                    ),
                  },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    className={styles.attachOption}
                    onClick={() => handleAttachOption(key)}
                  >
                    <div className={styles.attachIconCircle}>{icon}</div>
                    <span className={styles.attachOptionLabel}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* <input ... /> and <button ... /> commented out above */}
      </div>

      {/* Live Camera View */}
      {cameraOpen && (
        <div className={styles.cameraPreviewOverlay}>
          <div className={styles.cameraPreviewContainer}>
            <video
              ref={videoRef}
              className={styles.cameraPreviewImg}
              autoPlay
              playsInline
              muted
            />
            {/* Close button - top right */}
            <button
              className={styles.cameraCloseBtn}
              onClick={handleCameraClose}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              className={styles.cameraSwitchBtn}
              onClick={handleSwitchCamera}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 7L16 3L12 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3V15C16 16.1046 15.1046 17 14 17H4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 17L8 21L12 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 21V9C8 7.89543 8.89543 7 10 7H20"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className={styles.cameraPreviewActions}>
              <button
                className={styles.cameraShutterBtn}
                onClick={handleCapture}
              >
                <span className={styles.cameraShutterInner} />
              </button>
              <div style={{ width: 100 }} />
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview after capture */}
      {cameraPreview && (
        <div className={styles.cameraPreviewOverlay}>
          <div className={styles.cameraPreviewContainer}>
            <img
              src={cameraPreview.url}
              alt="Preview"
              className={styles.cameraPreviewImg}
            />
            <div className={styles.cameraPreviewActions}>
              <button
                className={styles.cameraRetakeBtn}
                onClick={handleCameraRetake}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M1 4V10H7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.51 15C4.96 18.57 8.35 21 12.27 21C17.1 21 21 17.1 21 12.27C21 7.44 17.1 3.54 12.27 3.54C9.18 3.54 6.46 5.07 4.8 7.42L1 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Retake
              </button>
              <button
                className={styles.cameraSendBtn}
                onClick={handleCameraPreviewSend}
                disabled={isSending}
              >
                {isSending ? (
                  <span className={styles.sendingDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 2L11 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M22 2L15 22L11 13L2 9L22 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* OLD: ProfileManager — auto-selected self kundli */}
      {/* <ProfileManager
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        title="Select Kundli"
        startCallMode={true}
        callModeBtnTitle="Send Kundli"
        onStartCall={handleKundliSelect}
        enabledOperations={{
          list: true,
          add: true,
          edit: false,
          delete: false,
        }}
      /> */}

      {/* RESTORED: KundliSelectModal — proper list selection (matches ChatInput.jsx) */}
      <KundliSelectModal
        isOpen={kundliModalOpen}
        onClose={() => setKundliModalOpen(false)}
        onSelect={handleChatAfterKundliSelect}
      />

      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
      />

      {/* Image Preview Modal */}
      {imagePreview && createPortal(
        <div
          className={styles.imagePreviewOverlay}
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className={styles.imagePreviewClose}
            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
            aria-label="Close image preview"
          >
            <IoClose size={24} />
          </button>
          <img src={imagePreview} alt="Preview" className={styles.imagePreviewImg} onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default VideoCallChat;
