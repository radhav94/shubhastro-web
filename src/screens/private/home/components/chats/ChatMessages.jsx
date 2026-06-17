import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatWindow.module.scss";
import { PrimaryText } from "../../../../../component";
import AudioMessageWrapper from "./AudioMessageWrapper";
import { GrReactjs } from "react-icons/gr";
import { IoCheckmarkDone } from "react-icons/io5";
import { FaFileAlt } from "react-icons/fa";
import PdfIcon from "../../../../../assets/chat/PDF.svg";
import DocIcon from "../../../../../assets/chat/DOC.svg";
import XlsIcon from "../../../../../assets/chat/XLS.svg";
import IframeModal from "./IframeModal";
import dayjs from "dayjs";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";
import LinkPreview from "./LinkPreview";
import { detectURL } from "../../../../../utils/helper/linkPreview";
import { getAttachmentDisplayName } from "../../../../../utils/helper/getAttachmentDisplayName";

const ChatMessages = ({ messages, isTyping, messagesRef, astrologerName, customerName, onScroll, isLoadingMore }) => {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

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
              src={`${msg.text}#t=0.001`}
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

      return (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 text-sm font-semibold text-inherit cursor-pointer bg-transparent border-none p-0"
        >
          {getFileIcon(displayName)}
          <span className="truncate max-w-[180px]">{displayName}</span>
        </button>
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
      <div className={styles.messages} ref={messagesRef} onScroll={onScroll}>
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingText}>Loading older messages...</span>
          </div>
        )}
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
                {!msg.isSender && (
                  <div className={styles.msgAvatar}>
                    {astrologerName ? astrologerName.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
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
                {msg.isSender && (
                  <div className={styles.msgAvatarSender}>
                    {customerName ? customerName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
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
          <button
            className={styles.imagePreviewClose}
            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
            aria-label="Close image preview"
          >
            ✕
          </button>
          <div className={styles.imagePreviewContent} onClick={(e) => e.stopPropagation()}>
            <img src={imagePreview} alt="Preview" className={styles.previewImage} />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessages;
