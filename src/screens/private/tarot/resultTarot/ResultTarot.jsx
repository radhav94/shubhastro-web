import React from "react";
import styles from "./ResultTarot.module.scss";
import TTSButton from "../../../../component/UI/TTSButton";

const ResultTarot = ({ card, userName = "", onReset }) => {
  if (!card || Object.keys(card).length === 0) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.noDataWrapper}>
          <div className={styles.noDataIcon}>🔮</div>
          <h2 className={styles.noDataTitle}>No Tarot Card Drawn</h2>
          <p className={styles.noDataText}>
            The universe is quiet right now. Ask a question to reveal your tarot
            card.
          </p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={onReset}
          >
            Ask Another Tarot Question
          </button>
        </div>
      </div>
    );
  }

  const allText = [card.meaning, card.description].filter(Boolean).join(". ");

  return (
    <div className={styles.resultContainer}>
      <div className={styles.tarotCard}>
        <div className={styles.tarotLeft}>
          <img
            src={card?.card_image?.classic}
            alt={card.name}
            className={styles.cardImage}
          />
        </div>
        <div className={styles.tarotRight}>
          {userName && <h1>Hi {userName}</h1>}
          <h2>
            {card.name}
            {card.isUpright && (
              <span className={styles.cardPosition}>
                The card is {card.isUpright ? "upright" : "reversed"}
              </span>
            )}
          </h2>
          {allText && (
            <div className={styles.sectionHeader}>
              <span>📖 Reading and Guidance</span>
              <TTSButton text={`Reading and Guidance. ${allText}`} />
            </div>
          )}
          <p>{card.meaning}</p>
          <p>{card.description}</p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={onReset}
          >
            Ask Another Tarot Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultTarot;
