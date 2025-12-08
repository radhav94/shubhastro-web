import { useEffect, useRef, useState } from "react";
import TarotCard from "../card/TarotCard";
import styles from "../card/TarotCards.module.scss";

const CommonTarot = ({
  title,
  shuffleType = "major",
  subTitle = "",
  ResultComponent,
  apiHook,
  buildParams, 
  lang = "en",
}) => {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef(null);

  // dynamically prepare params
  const queryParams = buildParams({
    selected,
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

  const handleCardSelect = (card) => {
    setSelected(card);
    setRevealed(false);
  };

  const handleReveal = () => selected && setRevealed(true);
  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <>
      <TarotCard
        title={title}
        subtitle={subTitle}
        onSelect={handleCardSelect}
        shuffleType={shuffleType}
      />

      {/* Reveal Button */}
      {selected && !revealed && (
        <div className={styles.revealSection}>
          <p className={styles.selectedMessage}>✨ You have selected a card ✨</p>
          <p className={styles.instruction}>Click below to reveal your reading</p>

          <div className={styles.buttonGroup}>
            <button onClick={handleReveal} className={styles.revealButton}>
              Reveal My Reading
            </button>

            <button onClick={handleReset} className={styles.resetButton}>
              Choose Different Card
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {revealed && data && (
        <div ref={resultRef} className={styles.resultContainer}>
          <ResultComponent card={data?.response} onReset={handleReset} />
        </div>
      )}
    </>
  );
};

export default CommonTarot;
