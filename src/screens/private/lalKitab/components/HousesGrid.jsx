import styles from "./HousesGrid.module.scss";

const PLANET_COLORS = { Sun: "#ed8936", Moon: "#a0aec0", Mars: "#e53e3e", Mercury: "#38a169", Jupiter: "#d69e2e", Venus: "#ed64a6", Saturn: "#3182ce", Rahu: "#805ad5", Ketu: "#805ad5" };

const HousesGrid = ({ houses, isLoading }) => {
  if (isLoading) return <div className={styles.skeletonList}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}</div>;
  if (!houses?.length) return <div className={styles.empty}><span>🏠</span><p>Houses data not available.</p></div>;

  return (
    <div className={styles.tableWrap}>
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
