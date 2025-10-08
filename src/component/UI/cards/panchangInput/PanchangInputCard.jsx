import React from "react";
import styles from "./PanchangInputCard.module.scss";

const PanchangInputCard = ({
  imageSrc,
  title,
  dob,
  setDob,
  location,
  setLocation,
  onSubmit,
}) => {
  return (
    <div className={styles.panchangWidget}>
      <div className={styles.leftSide}>
        <img src={imageSrc} alt="Panchang Widget" />
      </div>

      <div className={styles.rightSide}>
        {title && <h3 className={styles.title}>{title}</h3>}

        <div className={styles.inputsContainer}>
          <div className={styles.inputBox}>
            <label className={styles.label}>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max="2035-12-31"
            />
          </div>

          <div className={styles.inputBox}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              placeholder="Place of Birth"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <button className={styles.submitButton} onClick={onSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default PanchangInputCard;
