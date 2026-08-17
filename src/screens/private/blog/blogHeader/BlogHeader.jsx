import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./BlogHeader.module.scss";
import { BlogCard } from "../../../../component";
import Pagination from "../../../../component/pagination/Pagination";
import toast from "../../../../component/toast";
import { useGetBlogQuery, useGetBlogCategoriesQuery } from "../../../../services/appServices/blogService";
import { PATH } from "../../../../utils/routes/Paths";

const BlogHeader = () => {
  // Category and page live in the URL, not component state.
  //
  // As local state they caused two problems. The "Blog" nav link points at
  // /blog, so tapping it while already on /blog re-navigated without remounting
  // this component — the filter and page survived and nothing visibly changed,
  // which is a dead click on a link that looks like the way back to the full
  // list. And because a real route change *does* remount, reading an article and
  // pressing Back silently threw the reader's category and page away.
  //
  // In the URL, both are fixed at once: /blog with no query genuinely means
  // "All Blogs, page 1", and back/forward restore whatever the reader had.
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category") || ""; // "" = All Blogs

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data: categoriesData } = useGetBlogCategoriesQuery();
  const { data, isLoading, isFetching } = useGetBlogQuery({ page, limit: 12, category: activeCategory });

  // Every page or category change is a fresh cache entry, so RTK Query hands
  // back `data: undefined` while it loads. Rendering that state meant the whole
  // grid *and the pagination itself* were replaced by one line of "Loading
  // blogs..." — the control the reader had just tapped vanished from under their
  // finger, and the second tap landed on empty layout. Keep the outgoing page on
  // screen, dimmed, until the next one arrives.
  const lastLoadedRef = useRef(null);
  if (data) lastLoadedRef.current = data;
  const shown = data || lastLoadedRef.current;

  const categories = categoriesData?.data || [];
  const hasCategories = categories.length > 0;
  const blogs = shown?.data || [];
  const pagination = shown?.pagination;
  const isStale = isFetching && !data;

  // Results count: "Showing X to Y of Z results"
  const total = pagination?.totalDocs ?? blogs.length;
  const limit = pagination?.limit ?? 12;
  const currentPage = pagination?.page ?? page;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = Math.min(currentPage * limit, total);

  // Defaults are represented by the absence of a param rather than
  // `?category=&page=1`, so the canonical "everything" view stays a clean /blog.
  //
  // A tap that resolves to the URL we are already on is not navigation: it would
  // push a duplicate history entry (so Back appears to do nothing) and change
  // nothing on screen. Acknowledge it instead, and take the reader to the top of
  // the list they asked to see.
  const applyParams = (next, alreadyHereMessage) => {
    if (next.toString() === searchParams.toString()) {
      toast.info(alreadyHereMessage);
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    setSearchParams(next);
  };

  const handleCategoryChange = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    next.delete("page"); // a different filter starts from the first page
    const label = slug
      ? categories.find((cat) => cat.slug === slug)?.name || "this category"
      : "all blogs";
    applyParams(next, `Already showing ${label}.`);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    if (newPage > 1) next.set("page", String(newPage));
    else next.delete("page");
    applyParams(next, `You're already on page ${newPage}.`);
    // Scrolling on a real page change is deliberately not done here: that is a
    // route change, so ScrollToTop already takes the page to the top. Doing it
    // here too meant two scroll mechanisms competing for the same frame.
  };

  return (
    <section className={styles.blogSection}>
      <div className={`${styles.layout} ${!hasCategories ? styles.layoutFull : ""}`}>
        {/* Sidebar - Categories */}
        {hasCategories && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
          <div className={styles.sidebarTitle}>
            <span className={styles.sidebarTitleLeft}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#F75801" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Categories</span>
            </span>
          </div>
          <ul className={styles.categoryList}>
            <li>
              <button
                type="button"
                className={`${styles.categoryItem} ${activeCategory === "" ? styles.categoryActive : ""}`}
                onClick={() => handleCategoryChange("")}
              >
                All Blogs
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat._id || cat.ID}>
                <button
                  type="button"
                  className={`${styles.categoryItem} ${activeCategory === cat.slug ? styles.categoryActive : ""}`}
                  onClick={() => handleCategoryChange(cat.slug)}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
          </div>
        </aside>
        )}

        {/* Main content */}
        <div className={styles.main}>
          <div className={styles.headerSection}>
            <h2 className={styles.headerTitle}>ALL BLOGS</h2>
          </div>

          {isLoading && !shown ? (
            <p className={styles.emptyState}>Loading blogs...</p>
          ) : blogs.length > 0 ? (
            <>
              <div
                className={`${styles.blogsContainer} ${isStale ? styles.loadingPage : ""}`}
                aria-busy={isStale}
              >
                {blogs.map((blog, index) => (
                  <Link
                    key={blog._id}
                    to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog.slug || blog._id)}
                    className={`${styles.blogLink} ${index === 0 ? styles.featured : ""}`}
                  >
                    <BlogCard
                      image={blog?.image?.small || blog?.img}
                      title={blog.title}
                      author={blog.author}
                      date={blog.publishDate}
                      blogId={blog.blogId || blog._id}
                      slug={blog.slug}
                    />
                  </Link>
                ))}
              </div>

              {pagination && (
                <div className={styles.footerRow}>
                  <p className={styles.resultsCount}>
                    Showing <strong>{rangeStart} to {rangeEnd}</strong> of {total} results
                  </p>
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          ) : (
            <p className={styles.emptyState}>No blogs available at the moment.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogHeader;
