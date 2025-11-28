import React from "react";
import styles from "./TotalCount.module.scss";

const TotalCount = ({ data }) => {
  const totalCount = data?.find((item) => item.slug === "total-count");
  const contentArr = totalCount?.content || [];

  const astroCount = contentArr.find((v) => v.findAllAstro)?.findAllAstro || 0;
  const userCount = contentArr.find((v) => v.findAllUser)?.findAllUser || 0;
  const msgCount = contentArr.find((v) => v.findAllMsg)?.findAllMsg || 0;

  return (
    <div className={styles.statsWrapper}>
      <div className={styles.statBox}>
        <h2>{astroCount}+</h2>
        <p>Total Astrologers</p>
      </div>

      <div className={styles.statBox}>
        <h2>{userCount}+</h2>
        <p>Total Customers</p>
      </div>

      <div className={styles.statBox}>
        <h2>{msgCount}+</h2>
        <p>Total Messages</p>
      </div>
    </div>
  );
};

export default TotalCount;
