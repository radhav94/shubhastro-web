import { memo } from "react";

/**
 * Reusable section title with the crescent moon divider.
 * Eliminates repeated SVG markup across section components.
 */
const SectionTitle = memo(({ title, styles }) => (
  <div className={styles.titleWithBottomDevider}>
    <h4 className={styles.wowTitle}>{title}</h4>
    <div className={styles.BottomDevider}>
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
        <path
          d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z"
          fill="#030303"
        />
      </svg>
    </div>
  </div>
));

SectionTitle.displayName = "SectionTitle";

export default SectionTitle;
