import React from "react";
import styles from "./PanchangCard.module.scss";
import { getMuhuratIcon, MUHURAT_FALLBACK_ICON } from "../../../utils/muhuratIcons";

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
              <h3 className={styles.muhuratHeading}>
                {/* alt="" — the heading text right next to it is already the
                    muhurat name, so a filled alt read it out twice. */}
                <img
                  src={getMuhuratIcon(m.title)}
                  alt=""
                  width="28"
                  height="28"
                  loading="lazy"
                  className={styles.muhuratIcon}
                  onError={(e) => { e.target.onerror = null; e.target.src = MUHURAT_FALLBACK_ICON; }}
                />
                {m.title}
              </h3>
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
