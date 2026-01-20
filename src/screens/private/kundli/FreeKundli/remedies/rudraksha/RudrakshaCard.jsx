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
      <PrimaryText className={styles.title}>{name}</PrimaryText>

      <div className={styles.section}>
        <PrimaryText className={styles.label}>Description:</PrimaryText>
        <PrimaryText className={styles.value}>{mukhi_description}</PrimaryText>
      </div>

      <div className={styles.section}>
        <PrimaryText className={styles.label}>For Disease Cure:</PrimaryText>
        <div className={styles.valueBadges}>
          {mukhi_for_disease_cure?.map((num, index) => (
            <PrimaryText key={index} className={styles.badgeRed}>
              {num} Mukhi
            </PrimaryText>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PrimaryText className={styles.label}>
          For Money & Prosperity:
        </PrimaryText>
        <div className={styles.valueBadges}>
          {mukhi_for_money?.map((num, index) => (
            <PrimaryText key={index} className={styles.badgeGreen}>
              {num} Mukhi
            </PrimaryText>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PrimaryText className={styles.label}>
          AI Recommendation:
        </PrimaryText>
        <PrimaryText className={styles.botResponse}>
          {bot_response}
        </PrimaryText>
      </div>
    </div>
  );
};

export default RudrakshaCard;
