import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./PopularBlogsSection.module.scss";
import { DefaultImages } from "../../../utils/appImages";

const PopularBlogsSection = ({ blogs = [], title, subtitle }) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);

  const getBlogUrl = (blog) => {
    return `${window.location.origin}/blog/${blog.slug || blog._id}`;
  };

  const handleShare = (e, platform, blog) => {
    e.stopPropagation();
    const url = getBlogUrl(blog);
    switch (platform) {
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy": {
        const blogId = blog.blogId || blog._id;
        navigator.clipboard.writeText(url);
        setCopiedId(blogId);
        setTimeout(() => setCopiedId(null), 2000);
        break;
      }
    }
  };

  const handleBlogClick = (blog) => {
    const slug = blog.slug || blog._id;
    if (!slug) {
      console.error('Blog slug is missing:', blog);
      return;
    }
    navigate(PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", slug));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!blogs || blogs.length === 0) return null;

  // Show first 8 blogs to ensure scrolling
  const displayBlogs = blogs.slice(0, 8);

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
                src={blog.imageUrl || DefaultImages.BlogsDefault}
                alt={blog.title}
                className={styles.blogImage}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x300?text=Blog+Image";
                }}
              />
            </div>
            <div className={styles.content}>
              <h3 className={styles.blogTitle}>{blog.title}</h3>
              <div className={styles.dateShareRow}>
                <p className={styles.blogDate}>
                  {blog.publishDate || blog.createdAt || blog.date
                    ? (() => {
                        const dateValue = blog.publishDate || blog.createdAt || blog.date;
                        let date;
                        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
                          const [day, month, year] = dateValue.split('/');
                          date = dayjs(`${year}-${month}-${day}`);
                        } else {
                          date = dayjs(dateValue);
                        }
                        return date.isValid() ? date.format("DD MMM, YYYY") : dateValue;
                      })()
                    : ""}
                </p>
                <div className={styles.shareBtnMain} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.shareBtn} aria-label="Share blog">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 20" fill="none">
                      <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                    </svg>
                  </button>
                  <div className={styles.shareIconSocial}>
                    <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "whatsapp", blog)}>
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                    </span>
                    <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "facebook", blog)}>
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                    </span>
                    <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "copy", blog)}>
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      {copiedId === (blog.blogId || blog._id) && <span className={styles.copiedText}>Copied!</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularBlogsSection;
