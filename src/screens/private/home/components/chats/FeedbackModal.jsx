import { useState } from "react";
import styles from "./Feedback.module.scss";

const FeedbackModal = ({ open, onClose, handleSubmit, ratedUserName, reviewerName, loading }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isAnonymous, setAnonymous] = useState(false);
  const maxLength = 160;

  if (!open) return null;

  const onSubmitClick = async() => {
    await handleSubmit({
      rating,
      review,
      isAnonymous,
    });

    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setReview("");
    setAnonymous(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <h3 className={styles.title}>Rate {ratedUserName}</h3>

        <img
          className={styles.avatar}
          src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="User"
        />

        <div className={styles.userRow}>
          <img
            className={styles.smallAvatar}
            src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="Reviewer"
          />
          <div>
            <p className={styles.name}>{reviewerName}</p>
            <p className={styles.hint}>
              Reviews are public if you are not anonymous
            </p>
          </div>
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" value={isAnonymous} checked={isAnonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Hide my name from all public reviews
        </label>

        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`${styles.star} ${i <= rating ? styles.active : ""}`}
              onClick={() => setRating(i)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea className={styles.textarea}
          placeholder="Describe your experience (optional)"
          maxLength={maxLength}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          name="Comment"
        />

        <div className={styles.counter}>{review.length}/{maxLength}</div>

        <button
          className={styles.submitBtn}
          onClick={onSubmitClick}
          disabled={rating === 0 || loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
