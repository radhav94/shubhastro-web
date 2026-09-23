import React from "react";

import styles from "./CircleSpinner.module.scss";

/*
 * Route-transition spinner.
 *
 * Was an <img> pointing at a 94 KB / 360-frame GIF; see CircleSpinner.module.scss
 * for why that was replaced with CSS and why the 90px box is load-bearing.
 */
const CircleSpinner = () => {
  return (
    <span className={styles.wrap} role="status" aria-label="Loading">
      <span className={styles.ring} />
    </span>
  );
};

export default CircleSpinner;
