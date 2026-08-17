import { X, MessageSquare, Phone, Video } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./EmergencySessionModal.module.scss";
import { getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const EmergencySessionModal = ({
  isOpen,
  onClose,
  astrologer,
  onChatNow,
  onCallNow,
  onVideoNow,
}) => {
  if (!isOpen || !astrologer) return null;

  const name = getAstrologerDisplayName(astrologer) || "Astrologer";
  // .avatarWrap is 90x90, so "small" (100x125) is the right derivative rather
  // than the helper's default "medium" (250x312). This modal opens from the
  // homepage emergency-astrologers grid, whose records now carry profileImages.
  const imageUrl = getAstrologerImageUrl(astrologer, "small");
  const emergencyPrice = astrologer.emergencyPrice || {};
  const chatRate = emergencyPrice.chatRate?.amount || 0;
  const audioRate = emergencyPrice.audioRate?.amount || 0;
  const videoRate = emergencyPrice.videoCallRate?.amount || 0;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className={styles.profileSection}>
          <div className={styles.avatarWrap}>
            <img
              src={imageUrl}
              alt={name}
              className={styles.avatar}
              onError={(e) => { e.target.src = getAstrologerDefaultImage(astrologer.gender); }}
            />
            <span className={styles.emergencyBadge}>🔔</span>
          </div>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.rateText}>Try Emergency Session</p>
        </div>

        <p className={styles.description}>
          ShubhAstro will try calling {name}, if there is anything urgent. We can&apos;t promise if they would be able to take the call.
        </p>

        <div className={styles.actions}>
          {chatRate > 0 && (
            <div className={styles.actionWrapper}>
              <button className={styles.actionBtn} onClick={() => { onChatNow(astrologer); onClose(); }}>
                <MessageSquare size={16} /> Chat
              </button>
              <span className={styles.actionPrice}>₹{chatRate}/min</span>
            </div>
          )}
          {audioRate > 0 && (
            <div className={styles.actionWrapper}>
              <button className={styles.actionBtn} onClick={() => { onCallNow(astrologer); onClose(); }}>
                <Phone size={16} /> Call
              </button>
              <span className={styles.actionPrice}>₹{audioRate}/min</span>
            </div>
          )}
          {videoRate > 0 && (
            <div className={styles.actionWrapper}>
              <button className={styles.actionBtn} onClick={() => { onVideoNow?.(astrologer); onClose(); }}>
                <Video size={16} /> Video
              </button>
              <span className={styles.actionPrice}>₹{videoRate}/min</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmergencySessionModal;
