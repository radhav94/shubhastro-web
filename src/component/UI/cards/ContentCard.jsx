import React from "react";
import PrimaryText from "../../PrimaryText";
import styles from "./ContentCard.module.scss";
import { appColors } from "../../../utils/theme";
import TTSButton from "../TTSButton";

const ContentCard = ({
  title,
  date = null,
  description,
  bgColor = "#ffffff",
  showDate = false,
  className = "",
  isDailyHoroscope = false,
  zodiacData,
  singleRow = false,
}) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build full TTS text from all card content
  const ttsText = (() => {
    const parts = [];
    if (title) parts.push(title);
    if (description) parts.push(description);
    if (isDailyHoroscope && zodiacData?.length) {
      parts.push(zodiacData.map((d) => `${d.label}: ${d.value}`).join('. '));
    }
    return parts.join('. ');
  })();

  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className={styles.header}>
        <PrimaryText isExtraBold size_20>
          {title}
        </PrimaryText>

        <TTSButton text={ttsText} />
      </div>

      {showDate && (
        <PrimaryText className={styles.date}>
          {date || currentDate}
        </PrimaryText>
      )}

      <PrimaryText size_14 className={styles.description}>
        {description}
      </PrimaryText>

      {isDailyHoroscope && zodiacData && (
        <div className={styles.zodiacFlex}>
          {singleRow
            ? zodiacData.map((item) => (
                <div key={item.id} className={styles.zodiacRow}>
                  <div className={styles.zodiacItem}>
                    <PrimaryText className={styles.label}>
                      {item.label}
                    </PrimaryText>
                    <PrimaryText className={styles.value}>
                      {item.value}
                    </PrimaryText>
                  </div>
                </div>
              ))
            : zodiacData.map((item, index) => {
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
                return null;
              })}
        </div>
      )}
    </div>
  );
};

export default ContentCard;
