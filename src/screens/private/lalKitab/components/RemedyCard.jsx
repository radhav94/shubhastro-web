import styles from "./RemedyCard.module.scss";

const PLANET_COLORS = { mars: "#e53e3e", saturn: "#3182ce", jupiter: "#d69e2e", mercury: "#38a169", sun: "#ed8936", moon: "#a0aec0", rahu: "#805ad5", ketu: "#805ad5", venus: "#ed64a6" };

const RemedyCard = ({ title, description, planet }) => {
  const color = PLANET_COLORS[planet?.toLowerCase()] || "#718096";
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {planet && <span className={styles.badge} style={{ background: color }}>{planet}</span>}
      </div>
      <p className={styles.desc}>{description}</p>
    </div>
  );
};

export default RemedyCard;
