import TarotCard from "../card/TarotCard";
import { usePostYesNoTarotQuery } from "../../../../redux/api/tarot/astroTarotApi";
import { useEffect, useRef, useState } from "react";
import styles from "../card/TarotCards.module.scss";
import { AppImages } from "../../../../utils/appImages";

const YesNoTarot = () => {
  const [selected, setSelected] = useState(null);
  const resultRef = useRef(null);

  const payload = selected !== null ? { tarot_id: selected + 1 } : undefined;

  const { data } = usePostYesNoTarotQuery(payload, {
    skip: selected === null,
  });

  useEffect(() => {
    if (data && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }, [data]);

  return (
    <>
      <TarotCard
        title="Yes / No Tarot Reading"
        cardsCount={11}
        onSelect={(i) => setSelected(i)}
      />

      {selected !== null && data && (
        <div ref={resultRef} className={styles.resultContainer}>
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
    </>
  );
};
export default YesNoTarot;
