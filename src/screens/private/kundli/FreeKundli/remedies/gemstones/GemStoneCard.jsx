import { useState } from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import TTSButton from "../../../../../../component/UI/TTSButton";
import styles from "./GemStoneCard.module.scss";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

const SectionCard = ({ title, titleExtra, children }) => {
  return (
    <div className={styles.cardBox}>
      <div className={styles.header}>
        <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
          {title}
        </PrimaryText>
        {titleExtra && <span style={{ marginLeft: "auto" }}>{titleExtra}</span>}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

const GemStoneCard = ({ gem }) => {
  const [showAllFlaws, setShowAllFlaws] = useState(false);
  const [showFullTimeToWear, setShowFullTimeToWear] = useState(false);
  const [showFullMethods, setShowFullMethods] = useState(false);
  const [showFullMantra, setShowFullMantra] = useState(false);

  if (!gem) return null;

  const flawsToShow = showAllFlaws ? gem.flaw_results : gem.flaw_results.slice(0, 4);
  const hasMoreFlaws = gem.flaw_results.length > 4;

  const timeToWearText = gem.time_to_wear || "";
  const shouldTruncateTimeToWear = timeToWearText.length > 300;
  const displayTimeToWear = shouldTruncateTimeToWear && !showFullTimeToWear 
    ? timeToWearText.slice(0, 300) + "..." 
    : timeToWearText;

  const methodsText = gem.methods || "";
  const shouldTruncateMethods = methodsText.length > 300;
  const displayMethods = shouldTruncateMethods && !showFullMethods 
    ? methodsText.slice(0, 300) + "..." 
    : methodsText;

  const mantraText = gem.mantra || "";
  const shouldTruncateMantra = mantraText.length > 300;
  const displayMantra = shouldTruncateMantra && !showFullMantra 
    ? mantraText.slice(0, 300) + "..." 
    : mantraText;

  return (
    <div className={styles.wrapper}>
      {/* TOP DESCRIPTION CARD */}
      <div className={styles.topCard}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <PrimaryText size="xl" weight="700" className={styles.title}>
            {gem.name}
          </PrimaryText>
          <span style={{ marginLeft: "auto" }}>
            <TTSButton
              text={[
                gem.name,
                gem.planet ? `Planet: ${gem.planet}` : "",
                gem.description || "",
                gem.gem ? `Gem: ${gem.gem}` : "",
                gem.other_name ? `Other Name: ${gem.other_name}` : "",
                gem.finger ? `Finger: ${gem.finger}` : "",
                gem.weight ? `Weight: ${gem.weight}` : "",
                gem.day ? `Day: ${gem.day}` : "",
                gem.metal ? `Metal: ${gem.metal}` : "",
                gem.substitute?.length ? `Substitutes: ${gem.substitute.join(", ")}` : "",
                gem.not_to_wear_with?.length ? `Not to Wear With: ${gem.not_to_wear_with.join(", ")}` : "",
                gem.good_results?.length ? `Good Results: ${gem.good_results.join(", ")}` : "",
                gem.diseases_cure?.length ? `Diseases It Helps With: ${gem.diseases_cure.join(", ")}` : "",
                gem.time_to_wear ? `Time to Wear: ${gem.time_to_wear}` : "",
                gem.time_to_wear_short ? `In short: ${gem.time_to_wear_short}` : "",
                gem.methods ? `How to Wear: ${gem.methods}` : "",
                gem.mantra ? `Mantra: ${gem.mantra}` : "",
              ].filter(Boolean).join(". ")}
            />
          </span>
        </div>

        <PrimaryText size="md" weight="500" className={styles.subTitle}>
          Planet: {gem.planet}
        </PrimaryText>

        <PrimaryText size="base" className={styles.description}>
          {gem.description}
        </PrimaryText>
      </div>

      {/* SECTIONS GRID */}
      <div className={styles.sectionsGrid}>
        {/* BASIC DETAILS CARD */}
        <SectionCard title="Basic Details">
          <div className={styles.grid}>
            <div>
              <strong>Gem:</strong> {gem.gem}
            </div>
            <div>
              <strong>Other Name:</strong> {gem.other_name}
            </div>
            <div>
              <strong>Finger:</strong> {gem.finger}
            </div>
            <div>
              <strong>Weight:</strong> {gem.weight}
            </div>
            <div>
              <strong>Day:</strong> {gem.day}
            </div>
            <div>
              <strong>Metal:</strong> {gem.metal}
            </div>
          </div>
        </SectionCard>

        {/* SUBSTITUTE */}
        <SectionCard title="Substitutes">
          <div className={styles.rowList}>
            {gem.substitute.map((item, index) => (
              <div key={index} className={`${styles.rowItem} ${styles.subRow}`}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* NOT TO WEAR WITH */}
        <SectionCard title="Not to Wear With">
          <div className={styles.rowList}>
            {gem.not_to_wear_with.map((item, index) => (
              <div key={index} className={`${styles.rowItem} ${styles.notRow}`}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* GOOD RESULTS */}
        <SectionCard title="Good Results">
          <div className={styles.rowList}>
            {gem.good_results.map((item, index) => (
              <div key={index} className={`${styles.rowItem} ${styles.goodRow}`}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* DISEASES */}
        <SectionCard title="Diseases It Helps With">
          <div className={styles.rowList}>
            {gem.diseases_cure.map((item, index) => (
              <div key={index} className={`${styles.rowItem} ${styles.disRow}`}>
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* FLAW RESULTS */}
        <SectionCard title="Flaws & Their Effects">
          <div className={styles.table}>
            {flawsToShow.map((row, index) => (
              <div className={styles.tableRow} key={index}>
                <div className={styles.cellLeft}>{row.flaw_type}</div>
                <div className={styles.cellRight}>{row.flaw_effects}</div>
              </div>
            ))}
          </div>
          {hasMoreFlaws && (
            <button 
              className={styles.showMoreBtn}
              onClick={() => setShowAllFlaws(!showAllFlaws)}
            >
              {showAllFlaws ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
            </button>
          )}
        </SectionCard>

        {/* TIME TO WEAR */}
        <SectionCard 
          title="Time to Wear"
          titleExtra={
            <TTSButton
              text={[
                "Time to Wear",
                gem.time_to_wear || "",
                gem.time_to_wear_short ? `In short: ${gem.time_to_wear_short}` : "",
              ].filter(Boolean).join(". ")}
            />
          }
        >
          <PrimaryText marginBottom="5px" size="base">
            {displayTimeToWear}
          </PrimaryText>
          {shouldTruncateTimeToWear && (
            <span 
              className={styles.showMoreText}
              onClick={() => setShowFullTimeToWear(!showFullTimeToWear)}
            >
              {showFullTimeToWear ? 'Show Less' : 'Show More'}
            </span>
          )}
          <PrimaryText marginTop="5px" size="lg">
            In short : {gem.time_to_wear_short}
          </PrimaryText>
        </SectionCard>

        {/* METHODS */}
        <SectionCard 
          title="How to Wear"
          titleExtra={
            <TTSButton
              text={[
                "How to Wear",
                gem.methods || "",
              ].filter(Boolean).join(". ")}
            />
          }
        >
          <PrimaryText size="base">{displayMethods}</PrimaryText>
          {shouldTruncateMethods && (
            <span 
              className={styles.showMoreText}
              onClick={() => setShowFullMethods(!showFullMethods)}
            >
              {showFullMethods ? 'Show Less' : 'Show More'}
            </span>
          )}
        </SectionCard>

        {/* MANTRA */}
        <SectionCard title="Mantra">
          <PrimaryText size="base" className={styles.mantra}>
            {displayMantra}
          </PrimaryText>
          {shouldTruncateMantra && (
            <span 
              className={styles.showMoreText}
              onClick={() => setShowFullMantra(!showFullMantra)}
            >
              {showFullMantra ? 'Show Less' : 'Show More'}
            </span>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default GemStoneCard;
