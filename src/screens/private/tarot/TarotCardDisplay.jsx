import { useState } from "react";
import styles from "./TarotCardDisplay.module.scss";
import tarotCardsColorImg from "../../../assets/images/tarotCard.png";

// Background images from public folder
const tarotBgSimple = "/images/tarot-card-bg-simple.png";
const tarotBgDecorative = "/images/tarot-card-bg-simple.png"; // Using same image for now until decorative is uploaded

const TarotCardDisplay = ({ data }) => {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleCardClick = (card) => {
    const isSelected = selectedCards.find((c) => c.index === card.index);

    if (isSelected) {
      setSelectedCards(selectedCards.filter((c) => c.index !== card.index));
      return;
    }

    if (selectedCards.length >= 3) return;

    setSelectedCards([...selectedCards, card]);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Let the Cards Guide You</h2>
      <p className={styles.subTitle}>
        Discover insights into love, career and life through tarot readings. Select a card below to reveal your reading.
      </p>

      <div className={styles.grid}>
        {data.map((card) => {
          const isSelected = selectedCards.some((c) => c.index === card.index);
          const isPaid = card.is_paid || false;
          const hasDecorativeBorder = isPaid; // Paid cards get decorative border

          return (
            <div
              key={card.index}
              className={`${styles.card} ${isSelected ? styles.selected : ""} ${hasDecorativeBorder ? styles.decorativeCard : styles.simpleCard}`}
              onClick={() => handleCardClick(card)}
              style={{
                backgroundImage: `url(${hasDecorativeBorder ? tarotBgDecorative : tarotBgSimple})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            >
              {hasDecorativeBorder && (
                <>
                  {/* Decorative border elements for paid cards */}
                  <div className={styles.leftDecor}>
                    <span className={styles.hand}>🙏</span>
                    <span className={styles.star}>✦</span>
                    <span className={styles.plus}>+</span>
                    <span className={styles.star}>✦</span>
                    <span className={styles.plus}>+</span>
                    <span className={styles.dot}>·</span>
                  </div>
                  <div className={styles.rightDecor}>
                    <span className={styles.hand}>🙏</span>
                    <span className={styles.star}>✦</span>
                    <span className={styles.plus}>+</span>
                    <span className={styles.star}>✦</span>
                    <span className={styles.plus}>+</span>
                    <span className={styles.dot}>·</span>
                  </div>
                  <div className={styles.innerBorder}></div>
                </>
              )}

              <div className={styles.cardContent}>
                {/* Free/Paid badge */}
                <div className={`${styles.badge} ${isPaid ? styles.paidBadge : styles.freeBadge}`}>
                  {isPaid ? "Paid" : "Free"}
                </div>

                {/* Card title */}
                <h3 className={styles.cardTitle}>{card.title || card.name}</h3>

                {/* Tarot cards image */}
                <div className={styles.cardImageWrapper}>
                  <img 
                    src={tarotCardsColorImg} 
                    alt={card.title || "tarot"} 
                    className={`${styles.cardImage} ${!hasDecorativeBorder ? styles.grayscale : ""}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCards.length > 0 && (
        <button className={styles.revealButton}>
          Reveal Your Reading ({selectedCards.length}/3)
        </button>
      )}
    </div>
  );
};

export default TarotCardDisplay;
