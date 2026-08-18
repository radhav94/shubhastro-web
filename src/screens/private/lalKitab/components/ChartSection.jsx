import { useState } from "react";
import styles from "./ChartSection.module.scss";
import Toast from "../../../../component/toast";
import { downloadFile, toastDownloadOutcome } from "../../../../utils/helper/downloadFile";

const ChartSection = ({ chart, isLoading }) => {
  const [showZoom, setShowZoom] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) return <div className={styles.skeleton} />;
  if (!chart?.chartUrl) return <div className={styles.empty}><span>📊</span><p>Chart not available yet.</p></div>;

  // Previously this fetched a blob and clicked a *detached* anchor with no
  // success or failure message at all — so in an in-app webview (Instagram,
  // Facebook), or any browser that ignores a click on an unattached element,
  // the button did nothing and said nothing.
  const handleDownload = async () => {
    if (isDownloading) {
      Toast.info("Saving the chart…");
      return;
    }
    setIsDownloading(true);
    try {
      const outcome = await downloadFile(chart.chartUrl, "lal-kitab-chart.png");
      toastDownloadOutcome(outcome, "Chart");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.chartWrap}
        onClick={() => setShowZoom(true)}
        aria-label="Enlarge Laal Kitab chart"
      >
        <img src={chart.chartUrl} alt="Laal Kitab Chart" className={styles.chartImg} />
      </button>
      <button
        type="button"
        className={styles.downloadBtn}
        onClick={handleDownload}
        aria-disabled={isDownloading}
        aria-busy={isDownloading}
      >
        {isDownloading ? "Saving…" : "⬇ Download Chart"}
      </button>

      {/* Tapping anywhere still dismisses, but there is now a real button for it
          instead of that being the only, undiscoverable way out. */}
      {showZoom && (
        <div
          className={styles.zoomOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Laal Kitab chart"
          onClick={() => setShowZoom(false)}
        >
          <img src={chart.chartUrl} alt="Laal Kitab Chart" className={styles.zoomImg} />
          <button
            type="button"
            className={styles.zoomClose}
            onClick={() => setShowZoom(false)}
            aria-label="Close enlarged chart"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ChartSection;
