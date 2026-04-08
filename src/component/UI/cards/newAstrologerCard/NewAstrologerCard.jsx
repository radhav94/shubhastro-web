import { useState } from "react";
import { BookOpen } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link } from "react-router-dom";
import { AppIcons, getAstrologerDefaultImage } from "../../../../utils/appImages";
import EmergencySessionModal from "../../modal/EmergencySessionModal/EmergencySessionModal";

const NewAstrologerCard = ({ 
  astrologer, 
  onConnect, 
  className = "", 
  style = {} 
}) => {
  const isOnline = astrologer?.isActive === true;
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 || 
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );
  
  return (
    <div 
      className={`${styles.astrologerCard} ${!isOnline ? styles.offlineCard : ''} ${className}`.trim()} 
      style={style}
    >
      {/* Online/Offline badge */}
      <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
        <span className={styles.statusDot} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <Link to={`/astrologer/${astrologer?._id}`} className={styles.cardLink}>
        <div className={styles.astrologerImageWrapper}>
          <img
            src={astrologer.profileImgUrl || getAstrologerDefaultImage(astrologer.gender)}
            alt={astrologer.firstName}
            className={styles.astrologerImg}
            onError={(e) => {
              e.target.src = getAstrologerDefaultImage(astrologer.gender);
            }}
          />
          <div className={styles.ratingBadge}>
            <span className={styles.star}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="21"
                viewBox="0 0 12 13"
                fill="none"
              >
                <g clipPath="url(#clip0_4961_937)">
                  <path
                    d="M5.94187 1.3447C6.09954 0.919606 6.69621 0.919606 6.85438 1.3447L7.87429 4.2327C7.90988 4.32678 7.97253 4.40762 8.05399 4.46454C8.13545 4.52146 8.23188 4.55179 8.33055 4.55152H10.837C11.3001 4.55152 11.5021 5.14081 11.138 5.42941L9.35441 7.06984C9.27451 7.13262 9.21612 7.21967 9.18762 7.31848C9.15912 7.41729 9.16196 7.52279 9.19575 7.61984L9.84712 10.4419C10.0058 10.8952 9.49237 11.2845 9.10411 11.0055L6.68143 9.43404C6.59847 9.37443 6.49953 9.34245 6.39812 9.34245C6.29672 9.34245 6.19778 9.37443 6.11481 9.43404L3.69214 11.0055C3.30437 11.2845 2.79047 10.8947 2.94912 10.4419L3.60049 7.61984C3.63428 7.52279 3.63713 7.41729 3.60863 7.31848C3.58012 7.21967 3.52173 7.13262 3.44184 7.06984L1.65821 5.42941C1.2936 5.14081 1.4966 4.55152 1.95877 4.55152H4.46521C4.56389 4.55186 4.66035 4.52156 4.74182 4.46463C4.82329 4.4077 4.88594 4.32682 4.92146 4.2327L5.94138 1.3447H5.94187Z"
                    fill="#FFB246"
                    stroke="#FFB246"
                    strokeWidth="0.985428"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_4961_937">
                    <rect width="11.8251" height="12.0879" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            <span className={styles.ratingText}>{astrologer.rating ? Number(astrologer.rating).toFixed(1) : '0.0'}</span>
          </div>
        </div>
        <h3 className={styles.astrologerName}>
          {astrologer.firstName} {astrologer.lastName}
        </h3>
        {astrologer.experience && (
          <div className={styles.experienceRow}>
            <BookOpen size={18} className={styles.bookIcon} />
            <span className={styles.experienceText}>
              {astrologer.experience} years exp.
            </span>
          </div>
        )}
      </Link>
      <div className={styles.actionButtons}>
        <div className={styles.buttonWrapper}>
          <button
            className={styles.chatBtn}
            onClick={() => isOnline && onConnect(astrologer, "chat")}
            disabled={!isOnline}
          >
            <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
          </button>
          <p className={styles.priceText}>
            <span className={styles.priceAmount}>₹{astrologer?.price?.chatRate?.amount || 0}</span>/min
          </p>
        </div>
        <div className={styles.buttonWrapper}>
          <button
            className={styles.callBtn}
            onClick={() => isOnline && onConnect(astrologer, "audio")}
            disabled={!isOnline}
          >
            <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
          </button>
          <p className={styles.priceText}>
            <span className={styles.priceAmount}>₹{astrologer?.price?.audioRate?.amount || 0}</span>/min
          </p>
        </div>
      </div>

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={astrologer}
        onChatNow={(astro) => onConnect(astro, "chat", true)}
        onCallNow={(astro) => onConnect(astro, "audio", true)}
      />
    </div>
  );
};

export default NewAstrologerCard;
