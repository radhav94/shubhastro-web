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
        className={`${Styles.blogsContainer} ${
          blogData?.length > 3 ? Styles.scrollMode : ""
        }`}
        ref={scrollRef}
      >
        {blogData?.map((blog, index) => (
          <Link
            key={blog._id}
            to={PATH.privateRoutes.SINGLEBLOG.path.replace(
              ":slug",
              blog.blogId
            )}
            className={Styles.blogLink}
          >
            <BlogCard
              image={blog?.imageUrl}
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
