import React from "react";

import { GrFormNext } from "react-icons/gr";
import Styles from "./BlogCard.module.scss";
import PrimaryText from "../../PrimaryText";
import { appColors } from "../../../utils/theme";

const BlogCard = ({ image, title, author, date, authorIcon }) => {
  return (
    <div className={Styles.blogCard}>
      <img src={image} alt={title} className={Styles.mainImage} />

      <PrimaryText isBold style={{ padding: "8px" }}>
        {title}
      </PrimaryText>

      <div className={Styles.blogInfo}>
        <div className={Styles.authorDate}>
          {authorIcon && (
            <img src={authorIcon} alt={author} className={Styles.authorIcon} />
          )}
          <PrimaryText color={appColors.greyMedium} size_14>
            {author} |{" "}
          </PrimaryText>
          <PrimaryText color={appColors.greyMedium} size_14>
            {date}
          </PrimaryText>
        </div>
        <GrFormNext className={Styles.arrowIcon} />
      </div>
    </div>
  );
};

export default BlogCard;
