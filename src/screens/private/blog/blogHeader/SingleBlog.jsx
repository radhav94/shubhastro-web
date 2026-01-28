import React from "react";
import { useParams } from "react-router-dom";
import { useGetSingleBlogQuery, useGetBlogQuery } from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import MoreBlogsCarousel from "../../../../component/UI/cards/MoreBlogsCarousel";

const SingleBlogDetails = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetSingleBlogQuery(slug);
  const { data: blogsData, isLoading: blogsLoading } = useGetBlogQuery({ page: 1, limit: 10 });
  
  const singleBLogData = data?.data;
  const allBlogs = blogsData?.data?.blogs || blogsData?.data || [];
  
  if (isLoading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!singleBLogData) return <p style={{ textAlign: "center" }}>No blog found</p>;

  return (
    <>
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

      {/* More Blogs Carousel */}
      {!blogsLoading && <MoreBlogsCarousel blogs={allBlogs} currentBlogId={slug} />}
    </>
  );
};

export default SingleBlogDetails;
