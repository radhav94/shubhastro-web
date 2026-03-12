import React from "react";
import { Video } from "lucide-react";
import styles from "./ConsultHistoryCard.module.scss";
import RatingStars from "./RatingStars";

const ConsultHistoryCard = ({ consultation }) => {
  return (
    <div className={styles.consultCard}>
      <div className={styles.cardTop}>
        <div className={styles.leftSection}>
          <img
            src={consultation.image}
            alt={consultation.name}
            className={styles.avatar}
          />
          <div className={styles.details}>
            <h4 className={styles.name}>{consultation.name}</h4>
            <p className={styles.dateTime}>
              <span className={styles.icon}>📅</span>
              {consultation.date}
              <span className={styles.separator}>•</span>
              <span className={styles.icon}>🕐</span>
              {consultation.time}
            </p>
            <p className={styles.duration}>Duration : {consultation.duration}</p>
            <p className={styles.amount}>₹{consultation.amount}</p>
          </div>
        </div>
        <div className={styles.videoIcon}>
          <Video size={20} />
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.ratingSection}>
          <span className={styles.ratingLabel}>Your Rating</span>
          <RatingStars rating={consultation.rating} readonly />
        </div>
        <button className={styles.consultButton}>Consult Again</button>
      </div>
    </div>
  );
};

export default ConsultHistoryCard;
