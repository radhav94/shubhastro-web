import { Link } from "react-router-dom";
import styles from "./Compatibility.module.scss";
import React from "react";

/*
 * Both CTAs used to be a <button> nested inside the <Link>:
 *
 *   <Link to="/astrologers"><button className={styles.callBtn}>…</button></Link>
 *
 * That is interactive content inside interactive content, which the HTML parser
 * is not required to keep intact. Browsers reparent or ignore the nesting
 * inconsistently, and the inner button can absorb the click without the anchor
 * ever navigating — a dead click on the only two CTAs this banner has. The
 * buttons also had no `type`, so they defaulted to `type="submit"`.
 *
 * The anchor is the correct element here: both go to a URL, and as anchors they
 * get middle-click, long-press and "open in new tab" for free, which the nested
 * button swallowed.
 */
const ConnectWithAstrologer = () => {
  return (
    <section className={styles.bannerBox}>
      <div className={styles.bannerContent}>
        <h3>Connect with an Astrologer on Call or Chat</h3>
        <Link to="/astrologers" className={styles.callBtn}>
          📞 Talk to Astrologer
        </Link>
        <Link to="/astrologers" className={styles.chatBtn}>
          💬 Chat with Astrologer
        </Link>
      </div>
    </section>
  );
};

export default ConnectWithAstrologer;
