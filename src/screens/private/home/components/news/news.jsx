import React, { useRef } from "react";
import Styles from "./News.module.scss";
import { NewsCard, Title } from "../../../../../component";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const News = ({ titleShow = true, data }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const title = data?.find((slug) => slug.display_type === "blog");

//   const blogData = title?.content;
  const blogData = [
    {
      _id: "1",
      blogId: "how-to-start-astrology",
      imageUrl: "https://shubhastroassets.s3.ap-south-1.amazonaws.com/Zodiac/PISCES.png",
      title: "How to Start Learning Astrology in 2025",
      author: "Priya Sharma",
      authorIcon: "https://via.placeholder.com/40",
      publishDate: "Dec 15, 2025"
    },
    {
      _id: "2",
      blogId: "kundli-basics-guide",
      imageUrl: "https://shubhastroassets.s3.ap-south-1.amazonaws.com/Zodiac/PISCES.png",
      title: "Kundli Basics: A Beginner Friendly Guide",
      author: "Rohan Mehta",
      authorIcon: "https://via.placeholder.com/40",
      publishDate: "Dec 20, 2025"
    },
    {
      _id: "3",
      blogId: "vastu-tips-for-home",
      imageUrl: "https://shubhastroassets.s3.ap-south-1.amazonaws.com/Zodiac/PISCES.png",
      title: "Vastu Tips to Improve Home Energy Flow",
      author: "Sneha Kapoor",
      authorIcon: "https://via.placeholder.com/40",
      publishDate: "Jan 02, 2026"
    },
    {
      _id: "4",
      blogId: "planetary-effects-2026",
      imageUrl: "https://shubhastroassets.s3.ap-south-1.amazonaws.com/Zodiac/PISCES.png",
      title: "Planetary Effects That Will Shape 2026",
      author: "Amit Verma",
      authorIcon: "https://via.placeholder.com/40",
      publishDate: "Jan 05, 2026"
    },
  ];
  
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
          title="Shubhtalk in News"
        //   onButtonClick={() => navigate("/blog")}
        />
      )}

      {/* Arrows appear ONLY when more than 3 blogs */}
      {blogData?.length > 3 && (
        <button className={Styles.leftArrow} onClick={scrollLeft}>
          &lt;
        </button>
      )}

      <div
        className={`${Styles.blogsContainer} ${
          blogData?.length > 3 ? Styles.scrollMode : ""
        }`}
        ref={scrollRef}
      >
        {blogData?.map((blog, index) => (
        //   <Link
        //     key={blog._id}
        //     to={PATH.privateRoutes.SINGLEBLOG.path.replace(
        //       ":slug",
        //       blog.blogId
        //     )}
        //     className={Styles.blogLink}
        //   >
            <NewsCard
              image={blog?.imageUrl}
              title={blog.title}
              author={blog.author}
              date={blog.publishDate}
              authorIcon={blog.authorIcon}
            />
        //   </Link>
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

export default News;
