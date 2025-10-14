import React from "react";
import styles from "./Blog.module.scss";
import BlogHeader from "./blogHeader/BlogHeader";
import Blogs from "../home/components/blogs/Blogs";

const Blog = () => {
  return (
    <>
      <BlogHeader />
      <Blogs titleShow={false} />
    </>
  );
};

export default Blog;
