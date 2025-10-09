import React from "react";
import styles from "./Title.module.scss"; // Using SCSS module for styling
import Divider from "./Divider";
import PrimaryButton from "./PrimaryButton";

const Title = ({
  title = "Section Title",
  showDivider = false,
  showButton = false,
  buttonTitle = "View All",
  onButtonClick = () => {}, // Added an onClick handler for the button
}) => {
  return (
    <div className={styles.titleContainer}>
      <div className={styles.titleWrapper}>
        {/* Use a semantic heading tag for better SEO and accessibility */}
        <h2 className={styles.titleText}>{title}</h2>

        {/* The divider is now part of the title wrapper for better layout control */}
        {showDivider && <Divider responsive />}
      </div>

      {showButton && (
        <div className={styles.buttonWrapper}>
          <PrimaryButton title={buttonTitle} onClick={onButtonClick} />
        </div>
      )}
    </div>
  );
};

export default Title;
