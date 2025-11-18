import React, { useState } from "react";
import styles from "./BlogHeader.module.scss";
import { BlogCard } from "../../../../component";
import { useGetBlogQuery } from "../../../../services/appServices/blogService";
import { Link } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import { blogResponse } from "./data";  // <-- updated
import Pagination from "../../../../component/pagination/Pagination";


// AstroTalk style astrology images
const astroImages = [
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/19191028/Leo-Daily-Horoscope-Today.jpg", // astrology chart
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/20121804/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-10-768x512.jpg", // zodiac wheel
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/18190254/Copy-of-Blog-Banner-for-Website-Content-1280-x-853-px-3-768x512.jpg", // planets galaxy
  "https://d2wkagtnczagqh.cloudfront.net/astrology-blog/wp-content/uploads/2025/06/16143512/Blog-Banner-for-Website-Content-1280-x-853-px-9-768x512.jpg", // constellation
];

const BlogHeader = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetBlogQuery({ page, limit: 10 });

  if (isLoading) return <p>Loading...</p>;

  const blogs = data?.data || [];

  const pagination = data?.pagination;


  return (
    <>
      <div className={styles.blogsContainer}>
        {blogs?.map((blog, index) => (
          <Link
            key={blog._id}
            to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog._id)}
            className={styles.blogLink}
          >
            <BlogCard
              image={astroImages[index % astroImages.length]}
              title={blog.title}
              date={blog.publishDate}
            />
          </Link>
        ))}
      </div>

      {/* Pagination UI */}
      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}
    </>
  );
};

export default BlogHeader;

