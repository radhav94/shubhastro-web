import React from "react";
import PrimaryText from "../../PrimaryText";
import styles from "./ContentCard.module.scss";
import { appColors } from "../../../utils/theme";

const ContentCard = ({
  title,
  date = null,
  description,
  bgColor = "#ffffff",
  showDate = false,
  className = "",
  isDailyHoroscope = false,
  zodiacData,
}) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className={styles.header}>
        <PrimaryText isExtraBold size_20>
          {title}
        </PrimaryText>

        {showDate && (
          <PrimaryText className={styles.date}>
            {date || currentDate}
          </PrimaryText>
        )}
      </div>

      <PrimaryText size_14>{description}</PrimaryText>
      {isDailyHoroscope && zodiacData && (
        <div className={styles.zodiacFlex}>
          {zodiacData.map((item, index) => {
            // Only start a new row every 2 items
            if (index % 2 === 0) {
              const first = item;
              const second = zodiacData[index + 1];

              return (
                <div key={index} className={styles.zodiacRow}>
                  <div className={styles.zodiacItem}>
                    <PrimaryText className={styles.label}>
                      {first.label}
                    </PrimaryText>
                    <PrimaryText className={styles.value}>
                      {first.value}
                    </PrimaryText>
                  </div>

                  {second && (
                    <div className={styles.zodiacItem}>
                      <PrimaryText className={styles.label}>
                        {second.label}
                      </PrimaryText>
                      <PrimaryText className={styles.value}>
                        {second.value}
                      </PrimaryText>
                    </div>
                  )}
                </div>
              );
            }
            return null; // skip odd indexes
          })}
        </div>
      )}
    </div>
  );
};

export default ContentCard;
