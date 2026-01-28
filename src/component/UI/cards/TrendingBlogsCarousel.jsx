import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./TrendingBlogsCarousel.module.scss";

const TrendingBlogsCarousel = ({ blogs = [] }) => {
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

  const handleBlogClick = (blogId) => {
    navigate(PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blogId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!filteredBlogs || filteredBlogs.length === 0) return null;

  return (
    <div className={styles.trendingSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>Trending</h2>
        <p className={styles.subtitle}>Discover insights into love, career and life.</p>
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselContainer} ref={scrollRef}>
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id || blog.blogId}
              className={styles.blogCard}
              onClick={() => handleBlogClick(blog.blogId)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={blog.imageUrl || blog.img}
                  alt={blog.title}
                  className={styles.blogImage}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/1200x400?text=Blog+Image";
                  }}
                />
                <div className={styles.overlay}>
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
                      By {blog.author || "Pandit Haridas"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
      </div>
    </div>
  );
};

export default TrendingBlogsCarousel;
