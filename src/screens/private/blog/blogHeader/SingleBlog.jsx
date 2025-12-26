import React from "react";
import { useParams } from "react-router-dom";
import { useGetSingleBlogQuery } from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";





const astroImages = 
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/19191028/Leo-Daily-Horoscope-Today.jpg" // astrology chart
;

const SingleBlogDetails = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetSingleBlogQuery(slug);
  const singleBLogData = data?.data
  if (!singleBLogData) return <p>No blog found</p>;

  return (
    <div className={styles.singleBlogWrapper}>
      {/* Title */}
      <h1 className={styles.title}>{singleBLogData.title}</h1>

      {/* Banner Image */}
      <img
        src={singleBLogData.img}
        alt={singleBLogData.title}
        className={styles.bannerImage}
      />

      {/* Publish Date */}
      <p className={styles.date}>Published on: {singleBLogData.publishDate}</p>

      {/* Blog Body - Render HTML */}
      <div
        className={styles.blogBody}
        dangerouslySetInnerHTML={{ __html: singleBLogData.body }}
      ></div>
    </div>
  );
};

export default SingleBlogDetails;

