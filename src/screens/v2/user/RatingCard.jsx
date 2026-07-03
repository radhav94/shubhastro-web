import { useState } from "react";
import { useRateTicketMutation } from "../../../redux/api/supportApi/supportApi";
import styles from "./RatingCard.module.scss";
import { trackEvent } from "../../../utils/analytics";

const RatingCard = ({ ticketId }) => {
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [rateTicket, { isLoading }] = useRateTicketMutation();

  const handleRating = async (star) => {
    setRating(star);
    if (!ticketId) return;
    try {
      await rateTicket({ ticketId, rating: star, feedback: "" }).unwrap();
      setRated(true);
      trackEvent("support_ticket_rating_given", { ticket_id: ticketId, rating: star });
    } catch {
      // error handled by privateRequestNew
    }
  };

  return (
    <div className={styles.ratingCardOuter}>
      <div className={styles.ratingCardInner}>
        <div className={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={styles.starButton}
              onClick={() => !rated && !isLoading && handleRating(star)}
              disabled={rated || isLoading}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 48 48"
                fill={star <= rating ? "#FF9D7E" : "#FFD4C4"}
              >
                <path d="M24 4L28.944 18.528H44.472L32.264 27.472L37.208 42L24 33.056L10.792 42L15.736 27.472L3.528 18.528H19.056L24 4Z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <p className={styles.ratingText}>
        {rated ? "Thank you for your feedback!" : "Please Rate your Experience"}
      </p>
    </div>
  );
};

export default RatingCard;
