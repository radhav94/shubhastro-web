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

  /*
   * Cards that carry no `redirect_url`. They stay clickable and say why nothing
   * opened rather than being inert — `.blogCard` sets `cursor: pointer` on every
   * card, so a linkless one looks exactly as tappable as the rest.
   *
   * The linked case is a real <a> now (see below). It used to be
   * `window.open(url, "_blank")` inside this handler, immediately followed by an
   * unconditional `Toast.error("News article link is not available.")` — the
   * `return` was missing, so every SUCCESSFUL click also told the user the link
   * was unavailable. Opening a tab and denying it happened in the same gesture is
   * exactly the kind of contradiction that gets a card clicked twice.
   */
  const handleUnavailableNews = () => {
    Toast.error("This article doesn't have a link yet.");
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
        {newsData.slice(0, 5).map((news, index) => {
          const cardBody = (
            <>
              <div className={styles.blogImageWrapper}>
                <img
                  src={news.imageUrl || DefaultImages.NewBlogsDefault}
                  alt={news.title}
                  className={styles.blogImage}
                  onError={(e) => {
                    e.target.src =
                      "https://assets.shubhastro.ai/astrologer_male.png";
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
            </>
          );

          /*
           * A real anchor rather than a <div onClick> + window.open. The card is a
           * link to an external article, so it should behave like one: reachable
           * by keyboard, openable with middle-click or cmd/ctrl-click, and with
           * the destination visible in the status bar on hover. `window.open` also
           * handed the article a live `window.opener` reference back to this page
           * — reverse tabnabbing — which `rel="noopener noreferrer"` closes.
           */
          return news.redirect_url ? (
            <a
              key={news._id || index}
              href={news.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.blogCard}
            >
              {cardBody}
            </a>
          ) : (
            <div
              key={news._id || index}
              className={`${styles.blogCard} ${styles.blogCardUnavailable}`}
              role="button"
              tabIndex={0}
              aria-disabled="true"
              onClick={handleUnavailableNews}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleUnavailableNews();
                }
              }}
            >
              {cardBody}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default NewsSection;
