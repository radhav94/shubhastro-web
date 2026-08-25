import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./TrendingBlogsCarousel.module.scss";
import { DefaultImages } from "../../../utils/appImages";

const TrendingBlogsCarousel = ({ blogs = [], title, subtitle }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
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

  const getBlogUrl = (blog) => {
    return `${window.location.origin}/blog/${blog.slug || blog._id}`;
  };

  const handleShare = (platform, blog) => {
    const url = getBlogUrl(blog);
    switch (platform) {
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      // case "instagram":
      //   window.open("https://www.instagram.com/", "_blank");
      //   break;
      case "copy": {
        const blogId = blog.blogId || blog._id;
        navigator.clipboard.writeText(url);
        setCopiedId(blogId);
        setTimeout(() => setCopiedId(null), 2000);
        break;
      }
    }
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
    const slug = blog.slug || blog._id;
    if (!slug) {
      console.error('Blog slug is missing:', blog);
      return;
    }
    navigate(PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", slug));
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
                          <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#FEFEFE" />
                        </svg>

                        <div className={styles.shareIconSocial}>
                          {/* WhatsApp */}
                          <span className={styles.socialIconWrapper} onClick={() => handleShare("whatsapp", blog)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                          </span>
                          {/* Facebook */}
                          <span className={styles.socialIconWrapper} onClick={() => handleShare("facebook", blog)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                          </span>
                          {/* Instagram */}
                          {/* <span className={styles.socialIconWrapper} onClick={() => handleShare("instagram", blog)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M349.33 69.33a93.62 93.62 0 0 1 93.34 93.34v186.66a93.62 93.62 0 0 1-93.34 93.34H162.67a93.62 93.62 0 0 1-93.34-93.34V162.67a93.62 93.62 0 0 1 93.34-93.34h186.66m0-37.33H162.67C90.8 32 32 90.8 32 162.67v186.66C32 421.2 90.8 480 162.67 480h186.66C421.2 480 480 421.2 480 349.33V162.67C480 90.8 421.2 32 349.33 32z"></path><path d="M377.33 162.67a28 28 0 1 1 28-28 27.94 27.94 0 0 1-28 28zM256 181.33A74.67 74.67 0 1 1 181.33 256 74.75 74.75 0 0 1 256 181.33m0-37.33a112 112 0 1 0 112 112 112 112 0 0 0-112-112z"></path></svg>
                          </span> */}
                          {/* Copy Link */}
                          <span className={styles.socialIconWrapper} onClick={() => handleShare("copy", blog)}>
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            {copiedId === (blog.blogId || blog._id) && <span className={styles.copiedText}>Copied!</span>}
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
