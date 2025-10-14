import React, { useState } from "react";
import styles from "./TarotReadingCard.module.scss";

const TarotReadingCard = ({
  title = "Get Your One Card Prediction",
  field = "name",
  onClickBtn,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    question: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onClickBtn(e);
  };

  const fieldLabelMap = {
    name: "Full Name",
    dob: "Date of Birth",
    question: "Your Question",
  };

  const fieldPlaceholderMap = {
    name: "Enter your full name",
    dob: "",
    question: "Ask about love, career, etc.",
  };

  return (
    <div>
      <div className={styles.cardContainer}>
        <h2 className={styles.title}>{title}</h2>
        <form onSubmit={handleSubmit} className={styles.tarotForm}>
          <div className={styles.formGroup}>
            <label htmlFor={field}>{fieldLabelMap[field]}</label>
            <input
              type={field === "dob" ? "date" : "text"}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleInputChange}
              placeholder={fieldPlaceholderMap[field]}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Get My Reading
          </button>
        </form>
      </div>
    </div>
  );
};

export default TarotReadingCard;
