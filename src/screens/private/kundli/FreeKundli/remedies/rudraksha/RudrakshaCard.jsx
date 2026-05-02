import React, { useState } from "react";
import styles from "./Rudraksha.module.scss";
import PrimaryText from "../../../../../../component/PrimaryText";
import TTSButton from "../../../../../../component/UI/TTSButton";
import { ChevronDown } from "lucide-react";

const RudrakshaCard = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  const {
    name,
    mukhi_description,
    mukhi_for_disease_cure,
    mukhi_for_money,
    bot_response,
  } = data;

  return (
    <div className={styles.wrapper}>
      <div className={styles.accordionCard}>
        <button
          className={styles.accordionHeader}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <h1 className={styles.title}>{name}</h1>
            <span onClick={(e) => e.stopPropagation()}>
              <TTSButton
                text={[
                  name,
                  mukhi_description ? `Description: ${mukhi_description}` : "",
                  mukhi_for_disease_cure?.length ? `For Disease Cure: ${mukhi_for_disease_cure.map(n => `${n} Mukhi`).join(", ")}` : "",
                  mukhi_for_money?.length ? `For Money and Prosperity: ${mukhi_for_money.map(n => `${n} Mukhi`).join(", ")}` : "",
                  bot_response ? `AI Recommendation: ${bot_response}` : "",
                ].filter(Boolean).join(". ")}
              />
            </span>
          </div>
          <ChevronDown 
            className={`${styles.accordionIcon} ${isOpen ? styles.iconRotated : ''}`}
            size={24}
          />
        </button>

        <div className={`${styles.accordionContent} ${isOpen ? styles.contentExpanded : ''}`}>
          <div className={styles.section}>
            <h2 className={styles.label}>Description:</h2>
            <p className={styles.value}>{mukhi_description}</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.label}>For Disease Cure:</h2>
            <div className={styles.valueBadges}>
              {mukhi_for_disease_cure?.map((num, index) => (
                <PrimaryText key={index} className={styles.badgeRed}>
                  {num} Mukhi
                </PrimaryText>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.label}>
              For Money & Prosperity:
            </h2>
            <div className={styles.valueBadges}>
              {mukhi_for_money?.map((num, index) => (
                <PrimaryText key={index} className={styles.badgeGreen}>
                  {num} Mukhi
                </PrimaryText>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation - Outside Dropdown */}
      <div className={styles.aiSection}>
        <h2 className={styles.label}>
          AI Recommendation:
        </h2>
        <p className={styles.botResponse}>
          {bot_response}
        </p>
      </div>
    </div>
  );
};

export default RudrakshaCard;
