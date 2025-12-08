import { useEffect, useRef, useState } from "react";
import TarotCard from "../card/TarotCard";
import styles from "../card/TarotCards.module.scss";

const MultiPickTarot = ({
  title,
  subtitle,
  cardsCount = 22,
  shuffleType = "major",
  maxSelectableCards = 3,
  apiHook,
  ResultComponent,
  buildParams,
  lang = "en",
}) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef(null);

  const handleCardSelect = (card) => {
    if(revealed) return;
    setRevealed(false);

    setSelectedCards((prev) => {
      // prevent duplicate picks
      if (prev.some((c) => c?.id === card?.id)) return prev;

      // allow only till max allowed
      if (prev.length < maxSelectableCards) return [...prev, card];

      return prev;
    });
  };

  const handleReset = () => {
    setSelectedCards([]);
    setRevealed(false);
  };

  const handleReveal = () => {
    if (selectedCards.length === maxSelectableCards) {
      setRevealed(true);
    }
  };

  const queryParams = buildParams({
    selectedCards,
    lang,
    revealed,
  });

  const { data, isLoading, error } = apiHook(queryParams, {
    skip: !revealed || !queryParams,
  });

  useEffect(() => {
    if (data && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [data]);

  return (
    <>
      <TarotCard
        title={title}
        subtitle={subtitle}
        cardsCount={cardsCount}
        shuffleType={shuffleType}
        onSelect={handleCardSelect}
      />

      {selectedCards.length > 0 && !revealed && (
        <div className={styles.revealSection}>
          <p className={styles.selectedMessage}>
            {selectedCards.length}/{maxSelectableCards} cards selected
          </p>

          {selectedCards.length < maxSelectableCards ? (
            <p className={styles.instruction}>
              Pick {maxSelectableCards - selectedCards.length} more card(s)
            </p>
          ) : (
            <p className={styles.instruction}>All cards selected! Reveal now.</p>
          )}

          <div className={styles.buttonGroup}>
            {selectedCards.length === maxSelectableCards && (
              <button className={styles.revealButton} onClick={handleReveal}>
                Reveal Reading
              </button>
            )}

            <button className={styles.resetButton} onClick={handleReset}>
              Reset Selection
            </button>
          </div>
        </div>
      )}

      {revealed && data && (
        <div className={styles.resultContainer}  ref={resultRef}>
          <ResultComponent
            resultData={data?.response}
            handleReset={handleReset} 
          />
        </div>
      )}
    </>
  );
};

export default MultiPickTarot;
