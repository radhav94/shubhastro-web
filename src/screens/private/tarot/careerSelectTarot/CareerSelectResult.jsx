import React from "react";
import styles from "../resultTarot/ResultTarot.module.scss";

const CareerSelectResult = ({ card, onReset }) => {
  if (!card) return null;

  const {
    name,
    card_image,
    direction,
    description,
    careerPaths,
    strengths,
    challenges,
    advice,
  } = card;

  return (
    <div className={styles.resultContainer} style={{ flexDirection: "column" }}>

      {/* CARD DISPLAY */}
      <div className={styles.tarotCard} style={{ marginBottom: "30px" }}>
        <div className={styles.tarotLeft}>
          <img src={card_image?.classic} alt={name} className={styles.cardImage} />
          <div className={styles.directionBadge}>
            {direction === "upright" ? "🔼 Upright" : "🔽 Reversed"}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className={styles.tarotRight}>
          <h2 className={styles.cardName}>{name}</h2>

          <div className={styles.section}>
            <h3>📝 Overview</h3>
            <p>{description}</p>
          </div>

          <div className={styles.section}>
            <h3>🎯 Career Paths</h3>
            {careerPaths && careerPaths.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {careerPaths.map((path, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#3f51b5",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    {path}
                  </span>
                ))}
              </div>
            ) : (
              <p>No specific career paths identified.</p>
            )}
          </div>

          {strengths && (
            <div className={styles.section}>
              <h3>💪 Strengths to Leverage</h3>
              <p>{strengths}</p>
            </div>
          )}

          {challenges && (
            <div className={styles.section}>
              <h3>⚠️ Potential Challenges</h3>
              <p>{challenges}</p>
            </div>
          )}

          {advice && (
            <div className={styles.section}>
              <h3>💡 Professional Advice</h3>
              <p>{advice}</p>
            </div>
          )}
        </div>
      </div>

      {/* RESET BUTTON */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className={styles.actionButton} onClick={onReset}>
          ↻ New Career Reading
        </button>
      </div>
    </div>
  );
};

export default CareerSelectResult;
