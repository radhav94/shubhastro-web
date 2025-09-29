import React from "react";

import Styles from "./Blogs.module.scss";
import { BlogCard, Title } from "../../../../../component";
import { AppIcons, AppImages } from "../../../../../utils/appImages";

const blogData = [
  {
    id: 1,
    image: AppImages.Blog1,
    title: "Top 5 Fearless Zodiac Signs and Their Bold Traits",
    author: "Astro Roli",
    date: "Wed, Sep 24, 2025",
    authorIcon: AppIcons.Call,
  },
  {
    id: 2,
    image: AppImages.Blog1,
    title: "Understanding Your Moon Sign and Personality",
    author: "Astro Roli",
    date: "Tue, Sep 23, 2025",
    authorIcon: AppIcons.Call,
  },
  {
    id: 3,
    image: AppImages.Blog1,
    title: "Top 5 Fearless Zodiac Signs and Their Bold Traits",
    author: "Astro Roli",
    date: "Wed, Sep 24, 2025",
    authorIcon: AppIcons.Call,
  },
];

const Blogs = () => {
  return (
    <div>
      <Title title="Blogs" showButton showDivider />

      <div className={Styles.blogsContainer}>
        {blogData.map((blog) => (
          <BlogCard
            key={blog.id}
            image={blog.image}
            title={blog.title}
            author={blog.author}
            date={blog.date}
            authorIcon={blog.authorIcon}
          />
        ))}
      </div>
    </div>
  );
};

export default Blogs;
