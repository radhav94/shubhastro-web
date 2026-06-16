import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPages = () => {
    // Few enough pages: show them all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set();

    // Always include first and last
    pages.add(1);
    pages.add(totalPages);

    // Window around the current page
    for (let i = page - 1; i <= page + 1; i++) {
      if (i > 1 && i < totalPages) pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);

    // Build the final list, inserting "..." only when the gap is > 1.
    // If the gap is exactly 1, show the missing page number instead of dots.
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      const next = sorted[i + 1];
      if (next) {
        if (next - sorted[i] === 2) {
          result.push(sorted[i] + 1);
        } else if (next - sorted[i] > 2) {
          result.push("...");
        }
      }
    }

    return result;
  };

  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className={styles.paginationWrapper}>
      {/* Previous Arrow */}
      <button
        className={`${styles.arrowBtn} ${!hasPrevPage ? styles.disabled : ''}`}
        disabled={!hasPrevPage}
        onClick={() => hasPrevPage && onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Page Numbers */}
      {getPages().map((item, index) =>
        item === "..." ? (
          <span key={`dots-${index}`} className={styles.dots}>
            •••
          </span>
        ) : (
          <button
            key={item}
            className={`${styles.pageBtn} ${page === item ? styles.active : ''}`}
            onClick={() => item !== page && onPageChange(item)}
          >
            {item}
          </button>
        )
      )}

      {/* Next Arrow */}
      <button
        className={`${styles.arrowBtn} ${!hasNextPage ? styles.disabled : ''}`}
        disabled={!hasNextPage}
        onClick={() => hasNextPage && onPageChange(page + 1)}
        aria-label="Next page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
