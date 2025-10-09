import React from "react";
import styles from "./BlogHeader.module.scss";

// Data extracted from your HTML for a dynamic component structure
const mainBlogData = {
  id: 1,
  bannerUrl:
    "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mars_transit_in_scorpio_1200x600_9eca7f6bf4.webp",
  authorImgUrl:
    "https://images.astroyogi.com/strapicmsprod/assets/tarot_sonia_7225139579420363_534cfbd03d.jpg",
  authorName: "Tarot Sonia",
  date: "Wed, Oct 08, 2025",
  title: "October 2025 Mars in Scorpio Transit: What Changes Await You?",
  link: "/blog/planet-mars-transit-in-scorpio.aspx",
};

const subsidiaryBlogsData = [
  {
    id: 2,
    bannerUrl:
      "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/karwa_chauth_wishes_and_quotes_h_1200x600_909c434d6d.webp",
    authorImgUrl:
      "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
    authorName: "Team Astroyogi",
    date: "Tue, Oct 07, 2025",
    title: "Karwa Chauth Wishes and Quotes to Celebrate Love",
    link: "/blog/karwa-chauth-wishes-and-quotes.aspx",
  },
  {
    id: 3,
    bannerUrl:
      "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/karwa_chauth_gift_for_wife_1200x600_49f34385c6.webp",
    authorImgUrl:
      "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
    authorName: "Team Astroyogi",
    date: "Tue, Oct 07, 2025",
    title: "Karwa Chauth Gift for Wife: According to Zodiac Signs",
    link: "/blog/karwa-chauth-gift-for-wife.aspx",
  },
  {
    id: 4,
    bannerUrl:
      "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/weekly_horoscope_06_12_oct_2025_1200x600_ca19608cf4.webp",
    authorImgUrl:
      "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
    authorName: "Team Astroyogi",
    date: "Mon, Oct 06, 2025",
    title:
      "Your Weekly Horoscope 6–12 October 2025: Insights & Tips for Every Zodiac Sign",
    link: "/blog/october-06-october-12-horoscope.aspx",
  },
  {
    id: 5,
    bannerUrl:
      "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mercury_transit_in_scorpio_1200x600_7c3eca0ed3.webp",
    authorImgUrl:
      "https://images.astroyogi.com/strapicmsprod/assets/astro_roli_16354096429_71f8cd7731.jpg",
    authorName: "Astro Roli",
    date: "Mon, Oct 06, 2025",
    title:
      "Mercury in Scorpio Transit October 2025: Secrets, Strategy & Surprises Revealed",
    link: "/blog/planet-mercury-transit-in-scorpio.aspx",
  },
];

const BlogHeader = () => {
  return (
    <div className={styles.blogContainer}>
      {/* --- Main Blog Section --- */}
      <a href={mainBlogData.link} className={styles.leftContainer}>
        <article className={styles.mainBlogCard}>
          <img
            src={mainBlogData.bannerUrl}
            alt={mainBlogData.title}
            className={styles.mainBanner}
          />
          <div className={styles.mainBlogContent}>
            <div className={styles.authorInfo}>
              <img
                src={mainBlogData.authorImgUrl}
                alt={mainBlogData.authorName}
                className={styles.authorImage}
              />
              <div className={styles.authorDetails}>
                <span className={styles.authorName}>
                  {mainBlogData.authorName}
                </span>
                <span className={styles.date}>{mainBlogData.date}</span>
              </div>
            </div>
            <h2 className={styles.mainTitle}>{mainBlogData.title}</h2>
          </div>
        </article>
      </a>

      {/* --- Subsidiary Blogs Section (Scrollable) --- */}
      <div className={styles.rightContainer}>
        {subsidiaryBlogsData.map((blog) => (
          <a href={blog.link} key={blog.id} className={styles.subsidiaryLink}>
            <article className={styles.subsidiaryBlogItem}>
              <img
                src={blog.bannerUrl}
                alt={blog.title}
                className={styles.subsidiaryBanner}
              />
              <div className={styles.subsidiaryContent}>
                <h3 className={styles.subsidiaryTitle}>{blog.title}</h3>
                <div className={styles.subsidiaryAuthorInfo}>
                  <img
                    src={blog.authorImgUrl}
                    alt={blog.authorName}
                    className={styles.subsidiaryAuthorImage}
                  />
                  <span>{blog.authorName}</span>
                  <b className={styles.subsidiaryDate}>{blog.date}</b>
                </div>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  );
};

export default BlogHeader;
