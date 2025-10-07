import React from "react";
import styles from "./LoginLayout.module.scss";

const LoginLayout = ({ children }) => {
  return (
    <div className={styles.mainContainer}>
      <span className={styles.wrapTriangle}>
        <span className={styles.triangle}></span>
      </span>
      <span className={styles.childrenContainer}>{children}</span>
    </div>
  );
};

export default LoginLayout;
