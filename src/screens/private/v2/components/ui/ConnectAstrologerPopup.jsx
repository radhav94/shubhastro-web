import { MessageSquare, Phone, Video, X } from "lucide-react";
import styles from "./ConnectAstrologerPopup.module.css";

const ConnectAstrologerPopup = ({
  isOpen,
  onClose,
  astrologer,
  onChatStart,
  onCallStart,
}) => {

  if (!isOpen) return null;
console.log(astrologer,"ertytrertyu")
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if service is available
  const isChatAvailable = astrologer?.price?.chatRate?.amount > 0;
  const isCallAvailable = astrologer?.price?.audioRate?.amount > 0;
  const isVideoAvailable = astrologer?.price?.videoCallRate?.amount > 0;

  const handleConnect = async (type) => {
    if (!astrologer) return;

    // Prevent action if service is not available
    if (type === "chat" && !isChatAvailable) return;
    if (type === "call" && !isCallAvailable) return;
    if (type === "video" && !isVideoAvailable) return;

    let success = false;

    if (type === "chat") {
      success = await onChatStart(astrologer);
    } else if (type === "call") {
      success = await onCallStart(astrologer, "audio");
    } else if (type === "video") {
      success = await onCallStart(astrologer, "video");
    }

    if (success) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <div className={styles.dragHandle}></div>

        <div className={styles.header}>
          <h2 className={styles.title}>
            Connect with {astrologer?.firstName || "Astrologer"}
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
            <p className={styles.optionPrice}>₹{astrologer?.price?.chatRate?.amount || 0}/{astrologer?.price?.chatRate?.unit || 'minute'}</p>
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
            <p className={styles.optionPrice}>₹{astrologer?.price?.audioRate?.amount || 0}/{astrologer?.price?.audioRate?.unit || 'minute'}</p>
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
            <p className={styles.optionPrice}>₹{astrologer?.price?.videoCallRate?.amount || 0}/{astrologer?.price?.videoCallRate?.unit || 'minute'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAstrologerPopup;
