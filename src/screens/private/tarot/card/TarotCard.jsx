import React, { useState, useRef } from "react";
import styles from "./TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";
import { usePostYesNoTarotQuery } from "../../../../redux/api/tarot/astroTarotApi";

const TarotCard = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const contentRef = useRef(null);
  const cards = Array.from({ length: 22 }, (_, i) => i);

  const payload =
    selectedIndex !== null ? { tarot_id: selectedIndex + 1 } : undefined;

  const { data, isLoading } = usePostYesNoTarotQuery(payload, {
    skip: selectedIndex === null,
  });

  const handleSelect = (index) => {
    setSelectedIndex(index);
    if (onSelect) onSelect(index);

    setTimeout(() => {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  return (
    <div className={styles.wrapper}>
      {/* Card Fan */}
      <div className={styles.fanWrapper}>
        {cards.map((cardIndex, i) => (
          <div
            key={i}
            className={`${styles.card} ${
              selectedIndex === cardIndex ? styles.active : ""
            }`}
            style={{
              transform: `rotate(${i - 10}deg) translateY(${Math.abs(
                i - 10
              )}px)`,
              left: `${i * 40}px`,
            }}
            onClick={() => handleSelect(cardIndex)}
          >
            <img src={AppImages.tarotCard} alt="tarot" />
          </div>
        ))}
      </div>

      {/* Selected Tarot Content */}
      {selectedIndex !== null && data && (
        <div ref={contentRef} className={styles.resultContainer}>
          {/* LEFT SIDE — CARD IMAGE */}
          <div className={styles.cardPreview}>
            <p className={styles.cardTitle}>{data?.name}</p>
            <img
              src={AppImages.tarotCard}
              alt={data?.name}
              className={styles.previewImg}
            />
          </div>

          {/* RIGHT SIDE — RESULT TEXT */}
          <div className={styles.cardContent}>
            <h2 className={styles.readingTitle}>{data?.name}</h2>

            <p className={styles.readingValue}>{data?.value}</p>

            <p className={styles.readingDescription}>{data?.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotCard;
