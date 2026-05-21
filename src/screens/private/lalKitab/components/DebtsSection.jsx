import { useState } from "react";
import styles from "./DebtsSection.module.scss";
import useTTS from "./useTTS";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";

const DEBT_CATEGORIES = [
  { key: "selfDebts", label: "Self Debts", icon: "🪞" },
  { key: "fatherDebts", label: "Father Debts", icon: "👨" },
  { key: "motherDebts", label: "Mother Debts", icon: "👩" },
  { key: "relativeDebts", label: "Relative Debts", icon: "👥" },
  { key: "spouseDebts", label: "Spouse Debts", icon: "💑" },
];

const DebtCard = ({ category, data }) => {
  const [open, setOpen] = useState(false);
  const { speak, stop, isSpeaking } = useTTS();

  if (!data || (!data.indications?.length && !data.events?.length && !data.remedies?.length)) {
    return null;
  }

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (isSpeaking) { stop(); return; }
    let text = `${category.label}. `;
    if (data.indications?.length) text += "Indications: " + data.indications.join(". ") + ". ";
    if (data.events?.length) text += "Events: " + data.events.join(". ") + ". ";
    if (data.remedies?.length) text += "Remedies: " + data.remedies.join(". ");
    speak(text);
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
          <span
            className={styles.ttsBtn}
            onClick={handleSpeak}
            role="button"
            aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
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

  const hasAnyData = DEBT_CATEGORIES.some((cat) => {
    const d = debts[cat.key];
    return d && (d.indications?.length || d.events?.length || d.remedies?.length);
  });

  if (!hasAnyData) return <div className={styles.empty}><span>⚖️</span><p>No debts data available.</p></div>;

  return (
    <div className={styles.container}>
      {DEBT_CATEGORIES.map((cat) => (
        <DebtCard key={cat.key} category={cat} data={debts[cat.key]} />
      ))}
    </div>
  );
};

export default DebtsSection;
