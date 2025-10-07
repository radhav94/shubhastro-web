import React from "react";
import Styles from "./Blogs.module.scss";
import { BlogCard, Title } from "../../../../../component";

const Blogs = () => {
  const blogData = [
    {
      id: 1,
      image:
        "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/mercury_transit_in_scorpio_1200x600_7c3eca0ed3.webp",
      link: "/blog/planet-mercury-transit-in-scorpio.aspx",
      title:
        "Mercury in Scorpio Transit October 2025: Secrets, Strategy & Surprises Revealed",
      author: "Astro Roli",
      date: "Mon, Oct 06, 2025",
      authorIcon:
        "https://images.astroyogi.com/strapicmsprod/assets/astro_roli_16354096429_71f8cd7731.jpg",
    },
    {
      id: 2,
      image:
        "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/weekly_horoscope_06_12_oct_2025_1200x600_ca19608cf4.webp",
      link: "/blog/october-06-october-12-horoscope.aspx",
      title:
        "Your Weekly Horoscope 6–12 October 2025: Insights & Tips for Every Zodiac Sign",
      author: "Team Astroyogi",
      date: "Mon, Oct 06, 2025",
      authorIcon:
        "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
    },
    {
      id: 3,
      image:
        "https://images.astroyogi.com/strapicmsprod/strapicmsprod/assets/108_names_of_ganesha_1200x600_c16713e629.webp",
      link: "/blog/108-names-of-lord-ganesha.aspx",
      title: "108 Names of Lord Ganesha and Their Meanings",
      author: "Team Astroyogi",
      date: "Fri, Oct 03, 2025",
      authorIcon:
        "https://images.astroyogi.com/strapicmsprod/assets/team_astroyogi_658d579d2f.webp",
    },
  ];
  return (
    <div>
      <Title title="Blogs" showButton showDivider />

      <div className={Styles.blogsContainer}>
        {blogData.map((blog) => (
          <a key={blog.id} href={blog.link} className={Styles.blogLink}>
            <BlogCard
              image={blog.image}
              title={blog.title}
              author={blog.author}
              date={blog.date}
              authorIcon={blog.authorIcon}
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Blogs;
