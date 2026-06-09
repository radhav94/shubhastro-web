import { memo, useMemo } from "react";
import { sortContentByOrder } from "../sectionRendererV2";

const DEFAULT_STATS = [
  { count: 234, description: "users in active consultations" },
  { count: 47, description: "Kundlis generated today" },
  { count: 8, description: "Laal Kitab remedies tried tonight" },
  { count: 12, description: "new chats started in the last hour" },
];

const LiveTrackingSection = memo(({ sectionData, styles }) => {
  const stats = useMemo(() => {
    if (sectionData?.content?.length > 0) return sortContentByOrder(sectionData.content);
    return DEFAULT_STATS;
  }, [sectionData?.content]);

  return (
    <section className={styles.liveSection}>
      <div className={styles.liveBadge}>
        <span className={styles.liveDot} />
        {sectionData?.quick_message || "LIVE TRACKING"}
      </div>

      <h2 className={styles.liveHeading}>
        {sectionData?.display_title || sectionData?.title || "Real People. Real Consultations. Right Now."}
      </h2>
      <p className={styles.liveSubtitle}>
        {sectionData?.description || "Live updates from ShubhAstro community"}
      </p>

      <div className={styles.liveStats}>
        {stats.map((s, i) => (
          <div key={s.slug || s.description || i} className={styles.statCard}>
            <div className={styles.circleAndCount}>
              {s.icon ? (
                <img src={s.icon} alt="" className={styles.statIcon} loading="lazy" />
              ) : (
                <div className={styles.statCircle} />
              )}
              <span className={styles.statNum}>{(s.count ?? 0).toLocaleString()}</span>
            </div>
            <span className={styles.statLabel}>{s.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
});

LiveTrackingSection.displayName = "LiveTrackingSection";

export default LiveTrackingSection;
