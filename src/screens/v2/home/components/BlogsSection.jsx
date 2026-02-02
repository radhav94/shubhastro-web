import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";

export function formatDateToReadable(input) {
  const [day, month, year] = input.split("/").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const BlogsSection = ({ blogData = [], title, showMore }) => {
  const navigate = useNavigate();

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
            <span className={styles.dividerMoon}>☾</span>
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
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className={styles.blogsGrid}>
        {blogData.map((blog, i) => (
          <div
            key={i}
            className={styles.blogCard}
            onClick={() =>
              navigate(
                PATH.privateRoutes.SINGLEBLOG.path.replace(
                  ":slug",
                  blog.blogId,
                ),
              )
            }
            style={{ cursor: "pointer" }}
          >
            <div className={styles.blogImageWrapper}>
              <img
                src={blog.imageUrl || blog}
                alt={blog.title}
                className={styles.blogImage}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className={styles.blogContent}>
              <h3 className={styles.blogTitle}>{blog.title}</h3>
              <p className={styles.blogDate}>
                {formatDateToReadable(blog.publishDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BlogsSection;
