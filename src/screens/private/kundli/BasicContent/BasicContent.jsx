// src/components/tabs/BasicContent.jsx
import React from "react";
import styles from "./BasicContent.module.scss";

const DetailCard = ({ title, data }) => (
  <div className={styles.detailCard}>
    <h3 className={styles.cardTitle}>{title}</h3>
    <div className={styles.tableWrapper}>
      {data && Object.keys(data).length > 0 ? (
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
      ) : (
        <p>No data found</p>
      )}
    </div>
  </div>
);

const BasicContent = ({ basicData }) => {
  const { birthDetails, birthPanchang, astroDetails } = basicData || {};
  console.log(basicData);

  return (
    <div className={styles.gridContainer}>
      <div className={styles.basicCard}>
        <DetailCard title="Basic Details" data={birthDetails} />
      </div>
      <div className={styles.panchangCard}>
        <DetailCard title="Panchang Details" data={birthPanchang} />
      </div>
      <div className={styles.avakhadaCard}>
        <DetailCard title="Avakhada Details" data={astroDetails} />
      </div>
    </div>
  );
};

export default BasicContent;
