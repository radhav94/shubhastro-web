import { useState } from "react";
import styles from "./LalKitabZodiac.module.scss";
import RemedyCard from "../components/RemedyCard";

const ZODIAC_SIGNS = [
  { key: "aries", emoji: "♈", label: "Aries" },
  { key: "taurus", emoji: "♉", label: "Taurus" },
  { key: "gemini", emoji: "♊", label: "Gemini" },
  { key: "cancer", emoji: "♋", label: "Cancer" },
  { key: "leo", emoji: "♌", label: "Leo" },
  { key: "virgo", emoji: "♍", label: "Virgo" },
  { key: "libra", emoji: "♎", label: "Libra" },
  { key: "scorpio", emoji: "♏", label: "Scorpio" },
  { key: "sagittarius", emoji: "♐", label: "Sagittarius" },
  { key: "capricorn", emoji: "♑", label: "Capricorn" },
  { key: "aquarius", emoji: "♒", label: "Aquarius" },
  { key: "pisces", emoji: "♓", label: "Pisces" },
];

const DUMMY = {
  aries: { planetaryInfluence: "Mars rules Aries. Focus on career initiatives.", remedies: [{ _id: "1", title: "Offer Jaggery to Hanuman", description: "Visit Hanuman temple on Tuesday.", planet: "Mars" }], dos: ["Wear red on Tuesdays"], donts: ["Avoid arguments on Tuesdays"] },
  taurus: { planetaryInfluence: "Venus governs Taurus. Enhance creativity.", remedies: [{ _id: "2", title: "Donate White Items on Friday", description: "Strengthens Venus.", planet: "Venus" }], dos: ["Wear white on Fridays"], donts: ["Avoid overspending"] },
};

const LalKitabZodiac = () => {
  const [selected, setSelected] = useState(null);
  const data = selected ? DUMMY[selected] : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Zodiac Remedies</h1>
      <p className={styles.pageSubtitle}>Select your zodiac sign for Laal Kitab remedies</p>
      <div className={styles.grid}>
        {ZODIAC_SIGNS.map((s) => (
          <div key={s.key} className={`${styles.item} ${selected === s.key ? styles.active : ""}`} onClick={() => setSelected(s.key)}>
            <span className={styles.emoji}>{s.emoji}</span>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
      {selected && data && (
        <div className={styles.result}>
          <div className={styles.infoCard}><h3>🪐 Planetary Influence</h3><p>{data.planetaryInfluence}</p></div>
          {data.remedies?.map((r) => <RemedyCard key={r._id} title={r.title} description={r.description} planet={r.planet} />)}
          <div className={styles.dosAndDonts}>
            {data.dos?.length > 0 && <div className={styles.dosList}><h3 className={styles.dosTitle}>✅ Do's</h3><ul>{data.dos.map((d, i) => <li key={i}>{d}</li>)}</ul></div>}
            {data.donts?.length > 0 && <div className={styles.dontsList}><h3 className={styles.dontsTitle}>❌ Don'ts</h3><ul>{data.donts.map((d, i) => <li key={i}>{d}</li>)}</ul></div>}
          </div>
        </div>
      )}
      {selected && !data && <div className={styles.empty}><p>Data coming soon for this sign.</p></div>}
    </div>
  );
};

export default LalKitabZodiac;
