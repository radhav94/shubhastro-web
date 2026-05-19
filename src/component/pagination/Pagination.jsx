import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Left dots
    if (page > 3) {
      pages.push("...");
    }

    // Middle pages
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Right dots
    if (page < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages > 1) {
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
