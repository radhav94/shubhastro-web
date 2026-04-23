import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoClose,
  IoSend,
  IoImageOutline,
  IoRefresh,
  IoChatbubbleEllipses,
  IoCheckmarkDone,
  IoDownload,
} from "react-icons/io5";
import { GrReactjs } from "react-icons/gr";
import styles from "./VirtualAssistant.module.scss";
import useVirtualAssistant from "./useVirtualAssistant";
import dayjs from "dayjs";
import IframeModal from "../../screens/private/home/components/chats/IframeModal";

const VirtualAssistant = ({ astrologerId, astrologerName, isOpen, setIsOpen }) => {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [iframeSrc, setIframeSrc] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const {
    messages,
    isLoading,
    sending,
    sendText,
    sendImage,
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
                      ) : msg.type === "products" ? (
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
