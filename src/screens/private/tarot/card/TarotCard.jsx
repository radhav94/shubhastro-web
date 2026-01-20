import React, { useEffect, useState } from "react";
import styles from "./TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";
import { PrimaryText } from "../../../../component";
import { useGetTarotShuffleDataQuery } from "../../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const TarotCard = ({
  title,
  subtitle = "",
  onSelect,
  shuffleType = "both",
  multiPick = false,
  maxSelectableCards = 1,
  shuffleKey = null,
  selectedCardsCount = 0
}) => {
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // for single pick mode

  const { data, isLoading } = useGetTarotShuffleDataQuery({
    shuffle_type: shuffleType,
    lang: "en",
    key: shuffleKey
  }, { refetchOnMountOrArgChange : true});

  useEffect(() => {
    // Reset selected indexes (multi-pick)
    setSelectedIndexes([]);

    // Reset selected index (single pick)
    setSelectedIndex(null);
}, [shuffleKey]);

  if (isLoading) return <PrimaryLoader />;

const handleSelect = (index, cardData) => {

  // ❌ Block multi-pick if limit reached
  if (multiPick && selectedCardsCount >= maxSelectableCards) {
    return;
  }

  if (multiPick) {
    setSelectedIndexes((prev) => {
      if (prev.includes(index)) return prev; // prevent duplicate picks
      return [...prev, index];
    });
  } else {
    setSelectedIndex(index);
  }

  if (onSelect) onSelect(cardData || null);
};


  const isSelected = (index) => {
    return multiPick
      ? selectedIndexes.includes(index)
      : selectedIndex === index;
  };

  const getPickNumber = (i) => {
  if (!multiPick) return null;
  const pos = selectedIndexes.indexOf(i);
  return pos !== -1 ? pos + 1 : null;
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
              className={`${styles.card} ${isSelected(i) ? styles.multiActive : ""}`}
              style={{ left: `${i * 34}px` }}
              onClick={() => handleSelect(i, card)}
            >
              <img src={AppImages.tarotCard} alt="tarot" />
              {/* 👉 Multi-pick numbering badge */}
  {multiPick && isSelected(i) && (
    <span className={styles.pickBadge}>
      {getPickNumber(i)}
    </span>
  )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TarotCard;