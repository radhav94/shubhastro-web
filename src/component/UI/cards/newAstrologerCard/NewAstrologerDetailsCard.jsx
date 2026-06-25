import { useState } from "react";
import { Star } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link } from "react-router-dom";
import {
  AppIcons,
  getAstrologerDefaultImage,
  appSvgs,
} from "../../../../utils/appImages";
import EmergencySessionModal from "../../modal/EmergencySessionModal/EmergencySessionModal";

const NewAstrologerDetailsCard = ({
  astrologer,
  onConnect,
  className = "",
  style = {},
}) => {
  const isOnline = astrologer?.isActive === true;
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const activeTypes = astrologer?.isActiveType || [];
  const chatPrice = Number(astrologer?.price?.chatRate?.amount) || 0;
  const callPrice = Number(astrologer?.price?.audioRate?.amount) || 0;
  const chatEnabled = isOnline && (activeTypes.includes("all") || activeTypes.includes("chat")) && chatPrice > 0;
  const callEnabled = isOnline && (activeTypes.includes("all") || activeTypes.includes("audio")) && callPrice > 0;
  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 ||
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );
  const emergencyChatRate = Number(astrologer?.emergencyPrice?.chatRate?.amount) || 0;
  const emergencyCallRate = Number(astrologer?.emergencyPrice?.audioRate?.amount) || 0;
  const emergencyMinRate = emergencyChatRate > 0 && emergencyCallRate > 0
    ? Math.min(emergencyChatRate, emergencyCallRate)
    : emergencyChatRate || emergencyCallRate;
  const imageUrl = astrologer?.profileImgUrl || getAstrologerDefaultImage(astrologer?.gender);

  return (
    <div
      className={`${styles.detailsCard} ${!isOnline ? styles.offlineDetailsCard : ""} ${className}`.trim()}
      style={style}
    >
      <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
        <span className={styles.statusDot} />
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      <Link to={`/astrologer/${astrologer._id}`} className={styles.detailsImageLink}>
        <div className={styles.detailsImageWrapper}>
          <img
            src={imageUrl}
            alt={`${astrologer?.firstName} ${astrologer?.lastName}`}
            className={styles.detailsImage}
            onError={(e) => { e.target.src = getAstrologerDefaultImage(astrologer?.gender); }}
          />
        </div>
      </Link>

      <div className={styles.detailsInfo}>
        <Link to={`/astrologer/${astrologer?._id}`} className={styles.detailsNameLink}>
          <h3 className={styles.detailsName}>
            {astrologer?.firstName} {astrologer?.lastName}
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
          {!isOnline && hasEmergency ? (
            <div className={styles.emergencyButtonWrapper}>
              <button className={styles.emergencySingleBtn} onClick={() => setShowEmergencyModal(true)}>
                Emergency Session{emergencyMinRate > 0 ? ` - ₹${emergencyMinRate}/min` : ''}
              </button>
            </div>
          ) : (
            <>
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={styles.detailsChatBtn}
                  onClick={() => chatEnabled && onConnect(astrologer, "chat")}
                  disabled={!chatEnabled}
                >
                  <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
                </button>
                <p className={styles.detailsPriceText}>
                  {astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{chatPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.detailsPriceAmount}>₹{chatPrice}</span> min
                    </>
                  )}
                </p>
              </div>
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={styles.detailsCallBtn}
                  onClick={() => callEnabled && onConnect(astrologer, "audio")}
                  disabled={!callEnabled}
                >
                  <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
                </button>
                <p className={styles.detailsPriceText}>
                  {astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{callPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.detailsPriceAmount}>₹{callPrice}</span> min
                    </>
                  )}
                </p>
              </div>
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
