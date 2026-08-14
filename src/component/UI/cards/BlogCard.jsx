import React, { useState, useRef, useEffect } from "react";
import Styles from "./BlogCard.module.scss";
import { DefaultImages } from "../../../utils/appImages";
import Toast from "../../toast";
import defaultBlogImg from "../../../assets/images/default_image_16x9_1920x1080.png";

const BlogCard = ({ image, title, author, date, authorIcon, blogId, slug }) => {
  const [copiedId, setCopiedId] = useState(null);
  // The share tray used to be revealed by CSS :hover alone, which meant the
  // share button itself had no handler — a guaranteed dead click — and the tray
  // was unreachable entirely on touch, where there is no hover. Now it is a
  // real toggle; the hover rule is kept as a convenience for mouse users.
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    // Clicks inside the tray are stopped at the wrapper, so anything reaching
    // the document is an outside click.
    const handleOutside = (e) => {
      if (!shareRef.current?.contains(e.target)) setShareOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("click", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [shareOpen]);

  const getBlogUrl = () => `${window.location.origin}/blog/${slug || blogId}`;

  const handleShare = async (e, platform) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getBlogUrl();
    switch (platform) {
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank");
        setShareOpen(false);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        setShareOpen(false);
        break;
      case "copy":
        // writeText rejects in a non-secure context or when permission is
        // denied. The unhandled promise used to leave "Copied!" showing after a
        // copy that never happened.
        try {
          await navigator.clipboard.writeText(url);
          setCopiedId(blogId);
          setTimeout(() => setCopiedId(null), 2000);
        } catch {
          Toast.error("Couldn't copy the link. You can copy it from the address bar instead.");
        }
        break;
    }
  };

  // Function to parse DD/MM/YYYY format to a valid Date object
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Check if it's in DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Create date in YYYY-MM-DD format for proper parsing
      return new Date(`${year}-${month}-${day}`);
    }
    
    // Try parsing as regular date string
    return new Date(dateString);
  };

  const formatDate = (dateString) => {
    const parsedDate = parseDate(dateString);
    
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return "";
    }
    
    const day = parsedDate.toLocaleDateString("en-US", { day: "2-digit" });
    const month = parsedDate.toLocaleDateString("en-US", { month: "short" });
    const year = parsedDate.toLocaleDateString("en-US", { year: "numeric" });
    return `${day} ${month} ${year}`;
  };

  return (
    <article className={Styles.blogCard}>
      <div className={Styles.imageContainer}>
        <img src={image || defaultBlogImg} alt={title} className={Styles.mainImage} onError={(e) => { e.target.onerror = null; e.target.src = defaultBlogImg; }} />
      </div>

      <div className={Styles.contentContainer}>
        {author && (
          <div className={Styles.authorTop}>
            {authorIcon && (
              <img src={authorIcon || defaultBlogImg} alt={author} className={Styles.authorIcon} />
            )}
            <span className={Styles.authorName}>{author}</span>
          </div>
        )}
        <h3 className={Styles.blogTitle}>{title}</h3>
        <div className={Styles.blogInfo}>
          <div className={Styles.authorDate}>
            <span className={Styles.authorText}>
            {formatDate(date)}
            </span>
          </div>
          {blogId && (
            <div
              ref={shareRef}
              className={`${Styles.shareBtnMain} ${shareOpen ? Styles.shareOpen : ""}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                type="button"
                className={Styles.shareBtn}
                aria-label="Share blog"
                aria-haspopup="true"
                aria-expanded={shareOpen}
                onClick={() => setShareOpen((v) => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 20" fill="none">
                  <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                </svg>
              </button>
              <div className={Styles.shareIconSocial}>
                <button type="button" className={Styles.socialIconWrapper} aria-label="Share on WhatsApp" onClick={(e) => handleShare(e, "whatsapp")}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                </button>
                <button type="button" className={Styles.socialIconWrapper} aria-label="Share on Facebook" onClick={(e) => handleShare(e, "facebook")}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                </button>
                <button type="button" className={Styles.socialIconWrapper} aria-label="Copy link" onClick={(e) => handleShare(e, "copy")}>
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  {copiedId === blogId && <span className={Styles.copiedText}>Copied!</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
