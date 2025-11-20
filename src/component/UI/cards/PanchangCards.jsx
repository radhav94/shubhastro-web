import React from "react";
import styles from "./PanchangCard.module.scss";

const PanchangCards = ({ title, data, muhratData, summary }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const entries = Array.isArray(data)
    ? data.filter((item) => item?.value)
    : Object.entries(data)
        .map(([key, value]) => ({ key, value }))
        .filter((item) => Boolean(item.value));

  return (
    <>
      {/* Modern Muhrat Bar */}
      {muhratData && (
        <div className={styles.muhuratWrapper}>
          <div className={`${styles.muhuratBox} ${styles.abhijit}`}>
            <h4>{muhratData?.abhijit?.title}</h4>
            <span>
              {muhratData?.abhijit?.start} - {muhratData?.abhijit?.end}
            </span>
          </div>
          <div className={`${styles.muhuratBox} ${styles.rahukaal}`}>
            <h4>{muhratData?.rahukaal?.title}</h4>
            <span>
              {muhratData?.rahukaal?.start} - {muhratData?.rahukaal?.end}
            </span>
          </div>
        </div>
      )}

      <div className={styles.card}>
        {title && <h3 className={styles.title}>{title}</h3>}

        <div className={styles.content}>
          {entries.map((item, index) => (
            <div className={styles.item} key={index}>
              <div className={styles.left}>
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.key}>{item.key}</span>
              </div>

              <div className={styles.value}>{item.value}</div>
            </div>
          ))}
        </div>

        {summary && <p className={styles.summary}>{summary}</p>}
      </div>
    </>
  );
};

export default PanchangCards;
