import React from "react";
import styles from "./Pagination.module.scss";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      // Show all pages if small count
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
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className={styles.paginationWrapper}>
      <button
        disabled={!hasPrevPage}
        onClick={() => hasPrevPage && onPageChange(page - 1)}
      >
        ← Previous
      </button>

      <div className={styles.pages}>
        {getPages().map((item, index) =>
          item === "..." ? (
            <span key={`dots-${index}`} className={styles.dots}>
              ...
            </span>
          ) : (
            <button
              key={item}
              className={page === item ? styles.active : ""}
              onClick={() => item !== page && onPageChange(item)}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        disabled={!hasNextPage}
        onClick={() => hasNextPage && onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
};

export default Pagination;
