import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPages = () => {
    // Few enough pages: show them all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (page <= 3) {
      // Near the start: show first 4 pages + ... + last
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (page >= totalPages - 2) {
      // Near the end: show first + ... + last 4 pages
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      // Middle: show first + ... + current window + ... + last
      pages.push(1);
      pages.push("...");
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
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
            ...
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
