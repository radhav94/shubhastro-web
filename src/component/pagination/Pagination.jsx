import React from "react";
import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  // Utility: generate numbered pagination with dots
  const getPages = () => {
    const pages = [];

    // Always show first page
    if (page > 2) pages.push(1);

    // Add dots before current page
    if (page > 3) pages.push("...");

    // Previous page (only if >1)
    if (page > 1) pages.push(page - 1);

    // Current page
    pages.push(page);

    // Next page
    if (page < totalPages) pages.push(page + 1);

    // Add dots after current
    if (page < totalPages - 2) pages.push("...");

    // Always show last page
    if (page < totalPages - 1) pages.push(totalPages);

    return pages;
  };

  const pagesToShow = getPages();

  return (
    <div className={styles.paginationWrapper}>
      <button
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
      >
        ← Previous
      </button>

      <div className={styles.pages}>
        {pagesToShow.map((num, i) =>
          num === "..." ? (
            <span key={i} className={styles.dots}>...</span>
          ) : (
            <button
              key={num}
              className={page === num ? styles.active : ""}
              onClick={() => onPageChange(num)}
            >
              {num}
            </button>
          )
        )}
      </div>

      <button
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
};

export default Pagination;
