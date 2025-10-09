// src/components/KundaliContent.jsx
import React from "react";
import { motion } from "framer-motion";
import styles from "./KundaliContent.module.scss";

const kundliData = {
  basic: {
    basicDetails: {
      Name: "User",
      Date: "16/08/1997",
      Time: "02:00 AM",
      Place: "Mumbai, Maharashtra, India",
      Latitude: "18.97",
      Longitude: "72.83",
      Timezone: "GMT +5.5",
      Sunrise: "6:20:1",
      Sunset: "19:5:37",
      Ayanamsha: "23.82383",
    },
    panchangDetails: {
      Tithi: "Shukla Dwadashi",
      Karan: "Baalav",
      Yog: "Preeti",
      Nakshatra: "Purva Ashadha",
    },
    avakhadaDetails: {
      Varna: "Kshattriya",
      Vashya: "Chatushpada",
      Yoni: "Vaanar",
      Gan: "Manav",
      Nadi: "Madhya",
      Sign: "Sagittarius",
      "Sign Lord": "Jupiter",
      "Nakshatra-Charan": "Purva Ashadha",
      Tatva: "Fire",
      "Name alphabet": "Faa",
      Paya: "Copper",
    },
  },
  kundli: {
    planets: {
      headers: [
        "Planet",
        "Sign",
        "Sign Lord",
        "Nakshatra",
        "Naksh Lord",
        "Degree",
        "Retro(R)",
        "Combust",
        "Avastha",
        "House",
        "Status",
      ],
      rows: [
        [
          "Ascendant",
          "Taurus",
          "Venus",
          "Mrigashirsha",
          "Mars",
          "29<sup>&deg;</sup>51&prime;44&Prime;",
          "Direct",
          "No",
          "--",
          "1",
          "--",
        ],
        [
          "Sun",
          "Cancer",
          "Moon",
          "Ashlesha",
          "Mercury",
          "29<sup>&deg;</sup>12&prime;33&Prime;",
          "Direct",
          "No",
          "Bala",
          "3",
          "Friendly",
        ],
        [
          "Moon",
          "Sagittarius",
          "Jupiter",
          "Purva Ashadha",
          "Venus",
          "23<sup>&deg;</sup>8&prime;19&Prime;",
          "Direct",
          "No",
          "Vriddha",
          "8",
          "Friendly",
        ],
        [
          "Mercury",
          "Leo",
          "Sun",
          "Purva Phalguni",
          "Venus",
          "22<sup>&deg;</sup>14&prime;0&Prime;",
          "Direct",
          "No",
          "Vriddha",
          "4",
          "Friendly",
        ],
        [
          "Venus",
          "Virgo",
          "Mercury",
          "Uttara Phalguni",
          "Sun",
          "4<sup>&deg;</sup>5&prime;41&Prime;",
          "Direct",
          "No",
          "Mrita",
          "5",
          "Friendly",
        ],
        [
          "Mars",
          "Libra",
          "Venus",
          "Swati",
          "Rahu",
          "7<sup>&deg;</sup>5&prime;41&Prime;",
          "Direct",
          "No",
          "Kumara",
          "6",
          "Friendly",
        ],
        [
          "Jupiter",
          "Capricorn",
          "Saturn",
          "Shravana",
          "Moon",
          "22<sup>&deg;</sup>21&prime;36&Prime;",
          "Retro",
          "No",
          "Kumara",
          "9",
          "Debilitated",
        ],
        [
          "Saturn",
          "Pisces",
          "Jupiter",
          "Revati",
          "Mercury",
          "26<sup>&deg;</sup>21&prime;55&Prime;",
          "Retro",
          "No",
          "Bala",
          "11",
          "--",
        ],
        [
          "Rahu",
          "Leo",
          "Sun",
          "Uttara Phalguni",
          "Sun",
          "27<sup>&deg;</sup>13&prime;7&Prime;",
          "Retro",
          "No",
          "Mrita",
          "4",
          "--",
        ],
        [
          "Ketu",
          "Aquarius",
          "Saturn",
          "Purva Bhadrapada",
          "Jupiter",
          "27<sup>&deg;</sup>13&prime;7&Prime;",
          "Retro",
          "No",
          "Mrita",
          "10",
          "--",
        ],
      ],
    },
  },
  // Add other data sections (KP, Ashtakvarga, etc.) here
};

// Animation variants for sections
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Reusable card for key-value data
const DetailCard = ({ title, details }) => (
  <motion.div
    className={styles.contentCard}
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
  >
    <h3 className={styles.cardTitle}>{title}</h3>
    <table className={styles.detailsTable}>
      <tbody>
        {Object.entries(details).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </motion.div>
);

// Reusable component for the large planets table
const PlanetsTable = ({ title, data }) => (
  <motion.div
    className={styles.contentCard}
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
  >
    <h3 className={styles.cardTitle}>{title}</h3>
    <div className={styles.tableContainer}>
      <table className={`${styles.detailsTable} ${styles.planetsTable}`}>
        <thead>
          <tr>
            {data.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  dangerouslySetInnerHTML={{ __html: cell }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const KundaliContent = () => {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.grid}>
        <motion.div
          className={styles.contentCard}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h3 className={styles.cardTitle}>Lagna / Ascendant Chart</h3>
          <div className={styles.chartPlaceholder}></div>
        </motion.div>
        <motion.div
          className={styles.contentCard}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h3 className={styles.cardTitle}>Navamsa Chart</h3>
          <div className={styles.chartPlaceholder}></div>
        </motion.div>
      </div>

      <PlanetsTable title="Planets" data={kundliData.kundli.planets} />
    </div>
  );
};

export default KundaliContent;
