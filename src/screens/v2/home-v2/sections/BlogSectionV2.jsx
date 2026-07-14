import { memo, Suspense, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BlogsSection from "../../home/components/BlogsSection";

const BlogSectionV2 = memo(({ sectionData, styles }) => {
  const blogData = sectionData?.content || [];
  const gridRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  const scrollByCards = useCallback((direction) => {
    const grid = gridRef.current;
    if (!grid) return;
    const amount = Math.max(grid.clientWidth * 0.8, 240);
    grid.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  if (!blogData.length) return null;

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
      <section className={styles.blogSection} style={{ paddingRight: "0px" }}>
        <Suspense fallback={null}>
          <BlogsSection
            blogData={blogData}
            title={sectionData?.display_title || sectionData?.title || "NEWS / BLOGS"}
            showMore={sectionData?.show_more !== false}
            gridRef={gridRef}
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

BlogSectionV2.displayName = "BlogSectionV2";

export default BlogSectionV2;
