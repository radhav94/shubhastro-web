import { memo, useMemo, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";

const AstrologersSection = lazy(() => import("../../home/components/AstrologersSection"));

const AstrologerGridSection = memo(({ sectionData, styles, onConnect }) => {
  const navigate = useNavigate();
  const astrologers = useMemo(() => sortContentByOrder(sectionData?.content || []), [sectionData?.content]);

  if (!astrologers.length) return null;

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
          astrologers={astrologers}
          onConnect={onConnect}
        />
      </Suspense>
    </section>
  );
});

AstrologerGridSection.displayName = "AstrologerGridSection";

export default AstrologerGridSection;
