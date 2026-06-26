import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./BlogHeader.module.scss";
import { BlogCard } from "../../../../component";
import Pagination from "../../../../component/pagination/Pagination";
import { useGetBlogQuery, useGetBlogCategoriesQuery } from "../../../../services/appServices/blogService";
import { PATH } from "../../../../utils/routes/Paths";

const BlogHeader = () => {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(""); // "" = All Blogs

  const { data: categoriesData } = useGetBlogCategoriesQuery();
  const { data, isLoading } = useGetBlogQuery({ page, limit: 12, category: activeCategory });

  const categories = categoriesData?.data || [];
  const hasCategories = categories.length > 0;
  const blogs = data?.data || [];
  const pagination = data?.pagination;

  // Results count: "Showing X to Y of Z results"
  const total = pagination?.totalDocs ?? blogs.length;
  const limit = pagination?.limit ?? 12;
  const currentPage = pagination?.page ?? page;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = Math.min(currentPage * limit, total);

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

          {isLoading ? (
            <p className={styles.emptyState}>Loading blogs...</p>
          ) : blogs.length > 0 ? (
            <>
              <div className={styles.blogsContainer}>
                {blogs.map((blog, index) => (
                  <Link
                    key={blog._id}
                    to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog.slug || blog._id)}
                    className={`${styles.blogLink} ${index === 0 ? styles.featured : ""}`}
                  >
                    <BlogCard
                      image={blog.img}
                      title={blog.title}
                      author={blog.author}
                      date={blog.publishDate}
                      blogId={blog.blogId || blog._id}
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
