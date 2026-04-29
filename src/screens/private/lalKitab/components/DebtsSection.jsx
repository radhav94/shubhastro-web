import styles from "./DebtsSection.module.scss";
import useTTS from "./useTTS";
import { Volume2, VolumeX } from "lucide-react";

const DebtsSection = ({ debts, isLoading }) => {
  const { speak, stop, isSpeaking } = useTTS();
  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!debts) return <div className={styles.empty}><span>⚖️</span><p>Debts analysis not available.</p></div>;

  const categoryData = debts.selfDebts || {};
  const hasData = categoryData.indications?.length > 0 || categoryData.events?.length > 0;

  const handleSpeak = () => {
    let text = "";
    if (categoryData.indications?.length) text += "Indications: " + categoryData.indications.join(". ") + ". ";
    if (categoryData.events?.length) text += "Events: " + categoryData.events.join(". ");
    speak(text);
  };

  return (
    <div className={styles.container}>
      {hasData && (
        <div className={styles.ttsRow}>
          <button className={styles.ttsBtn} onClick={isSpeaking ? stop : handleSpeak} aria-label={isSpeaking ? "Stop reading" : "Read aloud"}>
            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span style={{ display: isSpeaking ? "none" : "inline" }}>Listen</span>
            <span style={{ display: isSpeaking ? "inline" : "none" }}>Stop</span>
          </button>
        </div>
      )}
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
