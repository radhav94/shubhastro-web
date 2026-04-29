import styles from "./DebtsSection.module.scss";

const DebtsSection = ({ debts, isLoading }) => {
  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!debts) return <div className={styles.empty}><span>⚖️</span><p>Debts analysis not available.</p></div>;

  const categoryData = debts.selfDebts || {};
  const hasData = categoryData.indications?.length > 0 || categoryData.events?.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {!hasData ? (
          <div className={styles.emptyCategory}><p>No self debt data available.</p></div>
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
