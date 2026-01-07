import React, { useRef } from "react";
import Styles from "./News.module.scss";
import { NewsCard, Title } from "../../../../../component";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const News = ({ titleShow = true, data }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const title = data?.find((slug) => slug.display_type === "news");

    const blogData = title?.content;
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
            <Link
              key={blog._id}
              to={blog.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className={Styles.blogLink}
            >
              <NewsCard
                image={blog?.imageUrl}
                title={blog.title}
                author={blog.news_channel}
                date={blog.date}
                authorIcon={blog.authorIcon}
                key={blog?._id}
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

export default News;
