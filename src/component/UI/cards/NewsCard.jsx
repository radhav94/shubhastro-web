import React from "react";
import Styles from "./NewsCard.module.scss";

const BlogCard = ({ image, title, author, date, authorIcon }) => {
  return (
    <article className={Styles.blogCard}>
      <div className={Styles.imageContainer}>
        <img src={image} alt={title} className={Styles.mainImage} />
      </div>

      <div className={Styles.contentContainer}>
        <h3 className={Styles.blogTitle}>{title}</h3>

        <div className={Styles.blogInfo}>
          <div className={Styles.authorDate} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px"}}>
              {/* {authorIcon && (
                <img src={authorIcon} alt={author} className={Styles.authorIcon} />
              )} */}
              <span className={Styles.authorText}>{author}</span>
            </div>

            <span className={Styles.authorText}>{date}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
