import { Star, BookOpen } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link } from "react-router-dom";
import {
  AppIcons,
  getAstrologerDefaultImage,
  appSvgs,
} from "../../../../utils/appImages";

const NewAstrologerDetailsCard = ({
  astrologer,
  onConnect,
  className = "",
  style = {},
}) => {
  

  const imageUrl =
    astrologer?.imageUrl ||
    astrologer?.aadharCardImgUrl ||
    astrologer?.panCardImgUrl ||
    astrologer?.profileImgUrl ||
    getAstrologerDefaultImage(astrologer?.gender);

  return (
    <div className={`${styles.detailsCard} ${className}`.trim()} style={style}>
      <Link
        to={`/astrologer/${astrologer._id}`}
        className={styles.detailsImageLink}
      >
        <div className={styles.detailsImageWrapper}>
          <img
            src={imageUrl}
            alt={`${astrologer?.firstName} ${astrologer?.lastName}`}
            onClick={() =>
              navigate(
                `/astrologer/${astrologer?.astrologerId || astrologer?._id}`,
              )
            }
            className={styles.detailsImage}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {/* Rating Badge */}
          {astrologer?.rating && <div className={styles.detailsRatingBadge}>
            <Star
              size={16}
              className={styles.detailsRatingStar}
              fill="#FF8A00"
              stroke="#FF8A00"
            />
            <span className={styles.detailsRatingText}>
              {astrologer?.rating.toFixed(1)}
            </span>
          </div>}
        </div>
      </Link>

      <div className={styles.detailsInfo}>
        <Link
          to={`/astrologer/${astrologer?.astrologerId || astrologer?._id}`}
          className={styles.detailsNameLink}
        >
          <h3 className={styles.detailsName}>
            {astrologer?.firstName} {astrologer?.lastName}
          </h3>
        </Link>

        {/* Experience Row */}
        <div className={styles.detailsExperience}>
          <img
            src={appSvgs.Experience}
            className={styles.detailsExperienceIcon}
          />
          <span className={styles.detailsExperienceText}>
            {parseInt(astrologer?.experience) || 0} years exp.
          </span>
        </div>

        {/* Specialties */}
        <p className={styles.detailsSpecialties}>
          {(astrologer?.expertise).join(" · ")}
        </p>

        {/* Languages */}
        <div className={styles.detailsLanguages}>
          {astrologer?.languagePreferences?.map((lang, index) => (
            <span key={index} className={styles.detailsLanguageBadge}>
              {lang.languageName}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={styles.detailsActionButtons}>
          <div className={styles.detailsButtonWrapper}>
            <button
              className={styles.detailsChatBtn}
              onClick={() => onConnect(astrologer, "chat")}
            >
              <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
            </button>
            <p className={styles.detailsPriceText}>
              ₹
              <span className={styles.detailsPriceAmount}>
                {astrologer?.price?.chatRate?.amount || 0}
              </span>
              /min
            </p>
          </div>
          <div className={styles.detailsButtonWrapper}>
            <button
              className={styles.detailsCallBtn}
               onClick={() => onConnect(astrologer, "audio")}
            >
              <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
            </button>
            <p className={styles.detailsPriceText}>
              ₹
              <span className={styles.detailsPriceAmount}>
                {astrologer?.price?.audioRate?.amount || 0}
              </span>
              /min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAstrologerDetailsCard;
