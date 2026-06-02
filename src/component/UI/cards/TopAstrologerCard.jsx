import styles from "./TopAstrologerCard.module.scss";
import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import { Link } from "react-router-dom";
import { getAstrologerDefaultImage } from "../../../utils/appImages";

const TopAstrologerCard = ({ data, onConnect }) => {
  // Handle rating - use rating field or default to 4.5
  const rating = data?.rating || 0;

  // Handle experience - convert to number if string
  const experience = parseInt(data?.experience) || 0;

  // Handle image - try multiple possible fields with gender-based fallback
  const imageUrl =
    data?.profileImgUrl ||
    data?.imageUrl ||
    getAstrologerDefaultImage(data?.gender);

  return (
    <div className={styles.topAstrologerCard}>
      <Link
        to={`/astrologer/${data?._id}`}
        className={styles.cardLink}
      >
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt={`${data?.firstName} ${data?.lastName}`}
            className={styles.profileImage}
            onError={(e) => {
              e.target.src = getAstrologerDefaultImage(data?.gender);
            }}
          />
        </div>

        <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span>{rating.toFixed(1)}</span>
        </div>

        <h3 className={styles.name}>
          {data?.firstName} {data?.lastName}
        </h3>

        {experience > 0 && (
          <div className={styles.experience}>
            <PiBookOpenTextLight className={styles.bookIcon} />
            <span>{experience} years exp.</span>
          </div>
        )}
      </Link>
      <button className={styles.connectButton} onClick={onConnect}>
        Connect
      </button>
    </div>
  );
};

export default TopAstrologerCard;
