import { Link } from "react-router-dom";
import styles from "./Compatibility.module.scss";
import React from "react";

const ConnectWithAstrologer = () => {
  return (
    <section className={styles.bannerBox}>
      <div className={styles.bannerContent}>
        <h3>Connect with an Astrologer on Call or Chat</h3>
        <Link to={"/talk-to-astrologers"}>
          <button className={styles.callBtn}>📞 Talk to Astrologer</button>
        </Link>
        <Link to={"/talk-to-astrologers"}>
          <button className={styles.chatBtn}>💬 Chat with Astrologer</button>
        </Link>
      </div>
    </section>
  );
};

export default ConnectWithAstrologer;
