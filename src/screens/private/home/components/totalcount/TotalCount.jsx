import React from "react";
import styles from "./TotalCount.module.scss";
import { FaUserFriends, FaComments, FaStar } from "react-icons/fa";

const TotalCount = ({ data }) => {
  const totalCount = data?.find((item) => item.slug === "total-count");
  const contentArr = totalCount?.content || [];

  const astroCount = contentArr.find((v) => v.findAllAstro)?.findAllAstro || 0;
  const userCount = contentArr.find((v) => v.findAllUser)?.findAllUser || 0;
  const msgCount = contentArr.find((v) => v.findAllMsg)?.findAllMsg || 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <FaStar className={styles.icon} style={{ color: "#FFD43B" }} />
        <h2>{astroCount}</h2>
        <p>Astrologers</p>
      </div>

      <div className={styles.card}>
<FaUserFriends className={styles.icon} style={{ color: "#4FD1C5" }} />
        <h2>{userCount}</h2>
        <p>Users</p>
      </div>

      <div className={styles.card}>
<FaComments className={styles.icon} style={{ color: "#67B0FF" }} />
        <h2>{msgCount}</h2>
        <p>Total Messages</p>
      </div>
    </div>
  );
};

export default TotalCount;
