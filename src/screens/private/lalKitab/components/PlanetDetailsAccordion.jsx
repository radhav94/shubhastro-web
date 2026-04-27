import { useState } from "react";
import styles from "./PlanetDetailsAccordion.module.scss";

const PLANET_ICONS = { Sun: "☀️", Moon: "🌙", Mars: "♂️", Mercury: "☿️", Jupiter: "♃", Venus: "♀️", Saturn: "♄", Rahu: "🐍", Ketu: "🔥" };
const PLANET_COLORS = { Sun: "#ed8936", Moon: "#a0aec0", Mars: "#e53e3e", Mercury: "#38a169", Jupiter: "#d69e2e", Venus: "#ed64a6", Saturn: "#3182ce", Rahu: "#805ad5", Ketu: "#805ad5" };

const PlanetDetailsAccordion = ({ planets, isLoading }) => {
  const [selected, setSelected] = useState(0);

  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!planets?.length) return <div className={styles.empty}><span>🪐</span><p>Planet details not available.</p></div>;

  const active = planets[selected];
  const name = active?.planet || active?.name || "";
  const color = PLANET_COLORS[name] || "#718096";

  return (
    <div className={styles.container}>
      {/* Planet selector row */}
      <div className={styles.selectorRow}>
        {planets.map((p, idx) => {
          const pName = p.planet || p.name;
          const pColor = PLANET_COLORS[pName] || "#718096";
          const isActive = selected === idx;
          return (
            <button
              key={pName || idx}
              className={`${styles.planetBox} ${isActive ? styles.active : ""}`}
              style={{ borderColor: isActive ? pColor : "transparent", background: isActive ? `${pColor}15` : undefined }}
              onClick={() => setSelected(idx)}
            >
              <span className={styles.planetIcon}>{PLANET_ICONS[pName] || "🪐"}</span>
              <span className={styles.planetLabel}>{pName}</span>
            </button>
          );
        })}
      </div>

      {/* Selected planet details */}
      {active && (
        <div className={styles.detailCard} style={{ borderTopColor: color }}>
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}>{PLANET_ICONS[name] || "🪐"}</span>
            <div>
              <h3 className={styles.detailName}>{name}</h3>
              {active.house && <span className={styles.detailHouse}>House {active.house}</span>}
            </div>
          </div>

          {active.interpretation && (
            <p className={styles.interpretation}>{active.interpretation}</p>
          )}

          {active.remedies?.length > 0 && (
            <div className={styles.remedies}>
              <h4 className={styles.remediesTitle}>💊 Remedies</h4>
              <ul className={styles.remedyList}>
                {active.remedies.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanetDetailsAccordion;
