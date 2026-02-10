import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import styles from "./LinkPreview.module.scss";
import { isImageURL, extractDomain } from "../../../../../utils/helper/linkPreview";

const LinkPreview = ({ url, isSender }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Check if URL is an image
    if (isImageURL(url)) {
      setShowPreview(true);
    }
  }, [url]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setShowPreview(false);
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If it's an image URL, show image preview
  if (showPreview && !imageError) {
    return (
      <div className={styles.linkPreviewContainer}>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.imageLink}
          onClick={handleLinkClick}
        >
          <div className={styles.imageWrapper}>
            {!imageLoaded && (
              <div className={styles.imagePlaceholder}>
                <div className={styles.loader}></div>
              </div>
            )}
            <img
              src={url}
              alt="Shared image"
              className={`${styles.previewImage} ${imageLoaded ? styles.loaded : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
          <div className={styles.linkInfo}>
            <ExternalLink size={14} />
            <span className={styles.linkText}>{extractDomain(url)}</span>
          </div>
        </a>
      </div>
    );
  }

  // Regular link display
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.regularLink}
      onClick={handleLinkClick}
    >
      <ExternalLink size={14} />
      <span className={styles.linkText}>{url}</span>
    </a>
  );
};

export default LinkPreview;
