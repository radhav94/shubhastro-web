import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./BlogHeader.module.scss";
import { BlogCard } from "../../../../component";
import Pagination from "../../../../component/pagination/Pagination";
import { useGetBlogQuery } from "../../../../services/appServices/blogService";
import { PATH } from "../../../../utils/routes/Paths";

const BlogHeader = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetBlogQuery({ page, limit: 10 });

  const blogs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <section className={styles.blogSection}>
      <div className={styles.headerSection}>
        <h2 className={styles.headerTitle}>ALL BLOGS</h2>
        <div className={styles.titleDivider}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <path d="M92.803 0.406393C92.803 0.630933 90.7481 0.812789 88.2131 0.812789C85.6781 0.812789 0 0.630933 0 0.406393C0 0.181853 85.6786 0 88.2131 0C90.7481 0 92.803 0.181853 92.803 0.406393Z" fill="#030303"/>
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <path d="M-4.06066e-06 0.406393C-4.06066e-06 0.630933 2.05498 0.812789 4.58996 0.812789C7.12494 0.812789 92.803 0.630933 92.803 0.406393C92.803 0.181853 7.12439 0 4.58996 0C2.05498 0 -4.06066e-06 0.181853 -4.06066e-06 0.406393Z" fill="#030303"/>
            </svg>     
          </div>
        </div>
      </div>

      {blogs.length > 0 ? (
        <>
          <div className={styles.blogsContainer}>
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog.slug || blog._id)}
                className={styles.blogLink}
              >
                <BlogCard
                  image={blog.img}
                  title={blog.title}
                  date={blog.publishDate}
                  blogId={blog.blogId || blog._id}
                />
              </Link>
            ))}
          </div>

          {pagination && (
            <div className={styles.paginationWrapper}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <p className={styles.emptyState}>No blogs available at the moment.</p>
      )}
    </section>
  );
};


export default BlogHeader;
