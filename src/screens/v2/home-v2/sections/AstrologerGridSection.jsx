import { memo, useMemo, useRef, useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sortContentByOrder } from "../sectionRendererV2";

const AstrologersSection = lazy(() => import("../../home/components/AstrologersSection"));

// Is this the emergency / "URGENT GUIDANCE" grid (vs. a generic top-rated grid)?
const isEmergencySection = (sectionData) => {
  const fields = [sectionData?.slug, sectionData?.display_title, sectionData?.title, sectionData?.type];
  return fields.some((f) => typeof f === "string" && /urgent|emergency/i.test(f));
};

const AstrologerGridSection = memo(({ sectionData, styles, onConnect }) => {
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);
  const astrologers = useMemo(() => sortContentByOrder(sectionData?.content || []), [sectionData?.content]);

  const scrollByCards = useCallback((direction) => {
    const grid = gridRef.current;
    if (!grid) return;
    const amount = Math.max(grid.clientWidth * 0.8, 240);
    grid.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

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

  // Track real-time online/offline via the astrologer:status socket event.
  // Seeded implicitly from each astrologer's isActive.
  const [statusOverrides, setStatusOverrides] = useState({});

  useEffect(() => {
    const handler = (event) => {
      const data = event?.detail;
      const id = data?.astrologerId;
      if (!id) return;
      setStatusOverrides((prev) => ({ ...prev, [id]: data.isActive === true }));
    };
    window.addEventListener("astrologer:status", handler);
    return () => window.removeEventListener("astrologer:status", handler);
  }, []);

  const isOnline = useCallback(
    (a) => {
      const override = statusOverrides[a?._id];
      return override !== undefined ? override : a?.isActive === true;
    },
    [statusOverrides]
  );

  // Emergency tray: only offline astrologers — remove those who are online or
  // currently live. Other grids: show only astrologers who are online.
  const visibleAstrologers = useMemo(() => {
    if (emergency) {
      return astrologers.filter((a) => !liveIds.has(a?._id) && !isOnline(a));
    }
    return astrologers.filter((a) => isOnline(a));
  }, [emergency, astrologers, liveIds, isOnline]);

  // Hide the whole section when nothing is left to show.
  if (!visibleAstrologers.length) return null;

  return (
    <div className={styles.astrologerSliderWrapper} style={{ position: "relative" }}>
      {canScroll && (
        <button
          type="button"
          className={`${styles.gridSliderBtn} ${styles.gridSliderBtnLeft}`}
          onClick={() => scrollByCards("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}
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
              onClick={() => navigate("/astrologers")}
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
            gridRef={gridRef}
            hideSliderButtons
            onScrollableChange={setCanScroll}
          />
        </Suspense>
      </section>
      {canScroll && (
        <button
          type="button"
          className={`${styles.gridSliderBtn} ${styles.gridSliderBtnRight}`}
          onClick={() => scrollByCards("right")}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
});

AstrologerGridSection.displayName = "AstrologerGridSection";

export default AstrologerGridSection;
