import React, { useState } from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./GemStoneCard.module.scss";
import { ChevronDown } from "lucide-react";

const AccordionSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.cardBox}>
      <button
        className={styles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
          {title}
        </PrimaryText>
        <ChevronDown 
          className={`${styles.accordionIcon} ${isOpen ? styles.iconRotated : ''}`}
          size={24}
        />
      </button>

      <div className={`${styles.accordionContent} ${isOpen ? styles.contentExpanded : ''}`}>
        {children}
      </div>
    </div>
  );
};

const GemStoneCard = ({ gem }) => {
  if (!gem) return null;

  return (
    <div className={styles.wrapper}>
      {/* TOP DESCRIPTION CARD */}
      <div className={styles.topCard}>
        {/* TITLE */}
        <PrimaryText size="xl" weight="700" className={styles.title}>
          {gem.name}
        </PrimaryText>

        <PrimaryText size="md" weight="500" className={styles.subTitle}>
          Planet: {gem.planet}
        </PrimaryText>

        {/* DESCRIPTION */}
        <PrimaryText size="base" className={styles.description}>
          {gem.description}
        </PrimaryText>
      </div>

      {/* BASIC DETAILS CARD */}
      <AccordionSection title="Basic Details" defaultOpen={false}>
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
      </AccordionSection>

      {/* SUBSTITUTE */}
      <AccordionSection title="Substitutes" defaultOpen={false}>
        <div className={styles.rowList}>
          {gem.substitute.map((item, index) => (
            <div key={index} className={`${styles.rowItem} ${styles.subRow}`}>
              {item}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* NOT TO WEAR WITH */}
      <AccordionSection title="Not to Wear With" defaultOpen={false}>
        <div className={styles.rowList}>
          {gem.not_to_wear_with.map((item, index) => (
            <div key={index} className={`${styles.rowItem} ${styles.notRow}`}>
              {item}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* GOOD RESULTS */}
      <AccordionSection title="Good Results" defaultOpen={false}>
        <div className={styles.rowList}>
          {gem.good_results.map((item, index) => (
            <div key={index} className={`${styles.rowItem} ${styles.goodRow}`}>
              {item}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* DISEASES */}
      <AccordionSection title="Diseases It Helps With" defaultOpen={false}>
        <div className={styles.rowList}>
          {gem.diseases_cure.map((item, index) => (
            <div key={index} className={`${styles.rowItem} ${styles.disRow}`}>
              {item}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* FLAW RESULTS */}
      <AccordionSection title="Flaws & Their Effects" defaultOpen={false}>
        <div className={styles.table}>
          {gem.flaw_results.map((row, index) => (
            <div className={styles.tableRow} key={index}>
              <div className={styles.cellLeft}>{row.flaw_type}</div>
              <div className={styles.cellRight}>{row.flaw_effects}</div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* TIME TO WEAR */}
      <AccordionSection title="Time to Wear" defaultOpen={false}>
        <PrimaryText marginBottom="5px" size="base">
          {gem.time_to_wear}
        </PrimaryText>
        <PrimaryText marginTop="5px" size="lg">
          In short : {gem.time_to_wear_short}
        </PrimaryText>
      </AccordionSection>

      {/* METHODS */}
      <AccordionSection title="How to Wear" defaultOpen={false}>
        <PrimaryText size="base">{gem.methods}</PrimaryText>
      </AccordionSection>

      {/* MANTRA */}
      <AccordionSection title="Mantra" defaultOpen={false}>
        <PrimaryText size="base" className={styles.mantra}>
          {gem.mantra}
        </PrimaryText>
      </AccordionSection>
    </div>
  );
};

export default GemStoneCard;
