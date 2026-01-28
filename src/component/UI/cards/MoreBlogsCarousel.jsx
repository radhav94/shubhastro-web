import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./MoreBlogsCarousel.module.scss";

const MoreBlogsCarousel = ({ blogs = [], currentBlogId }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Filter out current blog - handle both blogId and _id
  const filteredBlogs = currentBlogId 
    ? blogs.filter(blog => {
        const id = blog.blogId || blog._id;
        return id !== currentBlogId;
      })
    : blogs;

  // Check scroll position
  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el || filteredBlogs.length === 0) return;

    setIsAtStart(el.scrollLeft === 0);
    setIsAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);

    // Calculate current index based on scroll position
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
    <div className={styles.moreBlogsSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {currentBlogId ? "RELATED BLOGS" : "MORE BLOGS FOR YOU"}
        </h2>
        <div className={styles.titleDivider}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerMoon}>☾</span>
          <div className={styles.dividerLine}></div>
        </div>
      </div>

      {currentBlogId ? (
        // Grid layout for Related Blogs
        <div className={styles.blogsGrid}>
          {filteredBlogs.slice(0, 6).map((blog) => (
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
                    e.target.src = "https://via.placeholder.com/400x300?text=Blog+Image";
                  }}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.blogTitle}>{blog.title}</h3>
                <p className={styles.blogDate}>
                  {blog.publishDate
                    ? dayjs(blog.publishDate).format("DD MMM YYYY")
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Carousel layout for More Blogs For You
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
      )}
    </div>
  );
};

export default MoreBlogsCarousel;
