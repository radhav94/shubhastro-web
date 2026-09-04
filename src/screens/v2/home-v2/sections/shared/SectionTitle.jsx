import { memo } from "react";

/**
 * Reusable section title with the crescent moon divider.
 * Eliminates repeated SVG markup across section components.
 *
 * <h2> because this is a top-level section title, the same rank as the hero's
 * "Your AI Suite" and AstrologerGridSection's "TOP RATED ASTROLOGERS FOR YOU".
 * It was an <h4>, which made the homepage skip from <h2> straight to <h4>
 * whenever an h2-titled section was followed by one of these — the "Heading
 * elements are not in a sequentially-descending order" failure. Level is
 * decided by rank in the outline, not by size: the size comes from .wowTitle,
 * and Tailwind's preflight zeroes the UA font-size/weight/margin on every
 * heading, so the tag swap is visually inert.
 */
const SectionTitle = memo(({ title, styles }) => (
  <div className={styles.titleWithBottomDevider}>
    <h2 className={styles.wowTitle}>{title}</h2>
  </div>
));

SectionTitle.displayName = "SectionTitle";

export default SectionTitle;
