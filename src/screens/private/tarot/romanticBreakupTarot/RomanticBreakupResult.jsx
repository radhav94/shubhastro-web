import React from "react";
import styles from "../resultTarot/ResultTarot.module.scss";
import TTSButton from "../../../../component/UI/TTSButton";

const RomanticBreakupResult = ({ resultData, userName = "", handleReset }) => {
  if (!resultData) return null;

  const { cause, advise } = resultData;

  const renderCard = (title, card) => (
    <div className={styles.tarotCard} style={{ marginBottom: "30px" }}>
      {/* Left Card Image */}
      <div className={styles.tarotLeft}>
        <img
          src={card?.card_image?.artwork || card?.card_image?.classic}
          alt={card?.name}
          className={styles.cardImage}
        />
      </div>

      {/* Right content */}
      <div className={styles.tarotRight}>
        <h2 style={{ marginBottom: "10px" }}>{title}</h2>
        <h3 className={styles.cardName}>{card?.name}</h3>

        {card?.description && (
          <div className={styles.sectionHeader} style={{ marginBottom: "8px" }}>
            <span>📖 Reading</span>
            <TTSButton text={`Reading. ${card.description}`} />
          </div>
        )}
        <p className={styles.cardDescription}>{card?.description}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.resultContainer} style={{ flexDirection: "column" }}>
      {userName && <h1 className={styles.userTitle}>Hi {userName}</h1>}

      {/* Why the breakup happened */}
      {renderCard("Cause of Breakup", cause)}

      {/* Advice for moving forward */}
      {renderCard("Advice for You", advise)}

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className={styles.actionButton} onClick={handleReset}>
          Ask Another Tarot Question
        </button>
      </div>
    </div>
  );
};

export default RomanticBreakupResult;
