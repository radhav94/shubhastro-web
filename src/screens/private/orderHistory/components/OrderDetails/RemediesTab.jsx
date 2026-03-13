import React from "react";
import { Download, Calendar, FileText, FileQuestion } from "lucide-react";
import styles from "./RemediesTab.module.scss";

const RemediesTab = ({ remedies }) => {
  // Check if remedies data is empty or not available
  const hasRemedies = remedies && remedies.length > 0;



  return (
    <div className={styles.remediesTab}>
      {hasRemedies ? (
        // Show remedies list when data is available
        remedies.map((remedy) => (
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
        ))
      ) : (
        // Show empty state when no remedies are available
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FileQuestion size={48} />
          </div>
          <h3 className={styles.emptyStateTitle}>No Remedies Available</h3>
          <p className={styles.emptyStateMessage}>
            Remedies will be available soon. Check back later for personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default RemediesTab;
