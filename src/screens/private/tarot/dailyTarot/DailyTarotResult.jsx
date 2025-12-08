import React from "react";
import styles from "../resultTarot/ResultTarot.module.scss";

const DailyTarotResult = ({ card, onReset  }) => {
  const { name, card_image, health, relationship, career, finance } = card;

  return (
    <div className={styles.resultContainer} style={{ flexDirection: "column" }}>

      {/* LEFT: Tarot Card */}
      <div className={styles.tarotCard} style={{ marginBottom: "30px" }}>
        <div className={styles.tarotLeft}>
          <img src={card_image?.classic} alt={name} className={styles.cardImage} />
        </div>

        {/* RIGHT: Daily Meanings */}
        <div className={styles.tarotRight}>
          <h2 className={styles.cardName}>{name}</h2>

          <div className={styles.section}>
            <h3>💪 Health</h3>
            <p>{health}</p>
          </div>

          <div className={styles.section}>
            <h3>❤️ Relationship</h3>
            <p>{relationship}</p>
          </div>

          <div className={styles.section}>
            <h3>💼 Career</h3>
            <p>{career}</p>
          </div>

          <div className={styles.section}>
            <h3>💰 Finance</h3>
            <p>{finance}</p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className={styles.actionButton} onClick={onReset}>
          ↻ New Daily Reading
        </button>
      </div>
    </div>
  );
};

export default DailyTarotResult;
