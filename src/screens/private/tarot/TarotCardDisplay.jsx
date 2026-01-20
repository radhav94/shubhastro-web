import React, { useState } from "react";
import styles from "./TarotCardDisplay.module.scss";

const TarotCardDisplay = ({ data }) => {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleCardClick = (card) => {
    const isSelected = selectedCards.find((c) => c.index === card.index);

    // unselect card
    if (isSelected) {
      setSelectedCards(selectedCards.filter((c) => c.index !== card.index));
      return;
    }

    // limit 3 cards
    if (selectedCards.length >= 3) return;

    setSelectedCards([...selectedCards, card]);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Now, pick the cards that call to you…</h2>
      <p className={styles.subTitle}>
        Select up to 3 cards • {selectedCards.length}/3 selected
      </p>

      <div className={styles.grid}>
        {data.map((card) => {
          const isSelected = selectedCards.some((c) => c.index === card.index);
          const imgSrc = isSelected
            ? card.card_image.artwork
            : card.card_images_back.ghibli_sun;

          return (
            <div
              key={card.index}
              className={`${styles.card} ${isSelected ? styles.flipped : ""}`}
              onClick={() => handleCardClick(card)}
            >
              <img src={imgSrc} alt="tarot" />
            </div>
          );
        })}
      </div>

      {/* {selectedCards.length > 0 && (
        <button className={styles.revealButton}>
          Reveal Your Reading
        </button>
      )} */}
    </div>
  );
};

export default TarotCardDisplay;
