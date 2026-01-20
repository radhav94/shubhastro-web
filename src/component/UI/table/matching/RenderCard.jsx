import styles from "./RenderCard.module.scss";
// Utility: handle strings, numbers, and nested objects safely
const renderValue = (value) => {
  if (typeof value === "object" && value !== null) {
    if (value.address) return value.address;
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return value ?? "--";
};

// Reusable card component
const RenderCard = (icon, title, tag, color, data) => (
  <div className={styles.card}>
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.tag} style={{ background: color }}>
          {tag}
        </span>
      </div>
    </div>

    <div className={styles.body}>
      {Object.entries(data || {}).map(([key, value]) => (
        <div key={key} className={styles.row}>
          <span className={styles.label}>{key}</span>
          <span className={styles.value}>{renderValue(value)}</span>
        </div>
      ))}
    </div>
  </div>
);
export default RenderCard;
