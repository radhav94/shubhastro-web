import { useState } from "react";
import styles from "./Feedback.module.scss";
import { ChevronRight, CircleX } from "lucide-react";
import {
  AppIcons,
  getAstrologerDefaultImage,
  getAstrologerImageUrl,
} from "../../../../../utils/appImages";

const FeedbackModal = ({
  open,
  onClose,
  handleSubmit,
  ratedUserName,
  profileImgUrl,
  loading,
  gender,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isAnonymous, setAnonymous] = useState(false);
  const maxLength = 160;

  if (!open) return null;

  const onCloseClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  const onSubmitClick = async () => {
    /*
     * resetForm() used to run unconditionally, so a failed submit wiped the
     * rating and the review text along with it. Someone who had spent minutes
     * writing a review got a generic "something went wrong" and an empty box —
     * nothing to retry with, and no way to recover what they had typed.
     *
     * A handler opts into keeping the text by returning exactly `false`.
     * Anything else (including the `undefined` that every existing caller
     * returns) still clears the form, so this is backwards compatible.
     */
    const submitted = await handleSubmit({
      rating,
      review,
      isAnonymous,
    });

    if (submitted !== false) resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setReview("");
    setAnonymous(false);
  };

  return (
    <div className={styles.overlay} onClick={onCloseClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onCloseClick}>
          <CircleX size={24} />
        </button>

        <div className={styles.astrologerRow}>
          {/* Resolution goes through getAstrologerImageUrl rather than
              `profileImgUrl || getAstrologerDefaultImage(gender)` so every
              avatar in the app shares one code path. Behaviour is the same here
              with one fix: `||` accepts a blank or whitespace-only string as a
              valid src (yielding a broken image), the helper treats it as absent
              and falls through to the gendered default.

              This modal takes a plain URL, not an astrologer object, and every
              caller already hands over the correctly sized variant — ChatWindow
              and the call screens resolve `small` (this avatar is 44px) before
              passing it. The helper passes such a URL straight through. */}
          <img
            className={styles.astrologerAvatar}
            src={getAstrologerImageUrl({ profileImgUrl, gender }, "small")}
            alt={ratedUserName || "Astrologer"}
            width={44}
            height={44}
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = getAstrologerDefaultImage(gender);
            }}
          />
          <span className={styles.astrologerName}>{ratedUserName || "Astrologer"}</span>
        </div>

        <h3 className={styles.title}>
          Please rate your experience
        </h3>

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
          rows={3}
          aria-label="Write your review"
        />

        {/* Figma: checkbox text is "Hide my name from the review" */}
        <label className={styles.checkbox}>
          <input
            type="checkbox"
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
