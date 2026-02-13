import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./TrendingBlogsCarousel.module.scss";
import { DefaultImages } from "../../../utils/appImages";

const TrendingBlogsCarousel = ({ blogs = [], title, subtitle }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter blogs
  const filteredBlogs = blogs;

  // Check scroll position
  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el || filteredBlogs.length === 0) return;

    const cardWidth = el.scrollWidth / filteredBlogs.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setCurrentIndex(index);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition);

    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [filteredBlogs.length]);

  const scrollToIndex = (index) => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = el.scrollWidth / filteredBlogs.length;
    el.scrollTo({ left: cardWidth * index, behavior: "smooth" });
  };

  const handleBlogClick = (blog) => {
    const blogId = blog.blogId || blog._id;
    if (!blogId) {
      console.error('Blog ID is missing:', blog);
      return;
    }
    navigate(PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blogId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!filteredBlogs || filteredBlogs.length === 0) return null;

  return (
    <div className={styles.trendingSection}>
      {/* <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div> */}

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselContainer} ref={scrollRef}>
          {filteredBlogs.map((blog) => (
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
                    e.target.src = "https://via.placeholder.com/1200x400?text=Blog+Image";
                  }}
                />
                <div className={styles.overlay}>
                  {/* Navigation Dots */}
                  <div className={styles.dotsContainer}>
                    {filteredBlogs.map((_, index) => (
                      <button
                        key={index}
                        className={`${styles.dot} ${
                          index === currentIndex ? styles.activeDot : ""
                        }`}
                        onClick={() => scrollToIndex(index)}
                        aria-label={`Go to blog ${index + 1}`}
                      />
                    ))}
                  </div>
                  <h2 className={styles.title}>{title}</h2>
                  <h3 className={styles.blogTitle}>{blog.title}</h3>
                  <div className={styles.authorInfo}>
                    {blog.authorIcon && (
                      <img
                        src={blog.authorIcon}
                        alt={blog.author}
                        className={styles.authorIcon}
                      />
                    )}
                    <span className={styles.authorName}>
                      {blog.author || subtitle}
                    </span>
                  </div>

                  <div className={styles.btnShare}> 
                    <button>Read More</button> 
                    <button>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
                        <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#FEFEFE"/>
                      </svg>
                    </button>
                  </div>
                  
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrendingBlogsCarousel;
