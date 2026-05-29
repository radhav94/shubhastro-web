import { useRef, useState, useEffect, useCallback } from "react";
import styles from "../Community.module.scss";

const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds
const PAUSE_AFTER_INTERACTION = 5000; // 5 seconds pause after user interaction

const PostImageSlider = ({ images = [] }) => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  const scrollToIndex = useCallback((index) => {
    const el = scrollRef.current;
    if (!el || images.length === 0) return;

    const cardWidth = el.scrollWidth / images.length;
    el.scrollTo({ left: cardWidth * index, behavior: "smooth" });
  }, [images.length]);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el || images.length === 0) return;

    const cardWidth = el.scrollWidth / images.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setCurrentIndex(index);
  }, [images.length]);

  // Start auto-scroll
  const startAutoScroll = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [images.length, scrollToIndex]);

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition);
    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition]);

  // Auto-scroll
  useEffect(() => {
    if (images.length <= 1) return;

    startAutoScroll();

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(pauseTimeoutRef.current);
    };
  }, [images.length, startAutoScroll]);

  // Pause auto-scroll on user interaction, resume after delay
  const handleUserInteraction = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(pauseTimeoutRef.current);

    pauseTimeoutRef.current = setTimeout(() => {
      startAutoScroll();
    }, PAUSE_AFTER_INTERACTION);
  }, [startAutoScroll]);

  if (!images || images.length === 0) return null;

  // Single image — no slider needed
  if (images.length === 1) {
    return (
      <div className={styles.postSliderWrapper}>
        <div className={styles.postSliderSlide}>
          <img
            src={images[0]}
            alt="Post"
            className={styles.postSliderImage}
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
        </div>
      </div>
    );
  }

  // Multiple images — slider
  return (
    <div className={styles.postSliderWrapper}>
      <div className={styles.postSliderContainer} ref={scrollRef} onTouchStart={handleUserInteraction} onMouseDown={handleUserInteraction}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.postSliderSlide}>
            <img
              src={img}
              alt={`Post ${idx + 1}`}
              className={styles.postSliderImage}
              loading="lazy"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
      <div className={styles.postSliderDots}>
        {images.map((_, index) => (
          <button
            key={index}
            className={`${styles.postSliderDot} ${index === currentIndex ? styles.postSliderDotActive : ""}`}
            onClick={() => { scrollToIndex(index); handleUserInteraction(); }}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PostImageSlider;
