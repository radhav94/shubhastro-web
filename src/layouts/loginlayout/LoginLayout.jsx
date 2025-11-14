import React from "react";
import styles from "./LoginLayout.module.scss";

const LoginLayout = ({ children, register }) => {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.leftImage}></div>

      <div className={styles.rightContent}>
        <span className={styles.wrapTriangle}></span>

        <div
          className={`${styles.childrenContainer} ${
            register ? styles.registerWide : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default LoginLayout;
