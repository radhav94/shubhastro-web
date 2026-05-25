import styles from "../Community.module.scss";
import astrologerImg from "../../../../assets/default-img/astrologer male_v.1.png";

const TRENDING_ASTROLOGERS = [
  { id: 1, name: "Pandit Ravi Ji", experience: "Exp. 20+ Years", avatar: astrologerImg },
  { id: 2, name: "Pandit Ravi Ji", experience: "Exp. 20+ Years", avatar: astrologerImg },
  { id: 3, name: "Pandit Ravi Ji", experience: "Exp. 20+ Years", avatar: astrologerImg },
  { id: 4, name: "Pandit Ravi Ji", experience: "Exp. 20+ Years", avatar: astrologerImg },
  { id: 5, name: "Pandit Ravi Ji", experience: "Exp. 20+ Years", avatar: astrologerImg },
];

const TrendingAstrologers = ({ title = "Trending Astrologers", btnLabel = "Connect" }) => {
  return (
    <aside className={styles.trendingSidebar}>
      <h3 className={styles.trendingTitle}>{title}</h3>
      <ul className={styles.trendingList}>
        {TRENDING_ASTROLOGERS.map((astrologer) => (
          <li key={astrologer.id} className={styles.trendingItem}>
            <img src={astrologer.avatar} alt={astrologer.name} className={styles.trendingAvatar} />
            <div className={styles.trendingInfo}>
              <span className={styles.trendingName}>{astrologer.name}</span>
              <span className={styles.trendingExp}>{astrologer.experience}</span>
            </div>
            <button className={styles.connectBtn}>{btnLabel}</button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default TrendingAstrologers;
