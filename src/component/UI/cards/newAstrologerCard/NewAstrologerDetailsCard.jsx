import { useState } from "react";
import { Star } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link, useNavigate } from "react-router-dom";
import {
  AppIcons,
  appSvgs,
  getAstrologerDefaultImage,
  getAstrologerImageUrl,
} from "../../../../utils/appImages";
import EmergencySessionModal from "../../modal/EmergencySessionModal/EmergencySessionModal";
import useAstrologerLiveStatus from "../../../../hooks/useAstrologerLiveStatus";
import { getAstrologerAvailability } from "../../../../utils/helper/astrologerAvailability";
import toast from "../../../toast";
import { getAstrologerDisplayName, getAstrologerProfilePath } from "../../../../utils/helper/string.utils";

const NewAstrologerDetailsCard = ({
  astrologer,
  onConnect,
  className = "",
  style = {},
  // Set on the first card only: loads the photo eagerly at high priority
  // because it is the one card in this list that can be above the fold.
  priority = false,
}) => {
  const navigate = useNavigate();
  const isOnline = astrologer?.isActive === true;
  const { isLive, roomId: liveRoomId } = useAstrologerLiveStatus(astrologer?._id, astrologer?.astrologerLiveStatus);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  // When the astrologer is live streaming, chat and call are not available.
  const { chatPrice, callPrice, chatEnabled, callEnabled, chatReason, callReason } =
    getAstrologerAvailability(astrologer, isLive);
  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 ||
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );
  const emergencyChatRate = Number(astrologer?.emergencyPrice?.chatRate?.amount) || 0;
  const emergencyCallRate = Number(astrologer?.emergencyPrice?.audioRate?.amount) || 0;
  const emergencyMinRate = emergencyChatRate > 0 && emergencyCallRate > 0
    ? Math.min(emergencyChatRate, emergencyCallRate)
    : emergencyChatRate || emergencyCallRate;
  const imageUrl = getAstrologerImageUrl(astrologer);

  /*
    `isLive` and `roomId` come from the same hook but are not guaranteed to
    arrive together — the status flag can be true (from the astrologer record or
    an early socket event) while roomId is still undefined or has gone stale
    after a stream ended. Interpolating it regardless sent the user to
    "/live/undefined", which cannot resolve a room, so a deliberate tap on
    "Join Live" dumped them somewhere with nothing to watch and they went back to
    browsing. AstrologerLiveBadge already guards this exact navigation with
    `if (roomId)`; the cards did not.

    Kept live rather than disabled, and it says what happened instead of
    silently doing nothing.
  */
  const handleJoinLive = () => {
    if (!liveRoomId) {
      toast.error("This live session just ended. Try another astrologer.");
      return;
    }
    navigate(`/live/${liveRoomId}`);
  };

  return (
    <div
      className={`${styles.detailsCard} ${!isOnline ? styles.offlineDetailsCard : ""} ${className}`.trim()}
      style={style}
    >
      {isLive ? (
        <button
          type="button"
          className={`${styles.statusBadge} ${styles.live}`}
          onClick={handleJoinLive}
          aria-label="Astrologer is live, click to watch"
        >
          <span className={styles.liveDot} />
          <span>Live</span>
        </button>
      ) : (
        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
      )}

      {/*
        Full-card tap target. Kept as an empty overlay anchor so the action
        buttons stay on top, but it needs an accessible name — without one it is
        an anonymous link to assistive tech and to tap heuristics.
      */}
      <Link
        to={getAstrologerProfilePath(astrologer)}
        className={styles.detailsImageLink}
        aria-label={`View ${getAstrologerDisplayName(astrologer)}'s profile`}
      ></Link>
        <div className={styles.detailsImageWrapper}>
          {/* This card had no `loading` attribute, so every photo in the list
              was eager. The list is infinite-scrolled 9 at a time and the CDN
              serves unresized originals (896x902, 1433x1433 …) into a box that
              renders around 95x156, so a first page of results kicked off nine
              full-size downloads at once — all but the first below the fold —
              competing with the entry bundle and the API call that first paint
              is waiting on. `.detailsImage` is 100%/100% inside a sized parent,
              so the box already reserves the space and no width/height
              attributes are needed. */}
          <img
            src={imageUrl}
            alt={`${astrologer?.firstName} ${astrologer?.lastName}`}
            className={styles.detailsImage}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onError={(e) => { e.target.src = getAstrologerDefaultImage(astrologer?.gender); }}
          />
        </div>

      <div className={styles.detailsInfo}>
        <Link to={getAstrologerProfilePath(astrologer)} className={styles.detailsNameLink}>
          <h3 className={styles.detailsName}>
            {getAstrologerDisplayName(astrologer)}
          </h3>
        </Link>

        <div className={styles.detailsMeta}>
          <div className={styles.detailsExperience}>
            <img src={appSvgs.Experience} className={styles.detailsExperienceIcon} alt="" />
            <span className={styles.detailsExperienceText}>
              {parseInt(astrologer?.experience) || 0} yrs
            </span>
          </div>
          {astrologer?.rating > 0 && (
            <div className={styles.detailsRatingInline}>
              <Star size={12} fill="#FFB246" stroke="#FFB246" />
              <span>{astrologer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className={styles.detailsSpecialties}>
          {astrologer?.expertise?.slice(0, 2)?.map((e) => (typeof e === "object" ? e.title : e)).join(" · ")}
          {astrologer?.expertise?.length > 2 ? " ..." : ""}
        </p>

        {astrologer?.languagePreferences?.length > 0 && (
          <div className={styles.detailsLanguages}>
            {astrologer.languagePreferences.map((lang, index) => (
              <span key={index} className={styles.detailsLanguageBadge}>
                {lang.languageName}
              </span>
            ))}
          </div>
        )}

        <div className={styles.detailsActionButtons}>
          {isLive ? (
            <div className={styles.detailsButtonWrapper} style={{ width: '100%' }}>
              <button
                className={styles.liveBtn}
                onClick={handleJoinLive}
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
              <p className={styles.detailsPriceText}>&nbsp;</p>
            </div>
          ) : !isOnline && hasEmergency ? (
            <div className={styles.emergencyButtonWrapper}>
              <button className={styles.emergencySingleBtn} onClick={() => setShowEmergencyModal(true)}>
                Emergency
              </button>
              {emergencyMinRate > 0 && (
                <p className={styles.detailsPriceText}>
                  <span className={styles.detailsPriceAmount}>₹{emergencyMinRate}</span>/min
                </p>
              )}
            </div>
          ) : (
            <>
              {(chatEnabled || !callEnabled) && (
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={`${styles.detailsChatBtn} ${!chatEnabled ? styles.unavailable : ""}`.trim()}
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
                <p className={styles.detailsPriceText}>
                  {chatPrice > 0 ? (
                    astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                      <>
                        <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{chatPrice}</span> min
                      </>
                    ) : (
                      <>
                        <span className={styles.detailsPriceAmount}>₹{chatPrice}</span> min
                      </>
                    )
                  ) : <>&nbsp;</>}
                </p>
              </div>
              )}
              {(callEnabled || !chatEnabled) && (
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={`${styles.detailsCallBtn} ${!callEnabled ? styles.unavailable : ""}`.trim()}
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
                <p className={styles.detailsPriceText}>
                  {callPrice > 0 ? (
                    astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                      <>
                        <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{callPrice}</span> min
                      </>
                    ) : (
                      <>
                        <span className={styles.detailsPriceAmount}>₹{callPrice}</span> min
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

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={astrologer}
        onChatNow={(astro) => onConnect(astro, "chat", true)}
        onCallNow={(astro) => onConnect(astro, "audio", true)}
        onVideoNow={(astro) => onConnect(astro, "video", true)}
      />
    </div>
  );
};

export default NewAstrologerDetailsCard;
