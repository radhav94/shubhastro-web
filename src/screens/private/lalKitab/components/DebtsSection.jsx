import { useState } from "react";
import styles from "./DebtsSection.module.scss";
import { ChevronDown } from "lucide-react";
import TTSButton from "../../../../component/UI/TTSButton";

const DEBT_CATEGORIES = [
  { key: "selfDebts", label: "Self Debts", icon: "🪞" },
  { key: "fatherDebts", label: "Father Debts", icon: "👨" },
  { key: "motherDebts", label: "Mother Debts", icon: "👩" },
  { key: "relativeDebts", label: "Relative Debts", icon: "👥" },
  { key: "spouseDebts", label: "Spouse Debts", icon: "💑" },
];

const DebtCard = ({ category, data }) => {
  const [open, setOpen] = useState(false);

  if (!data || (!data.indications?.length && !data.events?.length && !data.remedies?.length)) {
    return null;
  }

  const getTTSText = () => {
    let text = `${category.label}. `;
    if (data.indications?.length) text += "Indications: " + data.indications.join(". ") + ". ";
    if (data.events?.length) text += "Events: " + data.events.join(". ") + ". ";
    if (data.remedies?.length) text += "Remedies: " + data.remedies.join(". ");
    return text;
  };

  return (
    <div className={styles.debtCard}>
      <button
        className={styles.cardHeader}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>{category.icon}</span>
          <span className={styles.cardLabel}>{category.label}</span>
          {data.severity && (
            <span className={`${styles.severity} ${styles[data.severity]}`}>
              {data.severity}
            </span>
          )}
        </div>
        <div className={styles.cardHeaderRight}>
          <span onClick={(e) => e.stopPropagation()}>
            <TTSButton text={getTTSText()} size={16} />
          </span>
          <ChevronDown
            size={20}
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          />
        </div>
      </button>

      <div className={`${styles.cardBody} ${open ? styles.cardBodyOpen : ""}`}>
        {data.indications?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>⚠️ Indications</h4>
            <ul className={styles.list}>
              {data.indications.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
        {data.events?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>📅 Events</h4>
            <ul className={styles.list}>
              {data.events.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
        {data.remedies?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🙏 Remedies</h4>
            <ul className={styles.list}>
              {data.remedies.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const DebtsSection = ({ debts, isLoading }) => {
  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!debts) return <div className={styles.empty}><span>⚖️</span><p>Debts analysis not available.</p></div>;

  const selfData = debts.selfDebts;
  if (!selfData || (!selfData.indications?.length && !selfData.events?.length && !selfData.remedies?.length)) {
    return <div className={styles.empty}><span>⚖️</span><p>No debts data available.</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.detailCard}>
        {selfData.indications?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>⚠️ Indications</h4>
            <ul className={styles.list}>
              {selfData.indications.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
        {selfData.events?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>📅 Events</h4>
            <ul className={styles.list}>
              {selfData.events.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
        {selfData.remedies?.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🙏 Remedies</h4>
            <ul className={styles.list}>
              {selfData.remedies.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtsSection;
