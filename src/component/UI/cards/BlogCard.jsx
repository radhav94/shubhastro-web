import React from "react";
import Styles from "./BlogCard.module.scss";
import { DefaultImages } from "../../../utils/appImages";

const BlogCard = ({ image, title, author, date, authorIcon }) => {
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
        <img src={image || DefaultImages.BlogsDefault} alt={title} className={Styles.mainImage} />
      </div>

      <div className={Styles.contentContainer}>
        <h3 className={Styles.blogTitle}>{title}</h3>
        <div className={Styles.blogInfo}>
          <div className={Styles.authorDate}>
            {authorIcon && (
              <img
                src={authorIcon}
                alt={author}
                className={Styles.authorIcon}
              />
            )}
            <span className={Styles.authorText}>
            {author ? `${author} ・ ` : ""}
            {formatDate(date)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
