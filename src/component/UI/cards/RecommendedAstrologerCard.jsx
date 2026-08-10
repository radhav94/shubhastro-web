import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import styles from "./RecommendedAstrologerCard.module.scss";
import { useNavigate } from "react-router-dom";
import { getAstrologerDefaultImage } from "../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../utils/helper/string.utils";

const RecommendedAstrologerCard = ({ data, onConnect }) => {
  const navigate = useNavigate();
  const { imageUrl, aadharCardImgUrl, panCardImgUrl, rating, experience } = data;

  const fullName = getAstrologerDisplayName(data);
  const displayExperience = experience ? `${experience} years exp.` : "";
  
  // Try multiple image fields with fallback to gender-based default
  const profileImage = data?.profileImgUrl || imageUrl || getAstrologerDefaultImage(data?.gender);

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={profileImage}
          alt={fullName}
          className={styles.image}
          onError={(e) => {
            e.target.src = getAstrologerDefaultImage(data?.gender);
          }}
        />
      </div>

      <div className={styles.leftSection}>
        <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span className={styles.ratingText}>{rating ? Number(rating).toFixed(1) : "0.0"}</span>
        </div>
        <h3 
          className={styles.name}
          onClick={() => navigate(`/astrologer/${data?._id}`)}
          style={{ cursor: 'pointer' }}
        >
          {fullName}
        </h3>

        {displayExperience && (
          <div className={styles.experience}>
            <PiBookOpenTextLight className={styles.bookIcon} />
            <span className={styles.experienceText}>{displayExperience}</span>
          </div>
        )}

        <button className={styles.connectButton} onClick={onConnect}>
          Connect
        </button>
      </div>
    </div>
  );
};

export default RecommendedAstrologerCard;
