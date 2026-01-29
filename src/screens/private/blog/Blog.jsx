import React from "react";
import styles from "./Blog.module.scss";
import BlogHeader from "./blogHeader/BlogHeader";
import Blogs from "../home/components/blogs/Blogs";
import MoreBlogsCarousel from "../../../component/UI/cards/MoreBlogsCarousel";
import PopularBlogsSection from "../../../component/UI/cards/PopularBlogsSection";
import RelationalBlogsSection from "../../../component/UI/cards/RelationalBlogsSection";
import TrendingBlogsCarousel from "../../../component/UI/cards/TrendingBlogsCarousel";
import { useGetBlogQuery } from "../../../services/appServices/blogService";

const Blog = () => {
  const { data: blogsData } = useGetBlogQuery({ page: 1, limit: 10 });
  const allBlogs = blogsData?.data?.blogs || blogsData?.data || [];

  return (
    <>
      {/* Trending Blogs Carousel - at the very top */}
      <TrendingBlogsCarousel blogs={allBlogs} />
      
      {/* Relational Blogs Section */}
      <RelationalBlogsSection blogs={allBlogs} />
      
      {/* Popular Blogs Section */}
      <PopularBlogsSection blogs={allBlogs} />
      
      {/* More Blogs Carousel */}
      <MoreBlogsCarousel blogs={allBlogs} currentBlogId={null} />
      
      {/* All Blogs Title */}
      <BlogHeader />
      <Blogs titleShow={false} />
    </>
  );
};

export default Blog;
