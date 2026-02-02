import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./PopularBlogsSection.module.scss";

const PopularBlogsSection = ({ blogs = [], title, subtitle }) => {
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
    <div className={styles.popularBlogsSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.titleDivider}>
            <div className={styles.dividerLine}>
              <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                <path d="M92.803 0.406393C92.803 0.630933 90.7481 0.812789 88.2131 0.812789C85.6781 0.812789 0 0.630933 0 0.406393C0 0.181853 85.6786 0 88.2131 0C90.7481 0 92.803 0.181853 92.803 0.406393Z" fill="#030303"/>
              </svg>
            </div>
            <span className={styles.dividerMoon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
            <div className={styles.dividerLine}>
              <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                <path d="M-4.06066e-06 0.406393C-4.06066e-06 0.630933 2.05498 0.812789 4.58996 0.812789C7.12494 0.812789 92.803 0.630933 92.803 0.406393C92.803 0.181853 7.12439 0 4.58996 0C2.05498 0 -4.06066e-06 0.181853 -4.06066e-06 0.406393Z" fill="#030303"/>
              </svg>     
            </div>
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

export default PopularBlogsSection;
