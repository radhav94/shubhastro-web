import React from "react";
import styles from "./BlogHeader.module.scss";
import { BlogCard } from "../../../../component";
// import { subsidiaryBlogsData } from "./data";
import { useGetBlogQuery } from "../../../../services/appServices/blogService";


// const subsidiaryBlogsData = [
//   {
//     id: 2,
//     bannerUrl:
//       "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/karwa_chauth_wishes_and_quotes_h_1200x600_909c434d6d.webp",
//     authorImgUrl:
//       "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
//     authorName: "Team Astroyogi",
//     date: "Tue, Oct 07, 2025",
//     title: "Karwa Chauth Wishes and Quotes to Celebrate Love",
//     link: "/blog/karwa-chauth-wishes-and-quotes.aspx",
//   },
//   {
//     id: 3,
//     bannerUrl:
//       "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/karwa_chauth_gift_for_wife_1200x600_49f34385c6.webp",
//     authorImgUrl:
//       "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
//     authorName: "Team Astroyogi",
//     date: "Tue, Oct 07, 2025",
//     title: "Karwa Chauth Gift for Wife: According to Zodiac Signs",
//     link: "/blog/karwa-chauth-gift-for-wife.aspx",
//   },
//   {
//     id: 4,
//     bannerUrl:
//       "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/weekly_horoscope_06_12_oct_2025_1200x600_ca19608cf4.webp",
//     authorImgUrl:
//       "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
//     authorName: "Team Astroyogi",
//     date: "Mon, Oct 06, 2025",
//     title:
//       "Your Weekly Horoscope 6–12 October 2025: Insights & Tips for Every Zodiac Sign",
//     link: "/blog/october-06-october-12-horoscope.aspx",
//   },
//   {
//     id: 5,
//     bannerUrl:
//       "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mercury_transit_in_scorpio_1200x600_7c3eca0ed3.webp",
//     authorImgUrl:
//       "https://images.astroyogi.com/strapicmsprod/assets/astro_roli_16354096429_71f8cd7731.jpg",
//     authorName: "Astro Roli",
//     date: "Mon, Oct 06, 2025",
//     title:
//       "Mercury in Scorpio Transit October 2025: Secrets, Strategy & Surprises Revealed",
//     link: "/blog/planet-mercury-transit-in-scorpio.aspx",
//   },
// ];

 




const BlogHeader = () => {
   const { data, isLoading, isError } = useGetBlogQuery();
  const subsidiaryBlogsData = data?.data || [];
  return (
    <div className={styles.blogsContainer}>
   

     

         {subsidiaryBlogsData?.map((blog) => (

         <BlogCard
              image={"https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mercury_transit_in_scorpio_1200x600_7c3eca0ed3.webp"}
              title={blog.title}
              author={blog.author}
              date={blog.publishDate}
              authorIcon={blog.authorIcon}
            />
             ))}
    </div>
  );
};

export default BlogHeader;
