import { memo, useId } from "react";
import { BookOpen } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { AppIcons, getAstrologerDefaultImage } from "../../../../utils/appImages";
import useAstrologerLiveStatus from "../../../../hooks/useAstrologerLiveStatus";
import toast from "../../../toast";
import { unavailableReason } from "../../../../utils/helper/astrologerAvailability";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const NewAstrologerCard = memo(({ 
  astrologer, 
  onConnect, 
  onEmergencyClick,
  className = "", 
  style = {} 
}) => {
  const navigate = useNavigate();
  // The rating star SVG was exported from Figma with a hardcoded
  // `id="clip0_4961_937"`. This card is rendered in lists, so a listing page
  // emitted that same id once per card — duplicate element ids are invalid HTML,
  // and `url(#id)` resolves to the first match in document order, so every
  // card's clip pointed at the first card's clipPath. It only looked right
  // because the clipPaths happen to be identical.
  const starClipId = `astroCardStarClip-${useId()}`;
  const isOnline = astrologer?.isActive === true;
  const { isLive, roomId: liveRoomId } = useAstrologerLiveStatus(astrologer?._id, astrologer?.astrologerLiveStatus);
  const activeTypes = astrologer?.isActiveType || [];
  const chatPrice = Number(astrologer?.price?.chatRate?.amount) || 0;
  const callPrice = Number(astrologer?.price?.audioRate?.amount) || 0;
  // When the astrologer is live streaming, chat and call are not available.
  const chatTypeActive = activeTypes.includes("all") || activeTypes.includes("chat");
  const callTypeActive = activeTypes.includes("all") || activeTypes.includes("audio");
  const chatEnabled = isOnline && !isLive && chatTypeActive && chatPrice > 0;
  const callEnabled = isOnline && !isLive && callTypeActive && callPrice > 0;

  const chatReason = unavailableReason({
    label: "Chat",
    isOnline,
    isLive,
    isTypeActive: chatTypeActive,
    hasPrice: chatPrice > 0,
  });
  const callReason = unavailableReason({
    label: "Call",
    isOnline,
    isLive,
    isTypeActive: callTypeActive,
    hasPrice: callPrice > 0,
  });

  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 || 
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );

  const emergencyChatRate = Number(astrologer?.emergencyPrice?.chatRate?.amount) || 0;
  const emergencyCallRate = Number(astrologer?.emergencyPrice?.audioRate?.amount) || 0;
  const emergencyMinRate = emergencyChatRate > 0 && emergencyCallRate > 0
    ? Math.min(emergencyChatRate, emergencyCallRate)
    : emergencyChatRate || emergencyCallRate;
  
  return (
    <div 
      className={`${styles.astrologerCard} ${!isOnline ? styles.offlineCard : ''} ${className}`.trim()} 
      style={style}
    >
      {/* Live / Online / Offline badge */}
      {isLive ? (
        <button
          type="button"
          className={`${styles.statusBadge} ${styles.live}`}
          onClick={() => navigate(`/live/${liveRoomId}`)}
          aria-label="Astrologer is live, click to watch"
        >
          <span className={styles.liveDot} />
          <span>Live</span>
        </button>
      ) : (
        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      )}

      <div className={styles.ratingBadge}>
            <span className={styles.star}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="21"
                viewBox="0 0 12 13"
                fill="none"
              >
                <g clipPath={`url(#${starClipId})`}>
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
                  <clipPath id={starClipId}>
                    <rect width="11.8251" height="12.0879" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </span>
            <span className={styles.ratingText}>{astrologer.rating ? Number(astrologer.rating).toFixed(1) : '0.0'}</span>
          </div>

      <Link to={`/astrologer/${astrologer?._id}`} className={styles.cardLink}>
        <div className={styles.astrologerImageWrapper}>
          {/* These photos are the single biggest payload on the homepage — the
              CDN serves the originals (896x902, 1433x1433 …) for a box that
              renders around 100x115, and there is no resized variant to ask
              for. Until the upload pipeline emits thumbnails, at least keep the
              off-screen ones out of the initial load and the decode off the
              main thread. `.astrologerImg` is width/height 100% inside a sized
              parent, so no width/height attributes are needed — the box already
              reserves the space. */}
          <img
            src={astrologer.profileImgUrl || getAstrologerDefaultImage(astrologer.gender)}
            alt={astrologer.firstName}
            className={styles.astrologerImg}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = getAstrologerDefaultImage(astrologer.gender);
            }}
          />
        </div>
        <h3 className={styles.astrologerName}>
          {getAstrologerDisplayName(astrologer)}
        </h3>
        {astrologer.experience && (
          <div className={styles.experienceRow}>
            <BookOpen size={18} className={styles.bookIcon} />
            <span className={styles.experienceText}>
              {astrologer.experience} years exp.
            </span>
          </div>
        )}
        {astrologer?.languagePreferences?.length > 0 && (
          <div className={styles.languages}>
            {astrologer.languagePreferences.map((lang, index) => (
              <span key={index} className={styles.languageBadge}>
                {lang.languageName}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className={styles.actionButtons}>
        {isLive ? (
          <div className={styles.buttonWrapper} style={{ width: '100%' }}>
            <button
              className={styles.liveBtn}
              onClick={() => navigate(`/live/${liveRoomId}`)}
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="4" fill="#f75801"/>
                <path d="M10.5 21.5C8.5 19.5 7.5 17 7.5 14.5C7.5 12 8.5 9.5 10.5 7.5" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M21.5 7.5C23.5 9.5 24.5 12 24.5 14.5C24.5 17 23.5 19.5 21.5 21.5" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M13 19C11.5 17.5 11 16 11 14.5C11 13 11.5 11.5 13 10" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M19 10C20.5 11.5 21 13 21 14.5C21 16 20.5 17.5 19 19" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Join Live
            </button>
            <p className={styles.priceText}>&nbsp;</p>
          </div>
        ) : !isOnline && hasEmergency ? (
          <div className={styles.emergencyButtonWrapper}>
            <button
              className={styles.emergencySingleBtn}
              onClick={() => onEmergencyClick?.(astrologer)}
            >
              Emergency
            </button>
            {emergencyMinRate > 0 && (
              <p className={styles.priceText}>
                <span className={styles.priceAmount}>₹{emergencyMinRate}</span>/min
              </p>
            )}
          </div>
        ) : (
          <>
            {(chatEnabled || !callEnabled) && (
            <div className={styles.buttonWrapper}>
              <button
                className={`${styles.chatBtn} ${!chatEnabled ? styles.unavailable : ""}`.trim()}
                onClick={() => {
                  if (!chatEnabled) {
                    toast.info(chatReason);
                    return;
                  }
                  onConnect(astrologer, "chat");
                }}
                aria-disabled={!chatEnabled}
                title={!chatEnabled ? chatReason : "Start chat"}
              >
                <img src={AppIcons.ChatMinutesIcon} alt="" /> Chat
              </button>
              <p className={styles.priceText}>
                {chatPrice > 0 ? (
                  astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.originalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{chatPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.priceAmount}>₹{chatPrice}</span> min
                    </>
                  )
                ) : <>&nbsp;</>}
              </p>
            </div>
            )}
            {(callEnabled || !chatEnabled) && (
            <div className={styles.buttonWrapper}>
              <button
                className={`${styles.callBtn} ${!callEnabled ? styles.unavailable : ""}`.trim()}
                onClick={() => {
                  if (!callEnabled) {
                    toast.info(callReason);
                    return;
                  }
                  onConnect(astrologer, "audio");
                }}
                aria-disabled={!callEnabled}
                title={!callEnabled ? callReason : "Start call"}
              >
                <img src={AppIcons.CallMinutesIcon} alt="" /> Call
              </button>
              <p className={styles.priceText}>
                {callPrice > 0 ? (
                  astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.originalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{callPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.priceAmount}>₹{callPrice}</span> min
                    </>
                  )
                ) : <>&nbsp;</>}
              </p>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

NewAstrologerCard.displayName = "NewAstrologerCard";

export default NewAstrologerCard;
