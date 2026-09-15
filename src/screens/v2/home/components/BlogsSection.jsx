import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toast } from "../../../../component";
import dayjs from "dayjs";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import useHorizontalScrollState from "../../../../hooks/useHorizontalScrollState";
import styles from "./sharedSections.module.scss";
import { DefaultImages } from "../../../../utils/appImages";
import defaultBlogImg from "../../../../assets/images/default_image_16x9_1920x1080.png";

export function formatDateToReadable(input) {
  if (!input) return "";
  let date;
  // Handle DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [day, month, year] = input.split("/");
    date = dayjs(`${year}-${month}-${day}`);
  } else {
    date = dayjs(input);
  }
  return date.isValid() ? date.format("DD MMM YYYY") : input;
}

const BlogsSection = ({ blogData = [], title, showMore, gridRef, onScrollableChange }) => {
  const navigate = useNavigate();

  // Report horizontal scrollability to a parent that renders external slider buttons.
  const { canScrollLeft, canScrollRight } = useHorizontalScrollState(gridRef, [blogData]);
  useEffect(() => {
    onScrollableChange?.({ canScrollLeft, canScrollRight });
  }, [canScrollLeft, canScrollRight, onScrollableChange]);

  const handleUnavailableBlog = () => {
    Toast.error("This article isn't available yet.");
  };

  if (!blogData || blogData.length === 0) return null;

  return (
    <section className={styles.blogsSection}>
      <div className={styles.blogsHeader}>
        <div className={styles.blogsHeaderLeft}>
          <h2 className={styles.blogsTitle}>
            {title || "EXPLORE BLOGS AND IN THE NEWS"}
          </h2>
          <div className={styles.titleDivider}>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="53"
                height="1"
                viewBox="0 0 53 1"
                fill="none"
              >
                <path
                  d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z"
                  fill="#2A161B"
                  fillOpacity="0.2"
                />
              </svg>
            </div>
            <span className={styles.dividerMoon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="53"
                height="1"
                viewBox="0 0 53 1"
                fill="none"
              >
                <path
                  d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z"
                  fill="#2A161B"
                  fillOpacity="0.2"
                />
              </svg>
            </div>
          </div>
        </div>
        {showMore && (
          <button
            className={styles.viewAllBtn}
            onClick={() => navigate(PATH.privateRoutes.BLOG.path)}
          >
            View all ›
          </button>
        )}
      </div>

      <div className={styles.blogsGrid} ref={gridRef}>
        {blogData.map((blog, i) => {
          /*
           * `blog.slug || blog._id` was interpolated straight into the path. With
           * neither present, String.replace stringifies undefined and the card
           * navigated to /blog/undefined — a real navigation to a page that can
           * never resolve. Resolve the target first and keep the card honest:
           * a real <Link> when there is somewhere to go (so it works with
           * keyboard, middle-click and cmd/ctrl-click, and shows its destination
           * on hover), and a dimmed, still-clickable card that explains itself
           * when there is not.
           */
          const slug = blog.slug || blog._id;
          const cardBody = (
            <>
            <div className={styles.blogImageWrapper}>
              {/* alt="" — blog.title is the <h3> in .blogContent below, so
                  repeating it here made a screen reader read the headline twice
                  for every card. Empty rather than absent so the image is
                  treated as decorative instead of falling back to its filename. */}
              <img
                src={blog.image?.small || blog.img || defaultBlogImg}
                alt=""
                className={styles.blogImage}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultBlogImg;
                }}
              />
            </div>
            <div className={styles.blogContent}>
              <h3 className={styles.blogTitle}>{blog.title}</h3>
              <p className={styles.blogDate}>
                {formatDateToReadable(blog.publishDate)}
              </p>
            </div>
            </>
          );

          return slug ? (
            <Link
              key={i}
              to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", slug)}
              className={styles.blogCard}
            >
              {cardBody}
            </Link>
          ) : (
            <div
              key={i}
              className={`${styles.blogCard} ${styles.blogCardUnavailable}`}
              role="button"
              tabIndex={0}
              aria-disabled="true"
              onClick={handleUnavailableBlog}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleUnavailableBlog();
                }
              }}
            >
              {cardBody}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BlogsSection;
