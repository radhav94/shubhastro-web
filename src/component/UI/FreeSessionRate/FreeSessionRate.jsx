import styles from "./FreeSessionRate.module.scss";

/*
 * The rate line under a Chat/Call button while the first-session-free offer is
 * on: the normal per-minute rate struck through, followed by "Free".
 *
 * One component rather than the same two spans inline in each card — the rate
 * line is duplicated across nine render sites (both shared cards, the profile's
 * two variants, the v2 home cards, the recommended-astrologers panel), and a
 * promo that says "Free" on six of them and a price on the other three is worse
 * than not running it.
 *
 * Callers decide WHETHER to render this (they own the flag check and the
 * discount branch it replaces); this only owns how it looks.
 *
 * @param {Object} props
 * @param {number|string} props.amount - the rate being waived, without the ₹
 * @param {string} [props.unit] - "/min" by default; some cards write " min"
 * @param {string} [props.className] - host's own price-text class, so the line
 *   inherits that card's font size
 */
const FreeSessionRate = ({ amount, unit = "/min", className = "" }) => (
  <span className={`${styles.wrap} ${className}`.trim()}>
    {/* <s> rather than a line-through class alone: the rate is no longer
        accurate, which is exactly what the element means. */}
    <s className={styles.was}>
      ₹{amount}
      {unit}
    </s>
    <span className={styles.free}>Free</span>
  </span>
);

export default FreeSessionRate;
