import { useEffect } from "react";
import { MessageSquare, Phone, Video, X } from "lucide-react";
import styles from "./ConnectAstrologerPopup.module.css";

const ConnectAstrologerPopup = ({
  isOpen,
  onClose,
  astrologer,
  onChatStart,
  onCallStart,
  isEmergency = false,
  onEmergencyAvailable,
  isLoadingAstrologer = false,
}) => {

  // Determine synchronously whether we should bypass this popup and go
  // straight to the emergency modal — avoids a flash of the call modal.
  // Trigger when emergency is available AND the astrologer is offline OR has
  // disabled all normal options (chat/call/video).
  //
  // IMPORTANT: only treat options as "disabled" when price data is actually
  // present. While the full astrologer is still loading (some screens open the
  // popup with a minimal object that has no `price`), we must NOT assume the
  // astrologer is disabled — otherwise every astrologer would redirect.
  const p = astrologer?.price;
  const hasPriceData = !!p;
  const allNormalDisabled =
    hasPriceData &&
    !(p?.chatRate?.amount > 0) &&
    !(p?.audioRate?.amount > 0) &&
    !(p?.videoCallRate?.amount > 0);
  const shouldRedirectToEmergency =
    !isEmergency &&
    !isLoadingAstrologer &&
    !!astrologer &&
    !!astrologer.isEmergencyAvailable &&
    !!onEmergencyAvailable &&
    (astrologer.isActive === false || allNormalDisabled);

  useEffect(() => {
    if (!isOpen) return;
    if (shouldRedirectToEmergency) {
      onClose();
      onEmergencyAvailable(astrologer);
    }
  }, [isOpen, shouldRedirectToEmergency]);

  // Don't render the call modal at all when redirecting to emergency.
  if (!isOpen || shouldRedirectToEmergency) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use emergency pricing if in emergency mode
  const pricing = isEmergency ? astrologer?.emergencyPrice : astrologer?.price;

  // Check if service is available (price > 0 AND activeType includes it)
  const activeTypes = astrologer?.isActiveType || [];
  const isTypeActive = (type) => activeTypes.includes("all") || activeTypes.includes(type);

  const isChatAvailable = pricing ? (pricing.chatRate?.amount > 0 && isTypeActive("chat")) : true;
  const isCallAvailable = pricing ? (pricing.audioRate?.amount > 0 && isTypeActive("audio")) : true;
  const isVideoAvailable = pricing ? (pricing.videoCallRate?.amount > 0 && isTypeActive("video")) : true;

  const handleConnect = async (type) => {
    if (!astrologer) return;

    if (type === "chat" && !isChatAvailable) return;
    if (type === "call" && !isCallAvailable) return;
    if (type === "video" && !isVideoAvailable) return;

    let result = false;

    if (type === "chat") {
      result = await onChatStart(astrologer, true, isEmergency);
    } else if (type === "call") {
      result = await onCallStart(astrologer, "audio", isEmergency);
    } else if (type === "video") {
      result = await onCallStart(astrologer, "video", isEmergency);
    }

    // If astrologer is offline but emergency is available, notify parent
    if (result?.emergencyAvailable) {
      onClose();
      onEmergencyAvailable?.(astrologer);
      return;
    }

    if (result) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <div className={styles.dragHandle}></div>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEmergency ? "Emergency Connect" : "Connect with"} {astrologer?.firstName || "Astrologer"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.optionsGrid}>
          {/* Chat Option */}
          <div
            className={`${styles.optionCard} ${!isChatAvailable ? styles.disabled : ''}`}
            onClick={() => handleConnect("chat")}
          >
            <div className={styles.iconCircle}>
              <MessageSquare size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Chat</h3>
            <p className={styles.optionPrice}>₹{pricing?.chatRate?.amount || 0}/{pricing?.chatRate?.unit || 'minute'}</p>
          </div>

          {/* Call Option */}
          <div
            className={`${styles.optionCard} ${!isCallAvailable ? styles.disabled : ''}`}
            onClick={() => handleConnect("call")}
          >
            <div className={styles.iconCircle}>
              <Phone size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Call</h3>
            <p className={styles.optionPrice}>₹{pricing?.audioRate?.amount || 0}/{pricing?.audioRate?.unit || 'minute'}</p>
          </div>

          {/* Video Call Option */}
          <div
            className={`${styles.optionCard} ${!isVideoAvailable ? styles.disabled : ''}`}
            onClick={() => handleConnect("video")}
          >
            <div className={styles.iconCircle}>
              <Video size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Video call</h3>
            <p className={styles.optionPrice}>₹{pricing?.videoCallRate?.amount || 0}/{pricing?.videoCallRate?.unit || 'minute'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAstrologerPopup;
