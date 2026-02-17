import styles from "./ChatAstrologerCard.module.scss";
import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { getAstrologerDefaultImage } from "../../../utils/appImages";

const ChatAstrologerCard = ({ data, onConnect }) => {
  const navigate = useNavigate();
  // Handle rating - use rating field or default to 4.5
  const rating = data?.rating;

  // Handle experience - convert to number if string
  const experience = parseInt(data?.experience) || 0;

  // Handle expertise - format the snake_case to readable text
  const formatExpertise = (expertise) => {
    return expertise
      ?.replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Use expertise field instead of specialities
  const expertiseList = (data?.expertise || [])
    .slice(0, 3)
    .map(formatExpertise);

  // Handle languages - extract languageName from objects or use strings
  const languagesRaw = (data?.languagePreference || []).map((lang) =>
    typeof lang === "object" ? lang.languageName : lang,
  );

  // Sort languages to show English first, then Hindi, then others
  const languages = languagesRaw
    .sort((a, b) => {
      const order = { English: 0, Hindi: 1 };
      const aOrder = order[a] !== undefined ? order[a] : 2;
      const bOrder = order[b] !== undefined ? order[b] : 2;
      return aOrder - bOrder;
    })
    .slice(0, 2);

  // Handle image - try multiple possible fields with gender-based fallback
  const imageUrl =
    data?.imageUrl ||
    data?.aadharCardImgUrl ||
    data?.panCardImgUrl ||
    getAstrologerDefaultImage(data?.gender);

  return (
    <div className={styles.card}>
      <div className={styles.imageSection}>
        <img
          src={imageUrl}
          alt={`${data?.firstName} ${data?.lastName}`}
          onClick={() =>
            navigate(`/astrologer/${data?.astrologerId || data?._id}`)
          }
          className={styles.astrologerImage}
          onError={(e) => {
            e.target.src = getAstrologerDefaultImage(data?.gender);
          }}
        />
        {rating && <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span>{rating?.toFixed(1)}</span>
        </div>}
      </div>

      <div className={styles.infoSection}>
        <h3
          className={styles.name}
          onClick={() =>
            navigate(`/astrologer/${data?.astrologerId || data?._id}`)
          }
          style={{ cursor: "pointer" }}
        >
          {data?.firstName} {data?.lastName}
        </h3>

        {experience > 0 && (
          <div className={styles.experience}>
            <PiBookOpenTextLight className={styles.bookIcon} />
            <span>{experience} years exp.</span>
          </div>
        )}

        {expertiseList.length > 0 && (
          <div className={styles.specialties}>
            {expertiseList.map((expertise, index) => (
              <span key={index}>
                {expertise}
                {index < expertiseList.length - 1 && " · "}
              </span>
            ))}
          </div>
        )}

        {languages.length > 0 && (
          <div className={styles.languages}>
            {languages.map((lang, index) => (
              <span key={index} className={styles.languageTag}>
                {lang}
              </span>
            ))}
          </div>
        )}

        <button className={styles.connectButton} onClick={onConnect}>
          Connect
        </button>
      </div>
    </div>
  );
};

export default ChatAstrologerCard;
