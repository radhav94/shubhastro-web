import { useState } from "react";
import styles from "./LalKitabProblems.module.scss";
import RemedyCard from "../components/RemedyCard";

const CATEGORIES = [
  { key: "health", title: "Health", subtitle: "Physical & mental wellness", icon: "🏥", color: "#e53e3e" },
  { key: "finance", title: "Finance", subtitle: "Wealth & prosperity", icon: "💰", color: "#38a169" },
  { key: "marriage", title: "Marriage", subtitle: "Relationship harmony", icon: "💍", color: "#ed64a6" },
  { key: "career", title: "Career", subtitle: "Professional growth", icon: "💼", color: "#3182ce" },
];

const DUMMY = {
  health: { description: "Health issues linked to afflicted planets in 6th/8th house.", planetaryCause: "Weak Sun causes bone problems. Weak Moon leads to stress.", remedies: [{ _id: "h1", title: "Offer Water to Sun", description: "Pour water from copper vessel at sunrise.", planet: "Sun" }] },
  finance: { description: "Financial problems from weak Jupiter or Venus.", planetaryCause: "Weak Jupiter reduces financial wisdom.", remedies: [{ _id: "f1", title: "Apply Saffron Tilak on Thursday", description: "Strengthens Jupiter.", planet: "Jupiter" }] },
  marriage: { description: "Marriage issues from afflicted Venus or 7th house.", planetaryCause: "Afflicted Venus causes disharmony.", remedies: [{ _id: "m1", title: "Offer White Flowers to Shiva", description: "On Monday for marital harmony.", planet: "Moon" }] },
  career: { description: "Career stagnation from weak Sun or Saturn.", planetaryCause: "Weak Sun reduces leadership.", remedies: [{ _id: "c1", title: "Feed Chapati to Dogs on Saturday", description: "Reduces Saturn malefic effects.", planet: "Saturn" }] },
};

const LalKitabProblems = () => {
  const [selected, setSelected] = useState(null);
  const data = selected ? DUMMY[selected] : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Problem-Based Remedies</h1>
      <p className={styles.pageSubtitle}>Choose a life area for targeted Laal Kitab remedies</p>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className={`${styles.catCard} ${selected === cat.key ? styles.activeCat : ""}`} onClick={() => setSelected(cat.key)}>
            <div className={styles.catIcon} style={{ background: cat.color }}>{cat.icon}</div>
            <h3>{cat.title}</h3>
            <p>{cat.subtitle}</p>
          </div>
        ))}
      </div>
      {selected && data && (
        <div className={styles.result}>
          {data.description && <div className={styles.descCard}><h3>Problem Overview</h3><p>{data.description}</p></div>}
          {data.planetaryCause && <div className={styles.causeCard}><h3>🪐 Planetary Cause</h3><p>{data.planetaryCause}</p></div>}
          {data.remedies?.map((r) => <RemedyCard key={r._id} title={r.title} description={r.description} planet={r.planet} />)}
        </div>
      )}
    </div>
  );
};

export default LalKitabProblems;
