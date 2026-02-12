import BlogHeader from "./blogHeader/BlogHeader";
import Blogs from "../home/components/blogs/Blogs";
import MoreBlogsCarousel from "../../../component/UI/cards/MoreBlogsCarousel";
import PopularBlogsSection from "../../../component/UI/cards/PopularBlogsSection";
import RelationalBlogsSection from "../../../component/UI/cards/RelationalBlogsSection";
import TrendingBlogsCarousel from "../../../component/UI/cards/TrendingBlogsCarousel";
import { useGetBlogPageDataQuery } from "../../../services/appServices/blogService";

const Blog = () => {
  const { data: blogPageData, isLoading } = useGetBlogPageDataQuery({ page: 1, limit: 10 });
  
  // Extract data from the homepage API response based on slug
  const blogList = blogPageData?.data?.list || [];
  
  const trendingSection = blogList.find(item => item.slug === "trending");
  const relationshipSection = blogList.find(item => item.slug === "relationship_dynamics");
  const popularSection = blogList.find(item => item.slug === "popular_blogs");
  const moreSection = blogList.find(item => item.slug === "more_blogs_for_you");
  
  const trendingBlogs = trendingSection?.content || [];
  const relationalBlogs = relationshipSection?.content || [];
  const popularBlogs = popularSection?.content || [];
  const moreBlogs = moreSection?.content || [];
  
  // Extract titles and subtitles from API (handle both subtitle and sub_title)
  const trendingTitle = trendingSection?.title;
  const trendingSubtitle = trendingSection?.sub_title || trendingSection?.subtitle;
  
  const relationshipTitle = relationshipSection?.title;
  const relationshipSubtitle = relationshipSection?.sub_title || relationshipSection?.subtitle;
  
  const popularTitle = popularSection?.title;
  const popularSubtitle = popularSection?.sub_title || popularSection?.subtitle;
  
  const moreTitle = moreSection?.title;
  const moreSubtitle = moreSection?.sub_title || moreSection?.subtitle;

  return (
    <>
      {/* Trending Blogs Carousel - at the very top */}
      {trendingBlogs.length > 0 && (
        <TrendingBlogsCarousel 
          blogs={trendingBlogs} 
          title={trendingTitle}
          subtitle={trendingSubtitle}
        />
      )}
      
      {/* Relational Blogs Section */}
      {relationalBlogs.length > 0 && (
        <RelationalBlogsSection 
          blogs={relationalBlogs}
          title={relationshipTitle}
          subtitle={relationshipSubtitle}
        />
      )}

      {/* Popular Blogs Section */}
      {popularBlogs.length > 0 && (
        <PopularBlogsSection 
          blogs={popularBlogs}
          title={popularTitle}
          subtitle={popularSubtitle}
        />
      )}
      
      {/* More Blogs Carousel */}
      {moreBlogs.length > 0 && (
        <MoreBlogsCarousel 
          blogs={moreBlogs} 
          currentBlogId={null}
          title={moreTitle}
          subtitle={moreSubtitle}
        />
      )}
      
      {/* All Blogs Title */}
      <BlogHeader />
      <Blogs titleShow={false} />
    </>
  );
};

export default Blog;
