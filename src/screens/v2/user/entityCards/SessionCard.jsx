import { Calendar, Clock, Phone, Video, MessageSquare } from "lucide-react";
import styles from "./EntityCards.module.scss";

const getIcon = (type) => {
  switch (type) {
    case "audio": return <Phone size={16} />;
    case "video": return <Video size={16} />;
    case "chat": return <MessageSquare size={16} />;
    default: return <Phone size={16} />;
  }
};

const SessionCard = ({ item, onClick }) => (
  <div className={styles.card} onClick={() => onClick?.(item)}>
    <img
      src={item.astrologerId?.profileImgUrl}
      alt={`${item.astrologerId?.firstName || ""} ${item.astrologerId?.lastName || ""}`}
      className={styles.cardImage}
    />
    <div className={styles.cardDetails}>
      <h3 className={styles.cardName}>
        {item.astrologerId?.firstName} {item.astrologerId?.lastName}
      </h3>
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          <Calendar size={12} /> {new Date(item.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span className={styles.metaItem}>
          <Clock size={12} /> {new Date(item.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className={styles.cardSub}>Duration : {item.billedMinutes} Min</p>
      {item.billedAmount != null && <p className={styles.cardAmount}>₹{item.billedAmount}</p>}
    </div>
    <span className={styles.typeIcon}>{getIcon(item.type)}</span>
  </div>
);

export default SessionCard;
