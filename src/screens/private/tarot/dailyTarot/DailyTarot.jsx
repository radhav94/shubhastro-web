import React, { useEffect, useRef, useState } from "react";
import TarotCard from "../card/TarotCard";
import { useGetTarotDailyDataQuery } from "../../../../redux/api/tarot/tarotApi";
import styles from "./DailyTarot.module.scss";

export const dailyTarotCardMap = [
  "the_fool",
  "the_magician",
  "the_high_priestess",
  "the_empress",
  "the_emperor",
  "the_hierophant",
  "the_lovers",
  "the_chariot",
  "strength",
  "the_hermit",
  "wheel_of_fortune",
  "justice",
  "the_hanged_man",
  "death",
  "temperance",
  "the_devil",
  "the_tower",
  "the_star",
  "the_moon",
  "the_sun",
  "judgement",
  "the_world",
];

const DailyTarot = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const resultRef = useRef(null);

  const cardName =
    selectedCard !== null ? dailyTarotCardMap[selectedCard] : null;

  const { data, isLoading } = useGetTarotDailyDataQuery(
    { card_name: cardName, lang: "en" },
    { skip: !cardName }
  );

  const response = data?.response;
  useEffect(() => {
    if (response && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }, [response]);

  return (
    <div className={styles.dailyWrapper}>
      <TarotCard
        title="Daily Tarot Reading"
        cardsCount={11}
        onSelect={(index) => setSelectedCard(index)}
      />

      {/* RESULT BOX */}
      {response && (
        <div ref={resultRef} className={styles.resultContainer}>
          {/* LEFT: CARD WITH TITLE */}
          <div className={styles.leftCard}>
            <h3 className={styles.cardName}>{response.name}</h3>
            <img
              src={response.card_image.classic}
              alt={response.name}
              className={styles.cardImg}
            />
          </div>

          {/* RIGHT: DAILY MEANINGS */}
          <div className={styles.rightContent}>
            <h2 className={styles.readingHeader}>Your Daily Tarot Insight</h2>

            <div className={styles.section}>
              <h3>💪 Health</h3>
              <p>{response.health}</p>
            </div>

            <div className={styles.section}>
              <h3>❤️ Relationship</h3>
              <p>{response.relationship}</p>
            </div>

            <div className={styles.section}>
              <h3>💼 Career</h3>
              <p>{response.career}</p>
            </div>

            <div className={styles.section}>
              <h3>💰 Finance</h3>
              <p>{response.finance}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTarot;
