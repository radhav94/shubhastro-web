import React from "react";
import styles from "./PanchangCard.module.scss";

const PanchangCards = ({ title, data = [], summary, muhratData }) => {
  return (
    <div className={styles.cardContainer}>
      {title && <h2 className={styles.title}>{title}</h2>}

      {/* Summary Section */}
      {summary && <p className={styles.summary}>{summary}</p>}

      {/* Data Section */}
      {data.length > 0 && (
        <div className={styles.gridBox}>
          {data.map((item, idx) => (
            <div className={styles.row} key={idx}>
              <div className={styles.left}>
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.key}</span>
              </div>

              <div className={styles.value}>{item.value || "-"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Muhurat Section */}
      {muhratData && (
        <div className={styles.muhuratContainer}>
          {Object.values(muhratData).map((m, i) => (
            <div className={styles.muhuratBox} key={i}>
              <h3>{m.title}</h3>
              <p>
                <strong>Start:</strong> {m.start}
              </p>
              <p>
                <strong>End:</strong> {m.end}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanchangCards;
