import { memo, Suspense, lazy } from "react";

const BlogsSection = lazy(() => import("../../home/components/BlogsSection"));

const BlogSectionV2 = memo(({ sectionData, styles }) => {
  const blogData = sectionData?.content || [];

  if (!blogData.length) return null;

  return (
    <section className={styles.blogSection} style={{ paddingRight: "0px" }}>
      <Suspense fallback={null}>
        <BlogsSection
          blogData={blogData}
          title={sectionData?.display_title || sectionData?.title || "NEWS / BLOGS"}
          showMore={sectionData?.show_more !== false}
        />
      </Suspense>
    </section>
  );
});

BlogSectionV2.displayName = "BlogSectionV2";

export default BlogSectionV2;
