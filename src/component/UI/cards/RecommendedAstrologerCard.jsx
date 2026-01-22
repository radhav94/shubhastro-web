import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import styles from "./RecommendedAstrologerCard.module.scss";
import astrologerImage from "../../../assets/images/top-rated-1.svg";
import { useNavigate } from "react-router-dom";

const RecommendedAstrologerCard = ({ data, onConnect }) => {
  const navigate = useNavigate();
  const { firstName, lastName, imageUrl, aadharCardImgUrl, panCardImgUrl, rating, experience } = data;

  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const displayExperience = experience ? `${experience} years exp.` : "";
  
  // Try multiple image fields with fallback
  const profileImage = imageUrl || aadharCardImgUrl || panCardImgUrl || astrologerImage;

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={profileImage}
          alt={fullName}
          className={styles.image}
          onError={(e) => {
            e.target.src = astrologerImage;
          }}
        />
        <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span className={styles.ratingText}>{rating || "0"}</span>
        </div>
      </div>

      <div className={styles.leftSection}>
        <h3 
          className={styles.name}
          onClick={() => navigate(`/astrologer/${data?.astrologerId || data?._id}`)}
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
