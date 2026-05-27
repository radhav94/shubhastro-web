import { useNavigate } from "react-router-dom";
import styles from "../Community.module.scss";

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

  const getInitials = (firstName, lastName) => {
    const first = (firstName || "")[0] || "";
    const second = (lastName || "")[0] || (firstName || "")[1] || "";
    return (first + second).toUpperCase() || "?";
  };

  return (
    <aside className={styles.trendingSidebar}>
      <h3 className={styles.trendingTitle}>{title}</h3>
      <ul className={styles.trendingList}>
        {astrologers.map((astrologer) => {
          const name = `${astrologer.firstName} ${astrologer.lastName || ""}`;
          return (
            <li key={astrologer._id || astrologer.astrologerID} className={styles.trendingItem}>
              {astrologer.profileImgUrl ? (
                <img
                  src={astrologer.profileImgUrl}
                  alt={name}
                  className={styles.trendingAvatar}
                />
              ) : (
                <div className={styles.trendingAvatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  {getInitials(astrologer.firstName, astrologer.lastName)}
                </div>
              )}
              <div className={styles.trendingInfo}>
                <span className={styles.trendingName}>{name}</span>
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
          );
        })}
      </ul>
    </aside>
  );
};

export default TrendingAstrologers;
