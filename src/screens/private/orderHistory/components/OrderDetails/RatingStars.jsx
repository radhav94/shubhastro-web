import React from "react";
import { Star } from "lucide-react";
import styles from "./RatingStars.module.scss";

const STARS = [1, 2, 3, 4, 5];

const RatingStars = ({ rating, onRatingChange, readonly = false }) => {
  // A read-only rating is a value being displayed, not a control. It used to
  // render as five `disabled` buttons, which look tappable, absorb every tap and
  // give no response — a dead click on something that was never meant to be
  // interactive. Render it as plain markup with a single accessible label.
  if (readonly) {
    return (
      <div
        className={styles.ratingStars}
        role="img"
        aria-label={`Rated ${rating || 0} out of 5`}
      >
        {STARS.map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.filled : ""} ${styles.readonly}`}
            aria-hidden="true"
          >
            <Star size={20} fill={star <= rating ? "#F97316" : "none"} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.ratingStars}>
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${star <= rating ? styles.filled : ""}`}
          onClick={() => onRatingChange?.(star)}
          aria-label={`Rate ${star} stars`}
        >
          <Star size={20} fill={star <= rating ? "#F97316" : "none"} />
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
