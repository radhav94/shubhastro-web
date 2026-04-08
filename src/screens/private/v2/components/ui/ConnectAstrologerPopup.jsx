import { MessageSquare, Phone, Video, X } from "lucide-react";
import styles from "./ConnectAstrologerPopup.module.css";

const ConnectAstrologerPopup = ({
  isOpen,
  onClose,
  astrologer,
  onChatStart,
  onCallStart,
  isEmergency = false,
}) => {

  if (!isOpen) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use emergency pricing if in emergency mode
  const pricing = isEmergency ? astrologer?.emergencyPrice : astrologer?.price;

  // Check if service is available
  const isChatAvailable = pricing ? pricing.chatRate?.amount > 0 : true;
  const isCallAvailable = pricing ? pricing.audioRate?.amount > 0 : true;
  const isVideoAvailable = pricing ? pricing.videoCallRate?.amount > 0 : true;

  const handleConnect = async (type) => {
    if (!astrologer) return;

    if (type === "chat" && !isChatAvailable) return;
    if (type === "call" && !isCallAvailable) return;
    if (type === "video" && !isVideoAvailable) return;

    let success = false;

    if (type === "chat") {
      success = await onChatStart(astrologer, true, isEmergency);
    } else if (type === "call") {
      success = await onCallStart(astrologer, "audio", isEmergency);
    } else if (type === "video") {
      success = await onCallStart(astrologer, "video", isEmergency);
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
