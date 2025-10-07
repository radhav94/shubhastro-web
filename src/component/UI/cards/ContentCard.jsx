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
      {isDailyHoroscope && (
        <>
          <div className={styles.zodiacFlex}>
            {zodiacData.map((group, index) => (
              <div key={index} className={styles.zodiacFlexBox}>
                <table className={styles.billTable}>
                  <tbody>
                    {group.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.label}</td>
                        <td>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <PrimaryText isExtraBold size_20>
            Remedy
          </PrimaryText>
          <PrimaryText>Meditate for clarity</PrimaryText>
        </>
      )}
    </div>
  );
};

export default ContentCard;
