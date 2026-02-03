import React from "react";
import { useParams } from "react-router-dom";
import { useGetSingleBlogQuery, useGetBlogPageDataQuery } from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import MoreBlogsCarousel from "../../../../component/UI/cards/MoreBlogsCarousel";

const SingleBlogDetails = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetSingleBlogQuery(slug);
  const { data: blogPageData, isLoading: blogsLoading } = useGetBlogPageDataQuery({ page: 1, limit: 10 });
  
  const singleBLogData = data?.data;
  
  // Extract related blogs from blog page API
  const blogList = blogPageData?.data?.list || [];
  const relatedSection = blogList.find(item => item.slug === "related_blogs");
  const relatedBlogs = relatedSection?.content || [];
  const relatedTitle = relatedSection?.title;
  const relatedSubtitle = relatedSection?.sub_title || relatedSection?.subtitle;
  
  if (isLoading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!singleBLogData) return <p style={{ textAlign: "center" }}>No blog found</p>;

  return (
    <>
      <div className={styles.singleBlogWrapper}>
        {/* Banner Image */}
        <div>
          <img
            src={singleBLogData.img}
            alt={singleBLogData.title}
            className={styles.bannerImage}
          />

          {/* Title */}
          <h1 className={styles.title}>{singleBLogData.title}</h1>

          {/* Publish Date and Author */}
          <div className={styles.metaInfo}>
            <p className={styles.date}>Published on: {singleBLogData.publishDate}</p>
            {singleBLogData.author && (
              <p className={styles.author}>By {singleBLogData.author}</p>
            )}
          </div>
        </div>

        {/* Blog Body - Render HTML */}
        <div
          className={styles.blogBody}
          dangerouslySetInnerHTML={{ __html: singleBLogData.body }}
        ></div>
      </div>

      {/* Related Blogs Carousel */}
      {!blogsLoading && relatedBlogs.length > 0 && (
        <MoreBlogsCarousel 
          blogs={relatedBlogs} 
          currentBlogId={slug}
          title={relatedTitle}
          subtitle={relatedSubtitle}
        />
      )}
    </>
  );
};

export default SingleBlogDetails;
