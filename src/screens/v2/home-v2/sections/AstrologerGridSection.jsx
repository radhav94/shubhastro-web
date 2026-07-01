import { memo, useMemo, useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";

const AstrologersSection = lazy(() => import("../../home/components/AstrologersSection"));

// Is this the emergency / "URGENT GUIDANCE" grid (vs. a generic top-rated grid)?
const isEmergencySection = (sectionData) => {
  const fields = [sectionData?.slug, sectionData?.display_title, sectionData?.title, sectionData?.type];
  return fields.some((f) => typeof f === "string" && /urgent|emergency/i.test(f));
};

const AstrologerGridSection = memo(({ sectionData, styles, onConnect }) => {
  const navigate = useNavigate();
  const astrologers = useMemo(() => sortContentByOrder(sectionData?.content || []), [sectionData?.content]);

  const emergency = isEmergencySection(sectionData);

  // Track which astrologers are currently live — seeded from the section data and
  // kept in sync via the global live:astrologer_status socket event.
  const [liveIds, setLiveIds] = useState(() => {
    const set = new Set();
    astrologers.forEach((a) => {
      if (a?.astrologerLiveStatus?.isLive === true && a?._id) set.add(a._id);
    });
    return set;
  });

  // Re-seed when the section content changes.
  useEffect(() => {
    const set = new Set();
    astrologers.forEach((a) => {
      if (a?.astrologerLiveStatus?.isLive === true && a?._id) set.add(a._id);
    });
    setLiveIds(set);
  }, [astrologers]);

  // Real-time updates: add/remove astrologers as they go live/offline.
  useEffect(() => {
    if (!emergency) return undefined;
    const handler = (event) => {
      const data = event?.detail;
      const hostId = data?.hostId;
      if (!hostId) return;
      setLiveIds((prev) => {
        const next = new Set(prev);
        if (data.status === "started") next.add(hostId);
        else next.delete(hostId);
        return next;
      });
    };
    window.addEventListener("live:astrologer_status", handler);
    return () => window.removeEventListener("live:astrologer_status", handler);
  }, [emergency]);

  // In the emergency tray, hide astrologers who are currently live.
  const visibleAstrologers = useMemo(() => {
    if (!emergency) return astrologers;
    return astrologers.filter((a) => !liveIds.has(a?._id));
  }, [emergency, astrologers, liveIds]);

  // Hide the whole section when nothing is left to show.
  if (!visibleAstrologers.length) return null;

  return (
    <section
      className={styles.astrologerSection}
      style={{ backgroundColor: "#FFE9E5", paddingBottom: "1px", paddingTop: "16px", paddingRight: "0px" }}
    >
      <div className={styles.sectionHeader} style={{ marginBottom: "0px" }}>
        <div className={styles.sectionTitleBlock}>
          <h2 className={styles.sectionTitle}>
            {sectionData?.display_title || sectionData?.title || "TOP RATED ASTROLOGERS FOR YOU"}
          </h2>
        </div>
        {sectionData?.show_more && (
          <button
            className={styles.viewAllBtn}
            style={{ marginRight: "16px" }}
            onClick={() => navigate("/chat-to-astrologer")}
          >
            View All →
          </button>
        )}
      </div>
      <Suspense fallback={null}>
        <AstrologersSection
          title=""
          className={`${styles.astrologerCard1} ${styles.anotherClass}`}
          astrologers={visibleAstrologers}
          onConnect={onConnect}
        />
      </Suspense>
    </section>
  );
});

AstrologerGridSection.displayName = "AstrologerGridSection";

export default AstrologerGridSection;
