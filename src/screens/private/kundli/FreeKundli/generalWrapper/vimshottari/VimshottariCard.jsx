import React from "react";
import styles from "./Vimshottari.module.scss";

const VimshottariCard = ({ dasha }) => {
  if (!dasha) return null;

  return (
    <div className={styles.dashaCard}>
      <div className={styles.dateRange}>
        {dasha.dasha_start_year} - {dasha.dasha_end_year}
      </div>
      <div className={styles.dashaName}>
        {dasha.dasha}
      </div>
    </div>
  );
};

export default VimshottariCard;
