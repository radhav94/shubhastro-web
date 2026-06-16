import { useParams, useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  useGetSingleBlogQuery,
  useGetRelatedBlogsQuery,
  useGetBlogQuery,
} from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";
import MoreBlogsCarousel from "../../../../component/UI/cards/MoreBlogsCarousel";
import TTSButton from "../../../../component/UI/TTSButton";
import { PATH } from "../../../../utils/routes/Paths";
import { DefaultImages } from "../../../../utils/appImages";

const SingleBlogDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetSingleBlogQuery(slug);
  const singleBLogData = data?.data;

  // Fetch related blogs (matches by tags)
  const { data: relatedData, isLoading: relatedLoading } = useGetRelatedBlogsQuery(
    { blogId: singleBLogData?._id, page: 1, limit: 6 },
    { skip: !singleBLogData?._id }
  );

  // Fallback list for the "Most Popular" sidebar
  const { data: allBlogsData } = useGetBlogQuery({ page: 1, limit: 7 });

  const relatedBlogs = relatedData?.data || [];
  const allBlogs = allBlogsData?.data || [];

  // The single-blog endpoint may not return `author`; fall back to the
  // matching entry from the list endpoint (which does include author).
  const blogAuthor =
    singleBLogData?.author ||
    allBlogs.find((b) => b._id === singleBLogData?._id || b.slug === slug)?.author ||
    relatedBlogs.find((b) => b._id === singleBLogData?._id || b.slug === slug)?.author ||
    "";

  // Sidebar list: prefer related blogs, fallback to all blogs, exclude current
  const popularBlogs = (relatedBlogs.length > 0 ? relatedBlogs : allBlogs)
    .filter((b) => (b.slug || b._id) !== slug && b._id !== singleBLogData?._id)
    .slice(0, 6);

  const cleanText = singleBLogData?.body
    ?.replace(/<[^>]+>/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim();

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      navigator.share({ title: singleBLogData?.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  if (isLoading) return <p style={{ textAlign: "center", padding: "60px" }}>Loading...</p>;
  if (!singleBLogData) return <p style={{ textAlign: "center", padding: "60px" }}>No blog found</p>;

  return (
    <div className={styles.pageWrapper}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to={PATH.privateRoutes.HOME.path}>Home</Link>
        <span className={styles.sep}>›</span>
        <Link to={PATH.privateRoutes.BLOG.path}>Blogs</Link>
        <span className={styles.sep}>›</span>
        <span className={styles.current}>{singleBLogData.title}</span>
      </nav>

      <div className={styles.contentLayout}>
        {/* LEFT: Article */}
        <article className={styles.article}>
          {/* Title */}
          <h1 className={styles.title}>{singleBLogData.title}</h1>

          {/* Meta row: author | date + TTS/share */}
          <div className={styles.metaRow}>
            <div className={styles.metaInfo}>
              {singleBLogData.author && (
                <span className={styles.author}>{singleBLogData.author}</span>
              )}
              <span className={styles.date}>
                {dayjs(singleBLogData.publishDate).format("DD MMM, YYYY")}
              </span>
            </div>
            <div className={styles.metaActions}>
              <TTSButton
                text={`${[singleBLogData?.title, singleBLogData?.author, cleanText]
                  .filter(Boolean)
                  .join(". ")}`}
              />
              <button className={styles.shareBtn} onClick={handleShare} aria-label="Share blog">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 20" fill="none">
                  <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Banner Image */}
          <img
            src={singleBLogData.img || DefaultImages.BlogsDefault}
            alt={singleBLogData.title}
            className={styles.bannerImage}
          />

          {/* Blog Content */}
          <div
            className={styles.blogContent}
            dangerouslySetInnerHTML={{ __html: singleBLogData.body }}
          ></div>
        </article>

        {/* RIGHT: Most Popular Blogs */}
        {popularBlogs.length > 0 && (
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>MOST POPULAR BLOGS</h2>
            <ul className={styles.popularList}>
              {popularBlogs.map((blog) => (
                <li key={blog._id || blog.blogId}>
                  <Link
                    to={PATH.privateRoutes.SINGLEBLOG.path.replace(
                      ":slug",
                      blog.slug || blog._id
                    )}
                    className={styles.popularItem}
                  >
                    <span className={styles.popularAuthor}>{blog.author || "ShubhAstro"}</span>
                    <h3 className={styles.popularItemTitle}>{blog.title}</h3>
                    <div className={styles.popularMeta}>
                      <span className={styles.popularDate}>
                        {dayjs(blog.publishDate).format("DD MMM, YYYY")}
                      </span>
                      <span className={styles.popularShare} aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 18 20" fill="none">
                          <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                        </svg>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {/* Related Blogs Carousel */}
      {!relatedLoading && relatedBlogs.length > 0 && (
        <MoreBlogsCarousel
          blogs={relatedBlogs}
          currentBlogId={slug}
          title="RELATED BLOGS"
          className={styles.relatedblogs}
        />
      )}
    </div>
  );
};

export default SingleBlogDetails;
