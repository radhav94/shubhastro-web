import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import styles from "./OrderInfoCard.module.scss";
import RatingStars from "./RatingStars";
import ProgressBar from "./ProgressBar";

const OrderInfoCard = ({ orderId, date, time, duration, amount }) => {
  const [rating, setRating] = useState(0);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  return (
    <div className={styles.orderInfoCard}>
      <div className={styles.cardWrapper}>
        <div className={styles.cardHeader}>
          <h3 className={styles.orderId}>{orderId}</h3>
          <button className={styles.menuButton} aria-label="More options">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.audioIcon}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="4" height="24" x="6" y="8" fill="#111827" rx="2">
                <animate
                  attributeName="height"
                  values="24;32;24"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y"
                  values="8;4;8"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </rect>
              <rect width="4" height="32" x="14" y="4" fill="#111827" rx="2">
                <animate
                  attributeName="height"
                  values="32;24;32"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.2s"
                />
                <animate
                  attributeName="y"
                  values="4;8;4"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.2s"
                />
              </rect>
              <rect width="4" height="28" x="22" y="6" fill="#111827" rx="2">
                <animate
                  attributeName="height"
                  values="28;36;28"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.4s"
                />
                <animate
                  attributeName="y"
                  values="6;2;6"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.4s"
                />
              </rect>
              <rect width="4" height="24" x="30" y="8" fill="#111827" rx="2">
                <animate
                  attributeName="height"
                  values="24;30;24"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.6s"
                />
                <animate
                  attributeName="y"
                  values="8;5;8"
                  dur="1s"
                  repeatCount="indefinite"
                  begin="0.6s"
                />
              </rect>
            </svg>
          </div>

          <div className={styles.orderDetails}>
            <p className={styles.detailRow}>
              <span>{date}</span>
              <span className={styles.separator}>•</span>
              <span>{time}</span>
            </p>
            <p className={styles.detailRow}>
              <span>Duration : {duration}</span>
            </p>
            <p className={styles.amount}>₹{amount}</p>
          </div>
        </div>

        <ProgressBar progress={75} />

        <div className={styles.ratingSection}>
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>Add Rating</span>
            <RatingStars rating={rating} onRatingChange={handleRatingChange} />
            <span className={styles.experienceLabel}>Tell us your experience</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoCard;
