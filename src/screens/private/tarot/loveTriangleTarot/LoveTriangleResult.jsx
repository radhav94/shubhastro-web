import React from "react";
import styles from "../resultTarot/ResultTarot.module.scss";

const LoveTriangleResult = ({ resultData, userName = "", handleReset }) => {
  if (!resultData) return null;

  const { self, lover1, lover2 } = resultData;

  // Trait chips UI
  const TraitChips = ({ traits }) => {
    if (!traits || traits.length === 0) return null;

    return (
      <div style={chipContainerStyle}>
        {traits.map((trait, index) => (
          <span key={index} style={chipStyle}>
            {trait}
          </span>
        ))}
      </div>
    );
  };

  const renderCard = (label, card) => (
    <div className={styles.tarotCard} style={{ marginBottom: "32px" }}>
      {/* LEFT IMAGE */}
      <div className={styles.tarotLeft}>
        <img
          src={card?.card_image?.classic}
          alt={card?.name}
          className={styles.cardImage}
        />
      </div>

      {/* RIGHT CONTENT */}
      <div className={styles.tarotRight}>
        <h2 style={{ marginBottom: "10px" }}>{label}</h2>

        <h3 className={styles.cardName}>{card?.name}</h3>

        {/* CHIP TRAITS */}
        <TraitChips traits={card?.traits} />

        <p className={styles.cardDescription}>{card?.description}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.resultContainer} style={{ flexDirection: "column" }}>
      {userName && <h1 className={styles.userTitle}>Hi {userName}</h1>}

      {renderCard("You", self)}
      {renderCard("Lover 1", lover1)}
      {renderCard("Lover 2", lover2)}

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className={styles.actionButton} onClick={handleReset}>
          Ask Another Question
        </button>
      </div>
    </div>
  );
};

export default LoveTriangleResult;

const chipContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "12px 0 16px 0",
};

const chipStyle = {
  padding: "6px 14px",
  background: "rgba(255, 182, 193, 0.5)", // subtle glass look
  borderRadius: "20px",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  fontSize: "13px",
  letterSpacing: "0.3px",
  display: "inline-flex",
};
