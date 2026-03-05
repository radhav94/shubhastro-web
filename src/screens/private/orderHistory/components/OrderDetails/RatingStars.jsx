import React from "react";
import { Star } from "lucide-react";
import styles from "./RatingStars.module.scss";

const RatingStars = ({ rating, onRatingChange, readonly = false }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={styles.ratingStars}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${star <= rating ? styles.filled : ""} ${readonly ? styles.readonly : ""}`}
          onClick={() => !readonly && onRatingChange(star)}
          disabled={readonly}
          aria-label={`Rate ${star} stars`}
        >
          <Star size={20} fill={star <= rating ? "#F97316" : "none"} />
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
