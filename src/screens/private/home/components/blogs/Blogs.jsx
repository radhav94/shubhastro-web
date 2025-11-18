import React, { useRef } from "react";
import Styles from "./Blogs.module.scss";
import { BlogCard, Title } from "../../../../../component";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const Blogs = ({ titleShow = true, data }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const astroImages = [
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/19191028/Leo-Daily-Horoscope-Today.jpg", // astrology chart
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg", // zodiac wheel
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg", // planets galaxy
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg", // constellation
];


  const title = data?.find((slug) => slug.display_type === "blog");

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

        {blogData?.map((blog,index) => (
          <Link
            key={blog._id}
            to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog.blogId)}

            className={Styles.blogLink}
          >
            <BlogCard
              image={astroImages[index % astroImages.length]}
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
