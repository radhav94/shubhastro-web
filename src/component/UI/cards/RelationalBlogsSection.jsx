import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./RelationalBlogsSection.module.scss";

const RelationalBlogsSection = ({ blogs = [], title, subtitle }) => {
  const navigate = useNavigate();

  const handleBlogClick = (blog) => {
    const blogId = blog.blogId || blog._id;
    if (!blogId) {
      console.error('Blog ID is missing:', blog);
      return;
    }
    navigate(PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blogId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!blogs || blogs.length === 0) return null;

  // Show first 6 blogs
  const displayBlogs = blogs.slice(0, 6);

  return (
    <div className={styles.relationalBlogsSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.titleDivider}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerMoon}>☾</span>
          <div className={styles.dividerLine}></div>
        </div>
      </div>

      <div className={styles.blogsGrid}>
        {displayBlogs.map((blog) => (
          <div
            key={blog._id || blog.blogId}
            className={styles.blogCard}
            onClick={() => handleBlogClick(blog)}
          >
            <div className={styles.imageWrapper}>
              <img
                src={blog.imageUrl || blog.img}
                alt={blog.title}
                className={styles.blogImage}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x300?text=Blog+Image";
                }}
              />
            </div>
            <div className={styles.content}>
              <h3 className={styles.blogTitle}>{blog.title}</h3>
              <p className={styles.blogDate}>
                {blog.publishDate || blog.createdAt || blog.date
                  ? (() => {
                      const dateValue = blog.publishDate || blog.createdAt || blog.date;
                      const date = dayjs(dateValue);
                      return date.isValid() ? date.format("DD MMM YYYY") : dateValue;
                    })()
                  : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelationalBlogsSection;
