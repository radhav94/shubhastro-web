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
            >
              <div className={styles.imageWrapper}>
                
                {/* Image Click */}
                <img
                  src={blog.imageUrl || DefaultImages.BlogsDefault}
                  alt={blog.title}
                  className={styles.blogImage}
                  onClick={() => handleBlogClick(blog)}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/1200x400?text=Blog+Image";
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
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToIndex(index);
                        }}
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
                    
                    {/* Read More Click */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlogClick(blog);
                      }}
                    >
                      Read More
                    </button>

                    {/* Share Button */}
                    <div className={styles.shareBtnMain}>
                      <button onClick={(e) => e.stopPropagation()}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="20"
                          viewBox="0 0 18 20"
                          fill="none"
                        >
                          <path
                            d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z"
                            fill="#FEFEFE"
                          />
                        </svg>


                        <div className={styles.shareIconSocial}>
                          <span>
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                          </span>
                          <span>
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M349.33 69.33a93.62 93.62 0 0 1 93.34 93.34v186.66a93.62 93.62 0 0 1-93.34 93.34H162.67a93.62 93.62 0 0 1-93.34-93.34V162.67a93.62 93.62 0 0 1 93.34-93.34h186.66m0-37.33H162.67C90.8 32 32 90.8 32 162.67v186.66C32 421.2 90.8 480 162.67 480h186.66C421.2 480 480 421.2 480 349.33V162.67C480 90.8 421.2 32 349.33 32z"></path><path d="M377.33 162.67a28 28 0 1 1 28-28 27.94 27.94 0 0 1-28 28zM256 181.33A74.67 74.67 0 1 1 181.33 256 74.75 74.75 0 0 1 256 181.33m0-37.33a112 112 0 1 0 112 112 112 112 0 0 0-112-112z"></path></svg>
                          </span>
                          <span>
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M496 109.5a201.8 201.8 0 0 1-56.55 15.3 97.51 97.51 0 0 0 43.33-53.6 197.74 197.74 0 0 1-62.56 23.5A99.14 99.14 0 0 0 348.31 64c-54.42 0-98.46 43.4-98.46 96.9a93.21 93.21 0 0 0 2.54 22.1 280.7 280.7 0 0 1-203-101.3A95.69 95.69 0 0 0 36 130.4c0 33.6 17.53 63.3 44 80.7A97.5 97.5 0 0 1 35.22 199v1.2c0 47 34 86.1 79 95a100.76 100.76 0 0 1-25.94 3.4 94.38 94.38 0 0 1-18.51-1.8c12.51 38.5 48.92 66.5 92.05 67.3A199.59 199.59 0 0 1 39.5 405.6a203 203 0 0 1-23.5-1.4A278.68 278.68 0 0 0 166.74 448c181.36 0 280.44-147.7 280.44-275.8 0-4.2-.11-8.4-.31-12.5A198.48 198.48 0 0 0 496 109.5z"></path></svg>
                          </span>
                        </div>

                      </button>
                    </div>

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
