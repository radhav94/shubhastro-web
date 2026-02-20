import React, { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./YogaCard.module.scss";

const YogaCard = ({ yoga }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!yoga) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.wrapper}>
      {/* Title - Clickable Header */}
      <div className={styles.header} onClick={toggleExpand}>
        <h2 className={styles.title}>
          {yoga.yoga}
        </h2>
        <IoChevronDown 
          className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ''}`}
        />
      </div>

      {/* Collapsible Content */}
      <div className={`${styles.content} ${isExpanded ? styles.contentExpanded : ''}`}>
        {/* Meaning */}
        <div className={styles.section}>
          <PrimaryText
            size_14
            isSemiBold
            className={styles.sectionTitle}
          >
            Meaning
          </PrimaryText>

          <PrimaryText
            size_14
            color="#4f4f4f"
            className={styles.text}
          >
            {yoga.meaning}
          </PrimaryText>
        </div>

        {/* Strength */}
        <div className={styles.sectionRow}>
          <PrimaryText size_14 isSemiBold className={styles.label}>
            Strength
          </PrimaryText>
          <PrimaryText size_14 className={styles.value}>
            {yoga.strength_in_percentage}%
          </PrimaryText>
        </div>

        {/* Planets */}
        <div className={styles.sectionRow}>
          <PrimaryText size_14 isSemiBold className={styles.label}>
            Planets
          </PrimaryText>

          <PrimaryText size_14 className={styles.value}>
            {yoga.planets_involved?.join(", ")}
          </PrimaryText>
        </div>

        {/* Houses */}
        <div className={styles.sectionRow}>
          <PrimaryText size_14 isSemiBold className={styles.label}>
            Houses
          </PrimaryText>

          <PrimaryText size_14 className={styles.value}>
            {yoga.houses_involved?.join(", ")}
          </PrimaryText>
        </div>
      </div>
    </div>
  );
};

export default YogaCard;
