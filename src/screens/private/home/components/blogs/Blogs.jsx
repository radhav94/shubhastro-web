import React, { useRef, useState, useEffect } from "react";
import Styles from "./Blogs.module.scss";
import { BlogCard, Title } from "../../../../../component";
import { Link, useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";

const Blogs = ({ titleShow = true, data }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const title = data?.find((slug) => slug.display_type === "blog");

  const blogData = title?.content;

  // 🔹 ADDED: arrow disable states
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // 🔹 ADDED: scroll position checker
  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el) return;

    setIsAtStart(el.scrollLeft === 0);
    setIsAtEnd(
      Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth
    );
  };

  // 🔹 ADDED: scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition);

    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, []);

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
        <button
          className={Styles.leftArrow}
          onClick={scrollLeft}
          disabled={isAtStart}
          style={{
            opacity: isAtStart ? 0.4 : 1,
            cursor: isAtStart ? "not-allowed" : "pointer",
          }}
        >
          &lt;
        </button>
      )}

      <div
        className={`${Styles.blogsContainer} ${
          blogData?.length > 3 ? Styles.scrollMode : ""
        }`}
        ref={scrollRef}
      >
        {blogData?.map((blog) => (
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
              blogId={blog.blogId || blog._id}
            />
          </Link>
        ))}
      </div>

      {blogData?.length > 3 && (
        <button
          className={Styles.rightArrow}
          onClick={scrollRight}
          disabled={isAtEnd}
          style={{
            opacity: isAtEnd ? 0.4 : 1,
            cursor: isAtEnd ? "not-allowed" : "pointer",
          }}
        >
          &gt;
        </button>
      )}
    </div>
  );
};

export default Blogs;
