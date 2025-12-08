import React from "react";
import styles from "./ResultTarot.module.scss";

// A default card object for demonstration purposes
const defaultCard = {
  name: "The Wheel",
  image:
    "https://images.astroyogi.com/astroyogi2017/english/images/cms/tarot/cards/red/23.jpg",
  meaning:
    "Almost every definition of this card indicates abundance, happiness, elevation, or luck; a change that just happens, and brings with it great joy. Encounters leading to friendship or romance are on the horizon; professional assignments come to fruition. But, this card also reminds you that you are the master of your own destiny; that it is up to you to give the wheel that first push that will start events turning to your advantage. Passivity and inertia are banned! Get moving! Romantic times are up ahead for you.",
  isUpright: true,
};

const ResultTarot = ({ card = defaultCard, userName = "", onReset }) => {
  return (
    <div className={styles.resultContainer}>
      <div className={styles.tarotCard}>
        <div className={styles.tarotLeft}>
          <img src={card?.card_image?.classic} alt={card.name} className={styles.cardImage} />
        </div>
        <div className={styles.tarotRight}>
          {userName && <h1>Hi {userName}</h1>}
          <h2>
            {card.name}
            {card.isUpright && <span className={styles.cardPosition}>
              The card is {card.isUpright ? "upright" : "reversed"}
            </span>}
          </h2>
          <p>{card.meaning}</p>
          <p>{card.description}</p>
            <button type="button" className={styles.actionButton} onClick={onReset} >
              Ask another question
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultTarot;
