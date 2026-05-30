import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useGetSingleBlogQuery, useGetRelatedBlogsQuery } from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";
import MoreBlogsCarousel from "../../../../component/UI/cards/MoreBlogsCarousel";
import TTSButton from "../../../../component/UI/TTSButton";
const SingleBlogDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetSingleBlogQuery(slug);
  const singleBLogData = data?.data;

  // Fetch related blogs using dedicated API (matches by tags)
  const { data: relatedData, isLoading: relatedLoading } = useGetRelatedBlogsQuery(
    { blogId: singleBLogData?._id, page: 1, limit: 5 },
    { skip: !singleBLogData?._id }
  );
  const relatedBlogs = relatedData?.data || [];
  const cleanText = singleBLogData?.body
  ?.replace(/<[^>]+>/g, ' ')   // remove HTML tags
  ?.replace(/\s+/g, ' ')       // normalize spaces
  ?.trim();
  if (isLoading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!singleBLogData) return <p style={{ textAlign: "center" }}>No blog found</p>;

  return (
    <>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.headerTitle}>{data?.title || "Blogs"}</h1>
        </div>
      </header>

      <div className={styles.singleBlogWrapper}>
        {/* Banner Image */}
        <div>
          <img
            src={singleBLogData.img}
            alt={singleBLogData.title}
            className={styles.bannerImage}
          />
        </div>

        {/* Blog Body - Title, Meta, and Content */}
        <div className={styles.blogBody}>
          {/* Trending Badge + TTS Button Row */}
          <div className={styles.badgeTtsRow}>
            <span className={styles.trendingBadge}>Trending</span>
            <TTSButton text={`${[singleBLogData?.title, singleBLogData?.author, cleanText].filter(Boolean).join('. ')}`} />
          </div>

          {/* Title */}
          <h1 className={styles.title}>{singleBLogData.title}</h1>

          {/* Publish Date and Author */}
          <div className={styles.metaInfo}>
            {singleBLogData.author && (
              <p className={styles.date}>{singleBLogData.author}</p>
            )}
            <p className={styles.author}>{dayjs(singleBLogData.publishDate).format("DD MMM YYYY")}</p>
          </div>

          {/* Blog Content */}
          <div dangerouslySetInnerHTML={{ __html: singleBLogData.body }}></div>
        </div>
      </div>

      {/* Related Blogs Carousel */}
      {!relatedLoading && relatedBlogs.length > 0 && (
        <MoreBlogsCarousel 
          blogs={relatedBlogs} 
          currentBlogId={slug}
          title="RELATED BLOGS"
          className={styles.relatedblogs}
        />
      )}
    </>
  );
};

export default SingleBlogDetails;
