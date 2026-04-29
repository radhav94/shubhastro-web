import styles from "./HousesGrid.module.scss";
import useTTS from "./useTTS";
import { Volume2, VolumeX } from "lucide-react";

const PLANET_COLORS = { Sun: "#ed8936", Moon: "#a0aec0", Mars: "#e53e3e", Mercury: "#38a169", Jupiter: "#d69e2e", Venus: "#ed64a6", Saturn: "#3182ce", Rahu: "#805ad5", Ketu: "#805ad5" };

const HousesGrid = ({ houses, isLoading }) => {
  const { speak, stop, isSpeaking } = useTTS();

  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!houses?.length) return <div className={styles.empty}><span>🏠</span><p>Houses data not available.</p></div>;

  const handleSpeak = () => {
    const text = houses.map((h, i) => {
      const num = h.khana || i + 1;
      return `House ${num}: Sign ${h.sign || "unknown"}, Maalik ${h.maalik || "unknown"}, Kismat ${h.kismat || "unknown"}${h.planets?.length ? ", Planets: " + h.planets.join(", ") : ""}`;
    }).join(". ");
    speak(text);
  };

  return (
    <div className={styles.tableWrap}>
      <div className={styles.ttsRow}>
        <button className={styles.ttsBtn} onClick={handleSpeak} aria-label={isSpeaking ? "Stop reading" : "Read aloud"}>
          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span>{isSpeaking ? "Stop" : "Listen"}</span>
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>House</th>
            <th>Sign</th>
            <th>Maalik</th>
            <th>Pakka Ghar</th>
            <th>Kismat</th>
            <th>Soya</th>
            <th>Planets</th>
          </tr>
        </thead>
        <tbody>
          {houses.map((house, idx) => (
            <tr key={house.khana || idx} className={house.planets?.length ? styles.hasPlanets : ""}>
              <td className={styles.khana}>{house.khana || idx + 1}</td>
              <td>{house.sign || house.signAbbr || "—"}</td>
              <td>{house.maalik || "—"}</td>
              <td>{house.pakkaGhar || "—"}</td>
              <td>{house.kismat || "—"}</td>
              <td>
                <span className={`${styles.soyaBadge} ${house.soya === "Present" || house.soya === true ? styles.present : styles.absent}`}>
                  {house.soya === true ? "Present" : house.soya === false ? "Absent" : house.soya || "—"}
                </span>
              </td>
              <td>
                {house.planets?.length > 0 ? (
                  <div className={styles.planets}>
                    {house.planets.map((p, i) => (
                      <span key={i} className={styles.planetChip} style={{ background: PLANET_COLORS[p] || "#718096" }}>{p}</span>
                    ))}
                  </div>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HousesGrid;
