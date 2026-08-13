import styles from "./recommendedCard.module.scss";
import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import { getAstrologerDefaultImage } from "../../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const RecommendedCard = ({ astro, onChat, onAudioCall, onVideoCall, mode }) => {
  const rating = astro?.rating || 0;
  const experience = parseInt(astro?.experience) || 0;
  const fullName = getAstrologerDisplayName(astro);

  // Get languages
  const languages =
    astro?.languagePreferences?.length > 0
      ? astro.languagePreferences
          .map((lang) => lang.languageName || lang)
          .slice(0, 2)
          .join(", ")
      : astro?.languagePreference?.slice(0, 2).join(", ") || "";

  // Get expertise
  const expertise = astro?.expertise?.slice(0, 2).map((e) => (typeof e === "object" ? e.title : e)).join(", ") || "";

  // Get price based on mode
  const price =
    mode === "chat"
      ? astro?.price?.chatRate?.amount
      : astro?.price?.audioRate?.amount;

  return (
    <>
      <div className={styles.card}>
        <img
          src={astro?.imageUrl || getAstrologerDefaultImage(astro?.gender)}
          alt={fullName}
          onError={(e) => {
            e.target.src = getAstrologerDefaultImage(astro?.gender);
          }}
        />

        <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span>{rating.toFixed(1)}</span>
        </div>

        <h4>{fullName || "Astrologer"}</h4>

        {experience > 0 && (
          <div className={styles.experience}>
            <PiBookOpenTextLight className={styles.bookIcon} />
            <span>{experience} years exp.</span>
          </div>
        )}

        <div className={styles.buttonsRow}>
          {mode === "chat" ? (
            <button className={styles.connectBtn} onClick={onChat}>
              Connect
            </button>
          ) : (
            <button className={styles.connectBtn} onClick={onAudioCall}>
              Connect
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default RecommendedCard;
