// DividerWithImage.jsx
import React from "react";
import styles from "./DividerWithImage.module.scss";

const DividerWithImage = ({ imageSrc, imageAlt, lineColor = "#ccc", lineHeight = "1px" }) => {
  return (
    <div
      className={styles.wrapper}
      style={{ "--line‑color": lineColor, "--line‑height": lineHeight }}
    >
      <img src={imageSrc} alt={imageAlt} className={styles.image} />
    </div>
  );
};

export default DividerWithImage;
