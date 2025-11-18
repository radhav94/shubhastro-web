import { useState } from "react";
import styles from "./FilterChips.module.scss";

const FilterChips = ({ onSelect }) => {
  const filterButtons = [
    { name: "All", icon: "📋" },
    { name: "Tarot", icon: "🔮" },
    { name: "Vedic Astrology", icon: "🧘" },
    { name: "Palm reader", icon: "✋" },
    { name: "tantra-magic", icon: "✨" },
    { name: "numerology", icon: "🔢" },
    // { name: "Face Reading", icon: "👁️" },
    // { name: "Love", icon: "❤️" },
    // { name: "Education", icon: "🎓" },
    // { name: "Career", icon: "💼" },
    // { name: "Marriage", icon: "💍" },
  ];

  const [active, setActive] = useState("All");

  const handleClick = (item) => {
    setActive(item);
    onSelect(item === "All" ? null : item);
  };

  return (
    <div className={styles.filterWrapper}>
      {filterButtons.map((btn) => (
        <div
          key={btn.name}
          className={`${styles.chip} ${
            active === btn.name ? styles.activeChip : ""
          }`}
          onClick={() => handleClick(btn.name)}
        >
          <span className={styles.chipIcon}>{btn.icon}</span>
          <span>{btn.name}</span>
        </div>
      ))}
    </div>
  );
};

export default FilterChips;
