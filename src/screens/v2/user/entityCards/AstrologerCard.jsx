import { Calendar, Star } from "lucide-react";
import styles from "./EntityCards.module.scss";

const AstrologerCard = ({ item, onClick }) => (
  <div className={styles.card} onClick={() => onClick?.(item)}>
    <img
      src={item.profileImgUrl}
      alt={`${item.firstName || ""} ${item.lastName || ""}`}
      className={styles.cardImage}
    />
    <div className={styles.cardDetails}>
      <h3 className={styles.cardName}>
        {item.firstName} {item.lastName}
      </h3>
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          <Star size={12} /> {item.totalSessions} session{item.totalSessions !== 1 ? "s" : ""}
        </span>
        <span className={styles.metaItem}>
          <Calendar size={12} /> Last: {new Date(item.lastSessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  </div>
);

export default AstrologerCard;
