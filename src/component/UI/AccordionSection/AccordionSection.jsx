import { useState } from "react";
import styles from "./AccordionSection.module.scss";
import arrowUp from "../../../assets/images/arrow-up.svg";

const AccordionSection = ({ title, data = {}, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formatKeyLabel = (key) => {
    if (!key) return "";
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className={styles.accordionSection}>
      <button
        className={styles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className={styles.accordionTitle}>{title}</h3>
        <span>
          <img
            src={arrowUp}
            alt="toggle"
            className={`${styles.arrowIcon} ${isOpen ? styles.arrowOpen : ""}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className={styles.accordionContent}>
          {entries.length > 0 && (
            <div className={styles.detailsList}>
              {Array.from({ length: Math.ceil(entries.length / 3) }, (_, groupIndex) => (
                <div key={groupIndex} className={styles.detailGroupBox}>
                  {entries.slice(groupIndex * 3, groupIndex * 3 + 3).map(([key, value]) => (
                    <div key={key} className={styles.detailGroupRow}>
                      <span className={styles.detailLabel}>{formatKeyLabel(key)}</span>
                      <span className={styles.detailValue}>{value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccordionSection;
