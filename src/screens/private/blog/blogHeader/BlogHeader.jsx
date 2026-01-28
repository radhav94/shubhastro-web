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

  if (isLoading) {
    return <p className={styles.loading}>Loading blogs...</p>;
  }

  const blogs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <section className={styles.blogSection}>
      <div className={styles.headerSection}>
        <h2 className={styles.headerTitle}>ALL BLOGS</h2>
      </div>

      {blogs.length > 0 ? (
        <>
          <div className={styles.blogsContainer}>
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={PATH.privateRoutes.SINGLEBLOG.path.replace(":slug", blog._id)}
                className={styles.blogLink}
              >
                <BlogCard
                  image={blog.img}
                  title={blog.title}
                  date={blog.publishDate}
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
