import styles from "./ResultHistoryCard.module.scss";
import TTSButton from "../../../../component/UI/TTSButton";
const statusConfig = {
  completed: { label: "Completed", className: "statusCompleted" },
  failed: { label: "Failed", className: "statusFailed" },
  pending: { label: "Pending", className: "statusPending" },
};

const ResultHistoryCard = ({ item }) => {
  const {
    featureName,
    featureIcon,
    status = "completed",
    date,
    summary,
    isPaid,
    price,
    onViewResult,
    onDownload,
  } = item;

  const statusInfo = statusConfig[status] || statusConfig.completed;

  return (
    <div className={styles.card}>

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.featureInfo}>
          <div className={styles.iconWrap}>
            {featureIcon ? (
              <img src={featureIcon} alt={featureName} className={styles.icon} />
            ) : (
              <span className={styles.iconFallback}>✦</span>
            )}
          </div>
          <span className={styles.featureName}>{featureName}</span>
          <span style={{top: '8px', right: '8px', display: 'inline-flex', zIndex: 1 }} onClick={(e) => e.stopPropagation()}>
        <TTSButton text={`${[featureName,statusInfo?.label,date,`Overall Analysis`,summary,`Download your detailed analysis report`].filter(Boolean).join('. ')}`} />
      </span>
        </div>
        <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <p className={styles.date}>{date}</p>
        <p className={styles.analysisLabel}>Overall Analysis</p>
        <p className={styles.summary}>{summary}</p>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.downloadWrap}>
          <span className={styles.downloadHint}>Download your detailed analysis report</span>
          <span className={isPaid ? styles.paidRibbon : styles.freeRibbon}>
            {isPaid ? "Paid" : "Free"}
          </span>
          <div className={styles.downloadBtnWrap}>
            <button className={styles.downloadBtn} onClick={onDownload}>
              <DownloadIcon />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 16L7 11H10V4H14V11H17L12 16Z" />
    <path d="M5 20H19V18H5V20Z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

export default ResultHistoryCard;
