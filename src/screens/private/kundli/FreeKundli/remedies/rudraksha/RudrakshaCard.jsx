import React from "react";
import styles from "./Rudraksha.module.scss";
import PrimaryText from "../../../../../../component/PrimaryText";

const RudrakshaCard = ({ data }) => {
  if (!data) return null;

  const {
    name,
    mukhi_description,
    mukhi_for_disease_cure,
    mukhi_for_money,
    bot_response,
  } = data;

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{name}</h1>

      <div className={styles.section}>
        <h2 className={styles.label}>Description:</h2>
        <p className={styles.value}>{mukhi_description}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.label}>For Disease Cure:</h2>
        <div className={styles.valueBadges}>
          {mukhi_for_disease_cure?.map((num, index) => (
            <PrimaryText key={index} className={styles.badgeRed}>
              {num} Mukhi
            </PrimaryText>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.label}>
          For Money & Prosperity:
        </h2>
        <div className={styles.valueBadges}>
          {mukhi_for_money?.map((num, index) => (
            <PrimaryText key={index} className={styles.badgeGreen}>
              {num} Mukhi
            </PrimaryText>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.label}>
          AI Recommendation:
        </h2>
        <p className={styles.botResponse}>
          {bot_response}
        </p>
      </div>
    </div>
  );
};

export default RudrakshaCard;
