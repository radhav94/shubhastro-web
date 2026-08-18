import styles from "./Pagination.module.scss";
import toast from "../toast";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  // The flags are only a hint. `page`/`totalPages` are authoritative — if you
  // are on page 4 there is a page 3, whatever the payload says — and callers
  // have got the flag names wrong before (one reads `hasPreviousPage`, which no
  // endpoint here returns, so Previous was permanently inert). Cursor-style
  // callers that know there is more but not how much still work through the
  // flag, hence the union rather than a straight replacement.
  const canPrev = Boolean(hasPrevPage) || page > 1;
  const canNext = Boolean(hasNextPage) || page < totalPages;

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

  // The list being paged sits *above* these controls, so a tap on the page you
  // are already on has somewhere useful to go: back to the top of it. That
  // turns the one genuinely inert control into a live one.
  const scrollToListTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className={styles.paginationWrapper}>
      {/* Previous Arrow */}
      <button
        type="button"
        className={`${styles.arrowBtn} ${!canPrev ? styles.disabled : ''}`}
        // Never `disabled`: at the range boundary the arrow still looks like a
        // control, and a tap that changes nothing on screen reads as a broken
        // page. Say which end of the range we are at instead.
        aria-disabled={!canPrev}
        onClick={() => {
          if (!canPrev) {
            toast.info("You're on the first page.");
            return;
          }
          onPageChange(page - 1);
        }}
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
            aria-disabled={page === item.value}
            aria-current={page === item.value ? "page" : undefined}
            aria-label={`Go to page ${item.value}`}
            onClick={() => {
              if (page === item.value) {
                toast.info(`You're already on page ${item.value}.`);
                scrollToListTop();
                return;
              }
              onPageChange(item.value);
            }}
          >
            {item.value}
          </button>
        )
      )}

      {/* Next Arrow */}
      <button
        type="button"
        className={`${styles.arrowBtn} ${!canNext ? styles.disabled : ''}`}
        aria-disabled={!canNext}
        onClick={() => {
          if (!canNext) {
            toast.info(`You're on the last page (${totalPages} of ${totalPages}).`);
            return;
          }
          onPageChange(page + 1);
        }}
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
