import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  // Page numbers that get their own button.
  const getShownPages = () => {
    // Few enough pages: show them all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Near the start: first 4 + last
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    // Near the end: first + last 4
    if (page >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    // Middle: first + current window + last
    return [1, page - 1, page, page + 1, totalPages];
  };

  // The ellipsis is styled exactly like a page button (same circle, same size),
  // so readers click it. It used to be an inert <span> — a dead click. Each gap
  // now jumps to the middle of the range it hides.
  const getItems = () => {
    const shown = getShownPages();
    const items = [];
    shown.forEach((value, index) => {
      const prev = shown[index - 1];
      if (prev !== undefined && value - prev > 1) {
        items.push({ type: "gap", target: Math.floor((prev + value) / 2) });
      }
      items.push({ type: "page", value });
    });
    return items;
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
      {getItems().map((item, index) =>
        item.type === "gap" ? (
          <button
            key={`gap-${index}`}
            type="button"
            className={styles.dots}
            onClick={() => onPageChange(item.target)}
            aria-label={`Jump to page ${item.target}`}
            title={`Jump to page ${item.target}`}
          >
            ...
          </button>
        ) : (
          <button
            key={item.value}
            type="button"
            className={`${styles.pageBtn} ${page === item.value ? styles.active : ''}`}
            // The current page has nothing to navigate to; disabling it keeps it
            // from reading as a live control.
            disabled={page === item.value}
            aria-current={page === item.value ? "page" : undefined}
            aria-label={`Go to page ${item.value}`}
            onClick={() => onPageChange(item.value)}
          >
            {item.value}
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
