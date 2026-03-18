import { useState } from "react";
import styles from "./Feedback.module.scss";
import { ChevronRight, CircleX } from "lucide-react";
import { AppIcons } from "../../../../../utils/appImages";

const FeedbackModal = ({
  open,
  onClose,
  handleSubmit,
  ratedUserName,
  reviewerName,
  loading,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isAnonymous, setAnonymous] = useState(false);
  const maxLength = 160;

  if (!open) return null;

  const onSubmitClick = async () => {
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
        <button className={styles.closeBtn} onClick={onClose}>
          <CircleX size={24} />
        </button>

        <h3 className={styles.title}>Please Rate your Experience </h3>

        {/* <img
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
        </div> */}

        {/* Star rating - Figma: centered, larger stars with gap */}
        <div className={styles.stars} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              className={`${styles.star} ${i <= rating ? styles.active : ""}`}
              onClick={() => setRating(i)}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-checked={i <= rating}
              role="radio"
            >
              <img
                className={styles.starActive}
                src={AppIcons.ActiveStarIcon}
                alt=""
              />
              <img
                className={styles.starInactive}
                src={AppIcons.InActiveStarIcon}
                alt=""
              />
            </button>
          ))}
        </div>

        {/* Figma: taller textarea with rounded border and light bg */}
        <textarea
          className={styles.textarea}
          placeholder="Tell us about your experience (optional)"
          maxLength={maxLength}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          name="comment"
          rows={6}
          aria-label="Write your review"
        />

        {/* Figma: checkbox text is "Hide my name from the review" */}
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            value={isAnonymous}
            checked={isAnonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>Hide my name from the review</span>
        </label>

        {/* Figma: full-width pill button with "Submit >" */}
        <button
          className={styles.submitBtn}
          onClick={onSubmitClick}
          disabled={rating === 0 || loading}
        >
          {loading ? "Submitting..." : "Submit"} <ChevronRight  size={24} />
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
