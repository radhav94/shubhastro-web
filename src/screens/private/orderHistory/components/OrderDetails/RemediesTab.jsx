import React from "react";
import { Download, Calendar, FileText } from "lucide-react";
import styles from "./RemediesTab.module.scss";

const RemediesTab = ({ remedies }) => {
  return (
    <div className={styles.remediesTab}>
      {remedies.map((remedy) => (
        <div key={remedy.id} className={styles.remedyCard}>
          <div className={styles.remedyHeader}>
            <div className={styles.iconWrapper}>
              <FileText size={24} />
            </div>
            <div className={styles.remedyInfo}>
              <h4 className={styles.remedyTitle}>{remedy.title}</h4>
              <p className={styles.remedyDate}>
                <Calendar size={14} />
                {remedy.date}
              </p>
            </div>
          </div>
          <p className={styles.remedyNotes}>{remedy.notes}</p>
          <button className={styles.downloadButton}>
            <Download size={16} />
            Download PDF
          </button>
        </div>
      ))}
    </div>
  );
};

export default RemediesTab;
