import React, { useState } from "react";
import "./SingleCallHistory.scss";

const SingleCallHistory = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  return (
    <div className="call-details-page">
      {/* Breadcrumb */}
   

      {/* Title */}
      <div className="page-title">Call Details</div>

      {/* Call Card */}
      <div className="call-card">
        <div className="call-card__left">
          <h4>Order Id: #1764325752680140</h4>

          <p>
            <strong>Expert Name:</strong> Indrayan
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="status">Completed</span>
          </p>
          <p>28 Nov 25, 03:59 PM</p>
          <p>Duration: 1 minutes</p>
          <p>Price: ₹ 18/min</p>
          <p>Deduction: ₹ 0</p>

          {/* Audio */}
          <audio controls className="audio-player">
            <source src="" />
          </audio>
        </div>

        <div className="call-card__right">
          <img
            src="https://via.placeholder.com/60"
            alt="Astrologer"
          />
        </div>
      </div>

      {/* Review Card */}
      <div className="review-card">
        <h3>Your Review</h3>

        {/* Stars */}
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= rating ? "star active" : "star"}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          placeholder="Write your review here..."
          maxLength={160}
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <div className="review-footer">
          <span>{review.length}/160</span>
          <button>Submit</button>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="info-banner">
        <span>
          Please tell us more about the Astrologer! <br />
          <small>It helps us retain the best Astrologers</small>
        </span>
        <span className="arrow">›</span>
      </div>
    </div>
  );
};

export default SingleCallHistory;
