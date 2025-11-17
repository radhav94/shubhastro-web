import React, { useRef } from "react";
import Styles from "./Blogs.module.scss";
import { BlogCard, Title } from "../../../../../component";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const Blogs = ({ titleShow = true, data }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);


  const title = data?.find((slug) => slug.display_type === "blog");

  const blogData = title?.content;
  console.log("blogData",blogData);
  // No changes needed to the data structure
//   const blogData = [
//     {
//       id: 1,
//       image:
//         "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mercury_transit_in_scorpio_1200x600_7c3eca0ed3.webp",
//       link: "/blog/planet-mercury-transit-in-scorpio.aspx",
//       title:
//         "Mercury in Scorpio Transit October 2025: Secrets, Strategy & Surprises Revealed",
//       author: "Astro Roli",
//       date: "Mon, Oct 06, 2025",
//       authorIcon:
//         "https://images.astroyogi.com/strapicmsprod/assets/astro_roli_16354096429_71f8cd7731.jpg",
//     },
//     {
//       id: 2,
//       image:
//         "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/weekly_horoscope_06_12_oct_2025_1200x600_ca19608cf4.webp",
//       link: "/blog/october-06-october-12-horoscope.aspx",
//       title:
//         "Your Weekly Horoscope 6–12 October 2025: Insights & Tips for Every Zodiac Sign",
//       author: "Team Astroyogi",
//       date: "Mon, Oct 06, 2025",
//       authorIcon:
//         "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
//     },
//     {
//       id: 3,
//       image:
//         "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/108_names_of_ganesha_1200x600_c16713e629.webp",
//       link: "/blog/108-names-of-lord-ganesha.aspx",
//       title: "108 Names of Lord Ganesha and Their Meanings",
//       author: "Team Astroyogi",
//       date: "Fri, Oct 03, 2025",
//       authorIcon:
//         "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
//     },
//     {
//   id: 4,
//   image:
//     "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/lord_shiva_names_1200x600_c9a2dd3f12.webp",
//   link: "/blog/108-names-of-lord-shiva.aspx",
//   title: "108 Names of Lord Shiva and Their Powerful Meanings",
//   author: "Astro Team",
//   date: "Mon, Nov 10, 2025",
//   authorIcon:
//     "https://images.astroyogi.com/strapicmsprod/assets/astro_team_45dd67bb21.webp",
// }

   
   
//   ];

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className={Styles.blogsSection}>
      {titleShow && (
        <Title
          title="Latest from Our Blog"
          showButton
          showDivider
          buttonTitle="View All"
          onButtonClick={() => navigate("/blog")}
        />
      )}

      {/* Arrows appear ONLY when more than 3 blogs */}
      {blogData?.length > 3 && (
        <button className={Styles.leftArrow} onClick={scrollLeft}>
          &lt;
        </button>
      )}

      <div
        className={`${Styles.blogsContainer} ${blogData?.length > 3 ? Styles.scrollMode : ""
          }`}
        ref={scrollRef}
      >

        {blogData?.map((blog) => (
          <Link
            key={blog.id}
            to={PATH.privateRoutes.BLOG.path}
            className={Styles.blogLink}
          >
            <BlogCard
              image={blog.image}
              title={blog.title}
              author={blog.author}
              date={blog.publishDate}
              authorIcon={blog.authorIcon}
            />
          </Link>
        ))}
      </div>

      {blogData?.length > 3 && (
        <button className={Styles.rightArrow} onClick={scrollRight}>
          &gt;
        </button>
      )}
    </div>
  );
};

export default Blogs;
