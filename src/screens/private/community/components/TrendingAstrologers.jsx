import { useNavigate } from "react-router-dom";
import styles from "../Community.module.scss";
import astrologerImg from "../../../../assets/default-img/astrologer male_v.1.png";

const TrendingAstrologers = ({
  title = "Trending Astrologers",
  btnLabel = "Connect",
  astrologers = [],
}) => {
  const navigate = useNavigate();

  if (!astrologers.length) return null;

  const handleConnect = (astrologer) => {
    navigate(`/astrologer/${astrologer._id}`);
  };

  return (
    <aside className={styles.trendingSidebar}>
      <h3 className={styles.trendingTitle}>{title}</h3>
      <ul className={styles.trendingList}>
        {astrologers.map((astrologer) => (
          <li key={astrologer._id || astrologer.astrologerID} className={styles.trendingItem}>
            <img
              src={astrologer.profileImgUrl || astrologerImg}
              alt={`${astrologer.firstName} ${astrologer.lastName || ""}`}
              className={styles.trendingAvatar}
            />
            <div className={styles.trendingInfo}>
              <span className={styles.trendingName}>
                {astrologer.firstName} {astrologer.lastName || ""}
              </span>
              <span className={styles.trendingExp}>
                Exp. {astrologer.experience}+ Years
              </span>
            </div>
            <button
              className={styles.connectBtn}
              onClick={() => handleConnect(astrologer)}
            >
              {btnLabel}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default TrendingAstrologers;
