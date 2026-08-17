import React, { useEffect, useRef, useState } from "react";
import styles from "./TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";
import { PrimaryText } from "../../../../component";
import { useGetTarotShuffleDataQuery } from "../../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const MAX_RECENT = 3;

// Module-level ref so it survives component remounts
let recentPickedIds = [];

const TarotCard = ({
  title,
  subtitle = "",
  onSelect,
  shuffleType = "both",
  cardsCount = 22,
  multiPick = false,
  maxSelectableCards = 1,
  shuffleKey = null,
  selectedCardsCount = 0,
}) => {
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // The endpoint returns the static deck; the draw itself is randomised
  // client-side in pickRandomCard(). `shuffleKey` still busts the cache when the
  // parent genuinely wants a fresh deck, so a blanket refetchOnMountOrArgChange
  // only wasted VedicAstro quota on every remount.
  const { data, isLoading } = useGetTarotShuffleDataQuery({
    shuffle_type: shuffleType,
    lang: "en",
    key: shuffleKey,
  });

  const allCards = data?.response || [];

  useEffect(() => {
    setSelectedIndexes([]);
    setSelectedIndex(null);
  }, [shuffleKey]);

  if (isLoading) return <PrimaryLoader />;

  const pickRandomCard = () => {
    console.log("--- TAROT PICK START ---");
    console.log("All cards from API:", allCards.map((c) => c?.id));
    console.log("Recent picked IDs (excluded):", [...recentPickedIds]);

    // Filter out last 3 picked cards
    const available = allCards.filter(
      (card) => !recentPickedIds.includes(card?.id)
    );
    const pool = available.length > 0 ? available : allCards;

    console.log("Available pool after filter:", pool.map((c) => c?.id));

    const randomIndex = Math.floor(Math.random() * pool.length);
    const picked = pool[randomIndex];

    console.log("Picked card:", picked?.id, "| index:", randomIndex);

    // Update sliding window (keep last MAX_RECENT)
    if (picked?.id) {
      recentPickedIds = [...recentPickedIds, picked.id].slice(-MAX_RECENT);
    }

    console.log("Updated recent IDs:", [...recentPickedIds]);
    console.log("--- TAROT PICK END ---");

    return picked;
  };

  const handleSelect = (index) => {
    if (multiPick && selectedCardsCount >= maxSelectableCards) return;
    if (multiPick && selectedIndexes.includes(index)) return;
    if (!multiPick && selectedIndex === index) return;

    const pickedCard = pickRandomCard();

    if (multiPick) {
      setSelectedIndexes((prev) => {
        if (prev.includes(index)) return prev;
        return [...prev, index];
      });
    } else {
      setSelectedIndex(index);
    }

    if (onSelect) onSelect(pickedCard);
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

  const placeholderCards = Array.from({ length: cardsCount }, (_, i) => i);

  return (
    <>
      <PrimaryText isBold isCenter size_28>
        {title}
      </PrimaryText>
      {subtitle && <p className={styles.description}>{subtitle}</p>}

      <div className={styles.wrapper}>
        <div className={styles.fanWrapper}>
          {placeholderCards.map((_, i) => (
            <div
              key={i}
              className={`${styles.card} ${isSelected(i) ? styles.multiActive : ""}`}
              style={{ left: `${i * 34}px` }}
              onClick={() => handleSelect(i)}
            >
              <img src={AppImages.tarotCard} alt="tarot" />
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
