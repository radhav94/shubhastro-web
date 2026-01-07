import React from "react";
import { IoArrowForwardOutline } from "react-icons/io5";
import Styles from "./BlogCard.module.scss";

const BlogCard = ({ image, title, author, date, authorIcon }) => {
  return (
    <article className={Styles.blogCard}>
      <div className={Styles.imageContainer}>
        <img src={image} alt={title} className={Styles.mainImage} />
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
            {
                new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          <IoArrowForwardOutline className={Styles.arrowIcon} />
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
