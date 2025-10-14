import React, { useState, useEffect } from "react";
import Modal from "../Modal"; // Your existing Modal component
import styles from "./TarotCardModal.module.scss";

// Note: I've added one more card to ensure the spread can have 5 cards.
const tarotCardsData = [
  {
    id: 1,
    name: "The Fool",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/RWS_Tarot_00_Fool.jpg/300px-RWS_Tarot_00_Fool.jpg",
    meaning: "Beginnings, innocence, spontaneity, a free spirit.",
  },
  {
    id: 2,
    name: "The Magician",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RWS_Tarot_01_Magician.jpg/300px-RWS_Tarot_01_Magician.jpg",
    meaning: "Manifestation, resourcefulness, power, inspired action.",
  },
  {
    id: 3,
    name: "The High Priestess",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/300px-RWS_Tarot_02_High_Priestess.jpg",
    meaning: "Intuition, sacred knowledge, divine feminine, the subconscious.",
  },
  {
    id: 4,
    name: "The Empress",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/RWS_Tarot_03_Empress.jpg/300px-RWS_Tarot_03_Empress.jpg",
    meaning: "Fertility, femininity, beauty, nature, abundance.",
  },
  {
    id: 5,
    name: "The Emperor",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/RWS_Tarot_04_Emperor.jpg/300px-RWS_Tarot_04_Emperor.jpg",
    meaning: "Authority, structure, control, father figure.",
  },
];

const TarotCardModal = ({ isOpen, onClose, onGetDetails }) => {
  const [cards, setCards] = useState([]);
  const [chosenCardId, setChosenCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const dealCards = () => {
    const shuffled = [...tarotCardsData].sort(() => 0.5 - Math.random());
    setCards(shuffled.slice(0, 5));
    setChosenCardId(null);
    setIsRevealed(false);
  };

  useEffect(() => {
    if (isOpen) {
      dealCards();
    }
  }, [isOpen]);

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      dealCards();
      setIsShuffling(false);
    }, 1000);
  };

  const handleCardClick = (cardId) => {
    if (!chosenCardId) {
      setChosenCardId(cardId);
      setTimeout(() => {
        setIsRevealed(true);
      }, 1000);
    }
  };

  // Renamed for clarity: This function starts a new reading inside the modal.
  const handleNewReading = () => {
    handleShuffle();
  };

  // New handler for the details button
  const handleGetDetails = () => {
    const chosenCard = tarotCardsData.find((card) => card.id === chosenCardId);
    if (chosenCard) {
      onGetDetails(chosenCard);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal modalOpen={isOpen} onClose={onClose}>
      <div
        className={`${styles.tarotModalContent} ${
          chosenCardId ? styles.cardIsChosen : ""
        }`}
      >
        <button onClick={onClose} className={styles.closeButton}>
          &times;
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {chosenCardId ? "Your Chosen Card" : "Choose Your Card"}
          </h2>
          {!chosenCardId && (
            <p className={styles.instruction}>
              Select a card or shuffle the deck.
            </p>
          )}
        </div>

        <div
          className={`${styles.cardTable} ${
            isShuffling ? styles.shuffling : ""
          }`}
        >
          {cards.map((card, index) => {
            const isChosen = chosenCardId === card.id;
            const cardClasses = `${styles.cardWrapper} ${
              isChosen ? styles.chosen : ""
            } ${isRevealed && isChosen ? styles.revealed : ""}`;
            return (
              <div
                key={card.id}
                className={cardClasses}
                style={{ "--delay": `${index * 100}ms` }}
                onClick={() => handleCardClick(card.id)}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}></div>
                  <div className={styles.cardBack}>
                    <img
                      src={card.image}
                      alt={card.name}
                      className={styles.cardImage}
                    />
                    <h3 className={styles.cardName}>{card.name}</h3>
                    <p className={styles.cardMeaning}>{card.meaning}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.controls}>
          {!chosenCardId && (
            <button
              onClick={handleShuffle}
              className={styles.actionButton}
              disabled={isShuffling}
            >
              Shuffle Again
            </button>
          )}
          {isRevealed && (
            <>
              <button
                onClick={handleNewReading}
                className={styles.actionButton}
              >
                Another Reading
              </button>
              <button
                onClick={handleGetDetails}
                className={`${styles.actionButton} ${styles.secondary}`}
              >
                Get Details
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TarotCardModal;
