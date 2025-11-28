import React, { useState } from "react";
import styles from "./TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";
import { PrimaryText } from "../../../../component";

const TarotCard = ({ title, cardsCount = 11, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const cards = Array.from({ length: cardsCount }, (_, i) => i);

  const handleSelect = (index) => {
    setSelectedIndex(index);
    if (onSelect) onSelect(index);
  };

  return (
    <>
      <PrimaryText isBold isCenter size_28>
        {title}
      </PrimaryText>

      <div className={styles.wrapper}>
        <div className={styles.fanWrapper}>
          {cards.map((cardIndex, i) => (
            <div
              key={i}
              className={`${styles.card} ${
                selectedIndex === cardIndex ? styles.active : ""
              }`}
              style={{ left: `${i * 34}px` }}
              onClick={() => handleSelect(cardIndex)}
            >
              <img src={AppImages.tarotCard} alt="tarot" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TarotCard;
