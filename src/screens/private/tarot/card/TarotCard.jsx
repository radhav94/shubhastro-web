import React, { useState } from "react";
import styles from "./TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";
import { PrimaryText } from "../../../../component";
import { useGetTarotShuffleDataQuery } from "../../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const TarotCard = ({ title, subtitle="", onSelect, shuffleType = "both" }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const { data, isLoading } = useGetTarotShuffleDataQuery({
    shuffle_type: shuffleType,
    lang: "en",
  });

  if (isLoading) return <PrimaryLoader />;

  const handleSelect = (index, cardData) => {
    
    setSelectedIndex(index);
    if (onSelect) onSelect(cardData || null);
  };

  return (
    <>
      <PrimaryText isBold isCenter size_28>
        {title}
      </PrimaryText>
      {subtitle && <p className={styles.description}>{subtitle}</p>}


      <div className={styles.wrapper}>
        <div className={styles.fanWrapper}>
          {data?.response?.map((card, i) => (
            <div
              key={i}
              className={`${styles.card} ${
                selectedIndex === i ? styles.active : ""
              }`}
              style={{ left: `${i * 34}px` }}
              onClick={() => handleSelect(i, card)}
            >
              <img src={AppImages.tarotCard} alt="tarot" />
            </div>
          ))}
        </div>
        
        {/* Selected Card Indicator */}
        {selectedIndex !== null && (
          <div className={styles.selectionIndicator}>
            <p>Card selected! Ready to reveal your reading.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default TarotCard;