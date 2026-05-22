import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoClose,
  IoSend,
  IoAttach,
  IoRefresh,
  IoChatbubbleEllipses,
  IoCheckmarkDone,
  IoDownload,
} from "react-icons/io5";
import { GrReactjs } from "react-icons/gr";
import styles from "./VirtualAssistant.module.scss";
import useVirtualAssistant from "./useVirtualAssistant";
import dayjs from "dayjs";
import { isShubhMallEnabled } from "../../utils/featureConfig";
import IframeModal from "../../screens/private/home/components/chats/IframeModal";
import KundliSelectModal from "../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";
import { useFileSelector } from "../../screens/private/home/components/chats/filePicker/useFileSelector";

const VirtualAssistant = ({ astrologerId, astrologerName, isOpen, setIsOpen }) => {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [iframeSrc, setIframeSrc] = useState(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [kundliModalOpen, setKundliModalOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { openFileSelector } = useFileSelector();

  const {
    messages,
    isLoading,
    sending,
    sendText,
    sendImage,
    sendKundli,
    retryMessage,
    messagesEndRef,
  } = useVirtualAssistant({ astrologerId, isOpen });

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

  const handleAttachOption = async (type) => {
    setAttachMenuOpen(false);
    if (type === "kundali") { setKundliModalOpen(true); return; }
    if (type === "camera") { setCameraOpen(true); return; }
    try {
      const accept = type === "photo" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx";
      const { blob } = await openFileSelector(accept);
      sendImage(blob);
    } catch { /* cancelled */ }
  };

  const handleKundliSelect = (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return;
    sendKundli(kundli._id, kundli.name);
  };

  // Camera helpers
  useEffect(() => {
    if (!cameraOpen) return;
    let active = true;
    const startStream = async () => {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      } catch { if (active) setCameraOpen(false); }
    };
    startStream();
    return () => { active = false; };
  }, [cameraOpen, facingMode]);

  const stopStream = () => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; };
  const handleCapture = () => { const v = videoRef.current, c = canvasRef.current; if (!v || !c) return; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob((blob) => { const url = URL.createObjectURL(blob); stopStream(); setCameraOpen(false); setCameraPreview({ url, blob }); }, "image/jpeg", 0.92); };
  const handleCameraPreviewSend = async () => { if (!cameraPreview || isSending) return; setIsSending(true); try { sendImage(cameraPreview.blob); URL.revokeObjectURL(cameraPreview.url); setCameraPreview(null); } finally { setIsSending(false); } };
  const handleCameraRetake = () => { URL.revokeObjectURL(cameraPreview?.url); setCameraPreview(null); setCameraOpen(true); };

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
                      ) : msg.type === "kundli" ? (
                        <div
                          className={styles.kundliLink}
                          onClick={() => setIframeSrc(msg.message)}
                        >
                          <GrReactjs />
                          {msg.kundliName
                            ? `${msg.kundliName}'s Kundli`
                            : "View Kundli"}
                        </div>
                      ) : msg.type === "audio" ? (
                        <div className={styles.audioMessage}>
                          <audio controls src={msg.message} preload="metadata" />
                        </div>
                      ) : msg.type === "video" ? (
                        <div className={styles.videoMessage}>
                          <video
                            controls
                            src={msg.message}
                            preload="metadata"
                            className={styles.msgVideo}
                          />
                        </div>
                      ) : msg.type === "products" && isShubhMallEnabled() ? (
                        <div className={styles.productsMessage}>
                          {msg.message && (
                            <p className={styles.productsNote}>{msg.message}</p>
                          )}
                          {(msg.suggestedProducts || []).map((p, idx) => (
                            <div
                              key={p.productId || idx}
                              className={styles.productItem}
                              onClick={() =>
                                p.slug &&
                                isShubhMallEnabled() &&
                                navigate(`/product-details/${p.slug}`, {
                                  state: {
                                    _selectedVariant: p.variantId ? {
                                      _id: p.variantId,
                                      skuCode: p.variantSkuCode,
                                      sku: p.variantSkuCode,
                                    } : undefined,
                                  },
                                })
                              }
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
                            </div>
                          ))}
                        </div>
                      ) : msg.type === "gift" ? (() => {
                        let giftInfo = null;
                        let giftText = msg.message;
                        try {
                          const parsed = JSON.parse(msg.message);
                          giftText = parsed.text;
                          giftInfo = parsed.giftData;
                        } catch {}
                        return (
                          <div style={{ textAlign: "center" }}>
                            <p className={styles.msgText} style={{ marginBottom: 8 }}>{giftText}</p>
                            {giftInfo && (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "#fff5ec", borderRadius: 12, padding: "10px 16px", gap: 4 }}>
                                {giftInfo.giftImg && <img src={giftInfo.giftImg} alt={giftInfo.giftName} style={{ width: 48, height: 48, objectFit: "contain" }} />}
                                {giftInfo.giftName && <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{giftInfo.giftName}</span>}
                                {giftInfo.price && <span style={{ fontSize: 12, color: "#f75801", fontWeight: 500 }}>₹{giftInfo.price}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })() : msg.type === "attachment" ? (
                        <a
                          href={msg.message}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.attachmentLink}
                          download
                        >
                          <IoDownload size={16} />
                          {msg.message?.split("/").pop() || "Download File"}
                        </a>
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
              onClick={() => setAttachMenuOpen(true)}
              aria-label="Attach file"
            >
              <IoAttach size={22} />
            </button>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <input
              autoFocus
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

          {/* Attach File Modal */}
          {attachMenuOpen && (
            <div className={styles.attachOverlay} onClick={() => setAttachMenuOpen(false)}>
              <div className={styles.attachSheet} onClick={(e) => e.stopPropagation()}>
                <div className={styles.attachHeader}>
                  <div>
                    <h3 className={styles.attachTitle}>Attach File</h3>
                    <p className={styles.attachSubtitle}>Please attach the file you would like to include.</p>
                  </div>
                  <button className={styles.attachClose} onClick={() => setAttachMenuOpen(false)}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10" stroke="#F75801" strokeWidth="1.5"/>
                      <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="#F75801" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.attachOptions}>
                  {[
                    { key: "camera", label: "Camera", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/></svg> },
                    { key: "photo", label: "Photo", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><path d="M21 15L16 10L5 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                    { key: "document", label: "Document", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="17" x2="16" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg> },
                    { key: "kundali", label: "Kundali", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><text x="3" y="19" fontSize="18" fill="white" fontFamily="serif">卐</text></svg> },
                  ].map(({ key, label, icon }) => (
                    <button key={key} className={styles.attachOption} onClick={() => handleAttachOption(key)}>
                      <div className={styles.attachIconCircle}>{icon}</div>
                      <span className={styles.attachOptionLabel}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Camera View */}
          {cameraOpen && (
            <div className={styles.cameraOverlay}>
              <video ref={videoRef} className={styles.cameraVideo} autoPlay playsInline muted />
              <div className={styles.cameraActions}>
                <button onClick={() => { stopStream(); setCameraOpen(false); }}>Cancel</button>
                <button onClick={handleCapture} className={styles.shutterBtn}><span /></button>
                <button onClick={() => setFacingMode((p) => p === "environment" ? "user" : "environment")}>Flip</button>
              </div>
            </div>
          )}

          {/* Camera Preview */}
          {cameraPreview && (
            <div className={styles.cameraOverlay}>
              <img src={cameraPreview.url} alt="Preview" className={styles.cameraVideo} />
              <div className={styles.cameraActions}>
                <button onClick={handleCameraRetake}>Retake</button>
                <button onClick={handleCameraPreviewSend} disabled={isSending}>{isSending ? "Sending..." : "Send"}</button>
              </div>
            </div>
          )}

          {/* Kundli Select Modal */}
          <KundliSelectModal isOpen={kundliModalOpen} onClose={() => setKundliModalOpen(false)} onSelect={handleKundliSelect} />
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

      {/* Kundli Iframe Modal */}
      <IframeModal
        open={!!iframeSrc}
        src={iframeSrc}
        onClose={() => setIframeSrc(null)}
      />
    </>
  );
};

export default VirtualAssistant;
