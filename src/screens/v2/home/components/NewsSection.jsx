import { useNavigate } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";
import { Toast } from "../../../../component";
import { DefaultImages } from "../../../../utils/appImages";

const NewsSection = ({ newsData, title, showMore }) => {
  const navigate = useNavigate();

  if (!newsData || newsData.length === 0) return null;

  const handleNewsClick = (news) => {
    if (news.redirect_url) {
      window.open(news.redirect_url, "_blank");
    }
    Toast.error("News article link is not available.");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    let date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split("/");
      date = dayjs(`${year}-${month}-${day}`);
    } else {
      date = dayjs(dateString);
    }
    return date.isValid() ? date.format("MMM DD, YYYY") : dateString;
  };

  return (
    <section className={styles.blogsSection}>
      <div className={styles.sectionHeader}>
        <SectionHeader title={title || "IN THE NEWS"} />
        {showMore && (
          <button
            className={styles.viewAllLink}
            onClick={() => navigate("/news")}
          >
            View All <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div className={styles.blogsGrid}>
        {newsData.slice(0, 5).map((news, index) => (
          <div
            key={news._id || index}
            className={styles.blogCard}
            onClick={() => handleNewsClick(news)}
          >
            <div className={styles.blogImageWrapper}>
              <img
                src={news.imageUrl || DefaultImages.NewBlogsDefault}
                alt={news.title}
                className={styles.blogImage}
                onError={(e) => {
                  e.target.src =
                    "https://shubhastroassets.s3.ap-south-1.amazonaws.com/astrologer_male.png";
                }}
              />
            </div>
            <div className={styles.blogContent}>
              <div className={styles.blogMeta}>
                <span className={styles.blogChannel}>{news.news_channel}</span>
                <span className={styles.blogDate}>{formatDate(news.date)}</span>
              </div>
              <h3 className={styles.blogTitle}>{news.title}</h3>
              {news.redirect_url && (
                <div className={styles.blogLink}>
                  <ExternalLink size={16} />
                  <span>Read More</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewsSection;
