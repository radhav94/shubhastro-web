import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import AudioMessageWrapper from "./AudioMessageWrapper";
import { GrReactjs } from "react-icons/gr";
import { IoCheckmarkDone, IoDocument, IoDownload } from "react-icons/io5";
import { FiFile } from "react-icons/fi";
import IframeModal from "./IframeModal";
import dayjs from "dayjs";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";
import LinkPreview from "./LinkPreview";
import { detectURL } from "../../../../../utils/helper/linkPreview";

const ChatMessages = ({ messages, isTyping, messagesRef }) => {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

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

  // Memoize message groups for performance
  const messageGroups = useMemo(() => {
    const groups = {};
    messages.forEach((msg) => {
      const date = msg.date || dayjs(msg.dateTime).format("MMM DD, YYYY");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  }, [messages]);

  // Memoize message content renderer
  const renderMessageContent = useMemo(() => (msg) => {
    // Voice/Audio messages
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
      return (
        <a
          href={msg.text}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm underline font-semibold"
        >
          <span className="text-lg">📎</span>
          <span className="truncate max-w-[180px]">Download Attachment</span>
        </a>
      );
    }

    // Gift messages
    if (msg?.giftData) {
      const giftText = msg?.text || "";
      // Extract the recipient name from "X has sent a gift to Y"
      const toMatch = giftText.match(/to\s+(.+)$/);
      const recipientName = toMatch ? toMatch[1] : "Astrologer";
      
      return (
        <div className={styles.giftMessageCard}>
          <div className={styles.giftHeader}>
            <span className={styles.giftIcon}>🎁</span>
            <span className={styles.giftHeaderText}>GIFT SENT</span>
          </div>
          <div className={styles.giftDivider}></div>
          <div className={styles.giftQuote}>
            <div className={styles.giftQuoteBorder}></div>
            <p className={styles.giftQuoteText}>
              "You have sent a gift to {recipientName}"
            </p>
          </div>
          <div className={styles.giftPreviewCard}>
            {msg.giftData?.giftImg && (
              <img 
                src={msg.giftData.giftImg} 
                alt={msg.giftData?.giftName || "Gift"}
                className={styles.giftPreviewImg}
              />
            )}
            <div className={styles.giftPreviewInfo}>
              {msg.giftData?.giftName && (
                <div className={styles.giftPreviewName}>
                  {msg.giftData.giftName}
                </div>
              )}
              {msg.giftData?.price && (
                <div className={styles.giftPreviewPrice}>
                  ₹{msg.giftData.price}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Kundli messages
    if (msg?.type === "kundli") {
      const kundliLink = msg.kundliId
        ? `${window.location.origin}/kundli/${msg.kundliId}`
        : null;
        // console.log(kundliLink,"78909876789")
      return (
        <div
          onClick={() => kundliLink && setIframeSrc(kundliLink)}
          className={styles.kundliLink}
        >
          <GrReactjs />
          {msg.kundliName ? `${msg.kundliName}'s Kundli` : "View Kundli"}
        </div>
      );
    }

    // Product/Remedy suggestion messages
    if (msg?.type === "products") {
      if (!isShubhMallEnabled()) return null;
      const products = msg.suggestedProducts || [];
      return (
        <div className={styles.productsMessage}>
          {msg.text && <p className={styles.productsNote}>{msg.text}</p>}
          {products.map((p, idx) => (
            <div key={p.variantId || p.productId || idx} className={styles.productItem} onClick={() => {
              if (!p?.slug || !isShubhMallEnabled()) return;
              navigate(`/product-details/${p.slug}`, {
                state: {
                  _selectedVariant: p.variantId ? {
                    _id: p.variantId,
                    skuCode: p.variantSkuCode,
                    sku: p.variantSkuCode,
                  } : undefined,
                },
              });
            }}>
              {(p.variantImage || p.image || p.images?.[0]) && (
                <img src={p.variantImage || p.image || p.images?.[0]} alt={p.title || "Product"} className={styles.productThumb} onError={(e) => { e.target.style.display = "none"; }} />
              )}
              <div className={styles.productMeta}>
                <span className={styles.productName}>{p.title || "Suggested Product"}</span>
                {p.variantTitle && (
                  <span className={styles.productVariant}>{p.variantTitle}</span>
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
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Check for external URLs in text messages
    const detectedURL = detectURL(msg.text);
    if (detectedURL && msg.type !== "kundli") {
      return (
        <>
          {msg.text !== detectedURL && (
            <div style={{ marginBottom: 8 }}>
              <PrimaryText size={14} color={"#4a4a4a"}>
                {msg.text}
              </PrimaryText>
            </div>
          )}
          <LinkPreview 
            url={detectedURL} 
            isSender={msg.isSender}
          />
        </>
      );
    }

    // Regular text messages
    return (
      <PrimaryText size={14} color={"#4a4a4a"}>
        {msg?.text}
      </PrimaryText>
    );
  }, [navigate]);

  return (
    <>
      <div className={styles.messages} ref={messagesRef}>
        {Object.entries(messageGroups).map(([date, msgs], groupIndex) => (
          <div key={`${date}-${groupIndex}`} className={styles.messageGroup}>
            <div className={styles.dateHeader}>
              <span className={styles.dateText}>
                {date} • {msgs[0]?.time || ''}
              </span>
            </div>
            {msgs.map((msg, i) => (
              <div
                key={`${date}-${i}-${msg.time}`}
                className={styles.messageWrapper}
              >
                <div
                  className={`${styles.msgBubble} ${
                    msg.isSender ? styles.senderBubble : styles.receiverBubble
                  }`}
                >
                  <div className={styles.bubbleContent}>
                    {renderMessageContent(msg)}
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
