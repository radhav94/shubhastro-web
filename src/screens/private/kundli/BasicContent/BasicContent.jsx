// src/components/tabs/BasicContent.jsx
import React from "react";
import styles from "./BasicContent.module.scss";

// --- Data extracted from your HTML ---
const basicDetails = {
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
};

const panchangDetails = {
  Tithi: "Shukla Dwadashi",
  Karan: "Baalav",
  Yog: "Preeti",
  Nakshatra: "Purva Ashadha",
};

const avakhadaDetails = {
  Varna: "Kshattriya",
  Vashya: "Chatushpada",
  Yoni: "Vaanar",
  Gan: "Manav",
  Nadi: "Madhya",
  Sign: "Sagittarius",
  "Sign Lord": "Jupiter",
  "Nakshatra-Charan": "Purva Ashadha",
  Yog: "Preeti",
  Karan: "Baalav",
  Tithi: "Shukla Dwadashi",
  Yunja: "Antya",
  Tatva: "Fire",
  "Name alphabet": "Faa",
  Paya: "Copper",
};

// A reusable card component to display each table
const DetailCard = ({ title, data }) => (
  <div className={styles.detailCard}>
    <h3 className={styles.cardTitle}>{title}</h3>
    <div className={styles.tableWrapper}>
      <table className={styles.detailsTable}>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BasicContent = () => {
  return (
    <div className={styles.gridContainer}>
      <div className={styles.basicCard}>
        <DetailCard title="Basic Details" data={basicDetails} />
      </div>
      <div className={styles.panchangCard}>
        <DetailCard title="Panchang Details" data={panchangDetails} />
      </div>
      <div className={styles.avakhadaCard}>
        <DetailCard title="Avakhada Details" data={avakhadaDetails} />
      </div>
    </div>
  );
};

export default BasicContent;
