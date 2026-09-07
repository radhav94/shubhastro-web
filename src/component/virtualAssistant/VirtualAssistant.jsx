import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { FaFileAlt } from "react-icons/fa";
import { GrReactjs } from "react-icons/gr";
import styles from "./VirtualAssistant.module.scss";
import useVirtualAssistant from "./useVirtualAssistant";
import dayjs from "dayjs";
import { isShubhMallEnabled } from "../../utils/featureConfig";
import IframeModal from "../../screens/private/home/components/chats/IframeModal";
import KundliSelectModal from "../../screens/private/talkToAstrologer/kundliSelect/KundliSelectModal";
import { useFileSelector, FILE_SELECT_CANCELLED } from "../../screens/private/home/components/chats/filePicker/useFileSelector";
import { getAttachmentDisplayName } from "../../utils/helper/getAttachmentDisplayName";
import { buildKundliLink } from "../../utils/helper/kundliMessage";
import Toast from "../toast";
import PdfIcon from "../../assets/chat/PDF.svg";
import DocIcon from "../../assets/chat/DOC.svg";
import XlsIcon from "../../assets/chat/XLS.svg";

const VirtualAssistant = ({ astrologerId, astrologerName, astrologerImage, isOpen, setIsOpen, onConnect }) => {
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
  // Clarity session x27oi1 (Instagram WebView, paid session with astrologer
  // "Hari", then rage clicks + dead clicks on "message-related elements" at
  // 10:21-10:25) landed on this component's send control. Every rejected tap
  // used to end in a bare `return`, so the visitor got no on-screen answer at
  // all. Seq-keyed so repeated taps of the SAME reason still re-announce to
  // screen readers and still repaint - Clarity can see this node, it cannot
  // see a toast, and the toaster is top-right while this bar sits at the
  // bottom of a portalled chat panel.
  const [sendNotice, setSendNotice] = useState(null);
  const [retryNotice, setRetryNotice] = useState(null);
  const noticeSeqRef = useRef(0);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const chatWindowRef = useRef(null);
  const navigate = useNavigate();
  const { openFileSelector } = useFileSelector();

  const {
    messages,
    isLoading,
    sending,
    sendText,
    sendImage,
    sendFile,
    sendKundli,
    retryMessage,
    messagesEndRef,
    assistantUsage,
    awaitingReply,
    replyStalled,
    checkForReply,
  } = useVirtualAssistant({ astrologerId, isOpen });

  const isLimitReached = assistantUsage && assistantUsage.remaining <= 0;

  const showSendNotice = useCallback((message) => {
    noticeSeqRef.current += 1;
    setSendNotice({ seq: noticeSeqRef.current, message });
  }, []);

  // Answer for a Retry that could not be honoured, rendered inside the failed
  // bubble that was tapped rather than in the top-right toaster. Keyed by
  // message id so it sits next to the right bubble, and seq-keyed so tapping
  // the same dead end twice still repaints and still re-announces.
  const handleRetry = useCallback(
    (msg) => {
      const reason = retryMessage(msg);
      if (!reason) {
        setRetryNotice(null);
        return;
      }
      noticeSeqRef.current += 1;
      setRetryNotice({ seq: noticeSeqRef.current, msgId: msg._id, message: reason });
    },
    [retryMessage]
  );

  const handleSend = useCallback(() => {
    // ORDER MATTERS. The `sending` guard has to come first.
    //
    // Previously this handler ran straight into `sendText(text); setText("")`
    // while a request was still in flight. sendText() bails on its own
    // `if (!text.trim() || sending) return;` guard, but setText("") had
    // ALREADY executed - so tapping send during the in-flight window silently
    // ATE the composed message. Nothing sent, nothing shown, input emptied.
    // The assistant reply is an API round trip, so that window is seconds
    // long and trivially easy to hit: type reply 2 while reply 1 is landing.
    if (sending) {
      showSendNotice("Still delivering your last message. One moment.");
      return;
    }
    if (previewFile) {
      setSendNotice(null);
      sendImage(previewFile);
      setPreview(null);
      setPreviewFile(null);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    // An empty field used to fall out of the bottom of this function with no
    // return value and no UI change - a textbook dead click, since the button
    // was never actually disabled in this state (see the old expression:
    // `sending && !previewFile && !text.trim()` is false whenever sending is
    // false, so an idle empty composer rendered a fully enabled send button).
    if (!text.trim()) {
      showSendNotice("Type a message first, then tap send.");
      inputRef.current?.focus();
      return;
    }
    setSendNotice(null);
    sendText(text);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [text, previewFile, sendText, sendImage, sending, showSendNotice]);

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
      const { blob, name } = await openFileSelector(accept);
      if (type === "photo") {
        sendImage(blob);
      } else {
        const file = new File([blob], name || `file_${Date.now()}`, { type: blob.type });
        sendFile(file);
      }
    } catch (err) {
      // Backing out of the picker is deliberate, so it stays quiet. Anything
      // else used to be swallowed by the same bare catch, leaving the attach
      // sheet closed and nothing to show for the tap.
      if (err?.message !== FILE_SELECT_CANCELLED) {
        console.error("Assistant attachment failed:", err);
        Toast.error("Couldn't attach that file. Please try again.");
      }
    }
  };

  const handleKundliSelect = (kundli) => {
    setKundliModalOpen(false);
    if (!kundli?._id) return;
    sendKundli(kundli._id, kundli.name);
  };

  // Camera helpers
  useEffect(() => {
    // Gate on `isOpen` too: the widget hides its chat window (without unmounting
    // this component) when closed, so we must release the camera on close as well.
    if (!cameraOpen || !isOpen) return undefined;
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

  // Reset camera state when the widget is closed so it never lingers on.
  useEffect(() => {
    if (!isOpen) {
      setCameraOpen(false);
      setAttachMenuOpen(false);
    }
  }, [isOpen]);

  // Focus the text input when the chat window opens. A single setTimeout(0)
  // fired before the entrance animation / initial auto-scroll settled, so the
  // caret never landed in the box. Retry across a couple of frames + a short
  // delay so focus reliably lands once the input is painted and interactive.
  useEffect(() => {
    if (!isOpen) return;
    const focusInput = () => {
      const el = inputRef.current;
      if (el && !el.disabled) el.focus();
    };
    const raf = requestAnimationFrame(focusInput);
    const t1 = setTimeout(focusInput, 150);
    const t2 = setTimeout(focusInput, 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  // Refocus input after sending completes (input was disabled during send)
  useEffect(() => {
    if (isOpen && !sending) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [sending, isOpen]);

  // Keep the scroll inside the panel. `overscroll-behavior: contain` on the
  // message list covers "list reached its end", but a wheel over the header,
  // the input bar, or a list too short to scroll still reached the document —
  // so the page behind the assistant scrolled away under it.
  //
  // Has to be a native non-passive listener: React registers `wheel` passively,
  // so preventDefault() from an onWheel prop is ignored.
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!isOpen || !el) return undefined;

    const handleWheel = (event) => {
      // Walk up to the panel root looking for an inner scroller that can still
      // move. If there is one, let it scroll — overscroll-behavior handles the
      // edges. Otherwise nothing in here consumes the wheel, so swallow it.
      for (let node = event.target; node && node !== el; node = node.parentElement) {
        if (
          node.scrollHeight > node.clientHeight &&
          /(auto|scroll)/.test(getComputedStyle(node).overflowY)
        ) {
          return;
        }
      }
      event.preventDefault();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  // Stop the camera on browser Back/forward navigation, in case this widget
  // stays mounted across the route change.
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

  const stopStream = () => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; };
  const handleCapture = () => { const v = videoRef.current, c = canvasRef.current; if (!v || !c) return; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob((blob) => { const url = URL.createObjectURL(blob); stopStream(); setCameraOpen(false); setCameraPreview({ url, blob }); }, "image/jpeg", 0.92); };
  const handleCameraPreviewSend = async () => { if (!cameraPreview || isSending) return; setIsSending(true); try { sendImage(cameraPreview.blob); URL.revokeObjectURL(cameraPreview.url); setCameraPreview(null); } finally { setIsSending(false); } };
  const handleCameraRetake = () => { URL.revokeObjectURL(cameraPreview?.url); setCameraPreview(null); setCameraOpen(true); };

  const formatTime = (dateStr) => dayjs(dateStr).format("hh:mm A");

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow} ref={chatWindowRef}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              {astrologerImage && (
                <img
                  src={astrologerImage}
                  alt={astrologerName}
                  className={styles.headerAvatar}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
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
                        <div
                          role="button"
                          tabIndex={0}
                          className={styles.msgImageWrap}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreview(msg.message); }}
                          onKeyDown={(e) => { if (e.key === "Enter") setImagePreview(msg.message); }}
                        >
                          <img
                            src={msg.message}
                            alt="Shared"
                            className={styles.msgImage}
                            draggable={false}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      ) : msg.type === "kundli" ? (() => {
                        // Always resolve the kundli view from kundliId when
                        // available, falling back to parsing the message text
                        // (bare id or a full /kundli/<id> URL). Non-kundli text
                        // (e.g. an astrologer profile link) resolves to null.
                        const kundliLink = buildKundliLink(msg.kundliId, msg.message);
                        return (
                          // A <button>, not a div: this is an action. And when the
                          // link can't be resolved the tap used to do nothing at
                          // all — say so instead.
                          <button
                            type="button"
                            className={styles.kundliLink}
                            onClick={() => {
                              if (!kundliLink) {
                                Toast.error("This kundli is no longer available to view.");
                                return;
                              }
                              setIframeSrc(kundliLink);
                            }}
                          >
                            <GrReactjs />
                            {msg.kundliName
                              ? `${msg.kundliName}'s Kundli`
                              : "View Kundli"}
                          </button>
                        );
                      })() : msg.type === "audio" ? (
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
                      })() : msg.type === "attachment" ? (() => {
                        const displayName = getAttachmentDisplayName(msg.message);
                        let fileUrl = msg.message;
                        try {
                          const parsed = typeof msg.message === "string" ? JSON.parse(msg.message) : msg.message;
                          if (parsed?.url) fileUrl = parsed.url;
                        } catch { /* use msg.message as URL */ }

                        const ext = displayName?.split(".").pop()?.toLowerCase();
                        const getFileIcon = () => {
                          switch (ext) {
                            case "pdf": return <img src={PdfIcon} alt="PDF" style={{ width: 20, height: 20, flexShrink: 0 }} />;
                            case "doc": case "docx": return <img src={DocIcon} alt="DOC" style={{ width: 20, height: 20, flexShrink: 0 }} />;
                            case "xls": case "xlsx": case "csv": return <img src={XlsIcon} alt="XLS" style={{ width: 20, height: 20, flexShrink: 0 }} />;
                            default: return <FaFileAlt style={{ fontSize: 16, flexShrink: 0, color: "#757575" }} />;
                          }
                        };

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
                            className={styles.attachmentLink}
                            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", padding: 0, color: "inherit" }}
                          >
                            {getFileIcon()}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{displayName}</span>
                          </button>
                        );
                      })() : (() => {
                        // Detect image URLs that weren't typed as "image"
                        const isImageUrl = typeof msg.message === "string" && /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(msg.message);
                        if (isImageUrl) {
                          return (
                            <div
                              role="button"
                              tabIndex={0}
                              className={styles.msgImageWrap}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagePreview(msg.message); }}
                              onKeyDown={(e) => { if (e.key === "Enter") setImagePreview(msg.message); }}
                            >
                              <img
                                src={msg.message}
                                alt="Shared"
                                className={styles.msgImage}
                                draggable={false}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                              />
                            </div>
                          );
                        }
                        return <p className={styles.msgText}>{msg.message}</p>;
                      })()}
                      <div className={styles.msgMeta}>
                        <span className={styles.msgTime}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isUser && !msg._failed && (
                          <IoCheckmarkDone className={styles.checkmark} />
                        )}
                      </div>
                      {msg._failed && (
                        <>
                          <button
                            type="button"
                            className={styles.retryBtn}
                            onClick={() => handleRetry(msg)}
                          >
                            <IoRefresh size={14} /> Retry
                          </button>
                          {retryNotice?.msgId === msg._id && (
                            <div
                              key={retryNotice.seq}
                              className={styles.retryNotice}
                              role="status"
                              aria-live="polite"
                            >
                              {retryNotice.message}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* The message list used to end at the visitor's own bubble with
                nothing to indicate an answer was pending, so a slow (or
                never-arriving) reply left a screen full of inert text to tap.
                This row is the pending state, and when the watch gives up it
                becomes a real control instead of a dead end. */}
            {!isLoading && !isLimitReached && (awaitingReply || replyStalled) && (
              <div className={`${styles.msgRow} ${styles.assistantRow}`}>
                <div className={styles.replyWait} role="status" aria-live="polite">
                  {awaitingReply ? (
                    <>
                      <span className={styles.replyWaitDots} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>Waiting for a reply</span>
                    </>
                  ) : (
                    <>
                      <span>No reply yet.</span>
                      <button
                        type="button"
                        className={styles.replyWaitAction}
                        onClick={checkForReply}
                      >
                        Check again
                      </button>
                    </>
                  )}
                </div>
              </div>
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

          {/* Assistant Usage Info */}
          {assistantUsage && (
            <div className={styles.usageInfo}>
              <span>{assistantUsage.remaining} out of {assistantUsage.total} messages remaining</span>
            </div>
          )}

          {/* Input or Connect Button */}
          {isLimitReached ? (
            <div className={styles.connectBar}>
              <button className={styles.connectBtn} onClick={() => { setIsOpen(false); onConnect(); }}>
                Connect Now
              </button>
            </div>
          ) : (
          <>
          {sendNotice && (
            <div
              key={sendNotice.seq}
              className={styles.sendNotice}
              role="status"
              aria-live="polite"
            >
              {sendNotice.message}
            </div>
          )}
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
              ref={inputRef}
              autoFocus
              className={styles.textInput}
              value={text}
              onChange={(e) => { setText(e.target.value); if (sendNotice) setSendNotice(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              /* No native `disabled` here on purpose. It used to be
                 `disabled={sending}`, which cost us three separate things on
                 mobile: (1) a disabled input dispatches no events, so taps on
                 it register as dead clicks; (2) disabling the FOCUSED field
                 tears down the on-screen keyboard, and this input carries
                 autoFocus, so every send collapsed the keyboard and the
                 visitor had to tap back into it; (3) anything typed during the
                 in-flight window was dropped. Composing while the previous
                 message is still landing is now allowed - the send button
                 holds the queue instead, and it explains itself. */
              aria-busy={sending || undefined}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              /* aria-disabled, never native `disabled`: a natively disabled
                 button fires no click event, which Clarity reports as a dead
                 click and which leaves the visitor with no explanation. This
                 stays clickable so handleSend() can answer with .sendNotice.
                 The old expression was also inverted - `sending && !previewFile
                 && !text.trim()` is only true when sending with nothing to
                 send, i.e. it disabled the button in the one state that never
                 occurs and left it enabled in both states that dead-click. */
              aria-disabled={sending || (!previewFile && !text.trim())}
              aria-busy={sending || undefined}
              aria-label="Send message"
            >
              <IoSend size={18} />
            </button>
          </div>
          </>
          )}

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
              <button className={styles.cameraCloseBtn} onClick={() => { stopStream(); setCameraOpen(false); }}>&times;</button>
              <video ref={videoRef} className={styles.cameraVideo} autoPlay playsInline muted />
              <div className={styles.cameraActions}>
                <button onClick={handleCapture} className={styles.shutterBtn}><span /></button>
                <button className={styles.cameraFlipBtn} onClick={() => setFacingMode((p) => p === "environment" ? "user" : "environment")}>Flip</button>
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
      {imagePreview && createPortal(
        <div
          className={styles.imageModal}
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className={styles.imageModalClose}
            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
            aria-label="Close image preview"
          >
            <IoClose size={24} />
          </button>
          <img src={imagePreview} alt="Preview" className={styles.modalImage} onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
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
