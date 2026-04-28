import { useState } from "react";
import styles from "./ChartSection.module.scss";

const ChartSection = ({ chart, isLoading }) => {
  const [showZoom, setShowZoom] = useState(false);

  if (isLoading) return <div className={styles.skeleton} />;
  if (!chart?.chartUrl) return <div className={styles.empty}><span>📊</span><p>Chart not available yet.</p></div>;

  const handleDownload = async () => {
    const res = await fetch(chart.chartUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lal-kitab-chart.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartWrap}>
        <img src={chart.chartUrl} alt="Lal Kitab Chart" className={styles.chartImg} onClick={() => setShowZoom(true)} />
      </div>
      <button className={styles.downloadBtn} onClick={handleDownload}>⬇ Download Chart</button>

      {showZoom && (
        <div className={styles.zoomOverlay} onClick={() => setShowZoom(false)}>
          <img src={chart.chartUrl} alt="Lal Kitab Chart" className={styles.zoomImg} />
        </div>
      )}
    </div>
  );
};

export default ChartSection;
