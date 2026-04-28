import { useState } from "react";
import styles from "./DebtsSection.module.scss";

const DEBT_CATEGORIES = [
  { key: "selfDebts", label: "Self", icon: "🧘" },
  { key: "fatherDebts", label: "Father", icon: "👨" },
  { key: "motherDebts", label: "Mother", icon: "👩" },
  { key: "relativeDebts", label: "Relative", icon: "👥" },
  { key: "spouseDebts", label: "Spouse", icon: "💑" },
];

const DebtsSection = ({ debts, isLoading }) => {
  const [activeCategory, setActiveCategory] = useState("selfDebts");

  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!debts) return <div className={styles.empty}><span>⚖️</span><p>Debts analysis not available.</p></div>;

  const categoryData = debts[activeCategory] || {};
  const hasData = categoryData.indications?.length > 0 || categoryData.events?.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {DEBT_CATEGORIES.map((cat) => (
          <button key={cat.key} className={`${styles.tab} ${activeCategory === cat.key ? styles.active : ""}`} onClick={() => setActiveCategory(cat.key)}>
            <span className={styles.tabIcon}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {!hasData ? (
          <div className={styles.emptyCategory}><p>No debt data for this category.</p></div>
        ) : (
          <>
            {categoryData.indications?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>⚠️ Indications</h3>
                <ul className={styles.list}>
                  {categoryData.indications.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {categoryData.events?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>📅 Events</h3>
                <ul className={styles.list}>
                  {categoryData.events.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DebtsSection;
