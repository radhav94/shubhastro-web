import { memo } from "react";
import styles from "./MessageTicks.module.scss";

/**
 * WhatsApp-style delivery ticks for a chat message.
 *
 * status:
 *   'sending'   → clock icon (optimistic, not yet acknowledged)
 *   'sent'      → single grey tick
 *   'delivered' → double grey tick
 *   'read'      → double blue tick
 *
 * Only shown for the current user's own messages (the sender never sees ticks
 * on the other party's bubbles), so callers should gate on `isUser`.
 */
const MessageTicks = memo(({ status = "sent", variant = "onDark", className = "" }) => {
  // onDark: bubble has white text (grey ticks are light).
  // onLight: bubble has a light background with dark text (grey ticks are dark).
  const greyClass = variant === "onLight" ? styles.greyOnLight : styles.grey;

  if (status === "sending") {
    return (
      <span
        className={`${styles.ticks} ${
          variant === "onLight" ? styles.sendingOnLight : styles.sending
        } ${className}`}
        aria-label="Sending"
        role="img"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7.5V12l3 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  const isDouble = status === "delivered" || status === "read";
  const isRead = status === "read";
  const label =
    status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent";

  return (
    <span
      className={`${styles.ticks} ${isRead ? styles.read : greyClass} ${className}`}
      aria-label={label}
      role="img"
    >
      <svg
        width={isDouble ? "18" : "14"}
        height="14"
        viewBox={isDouble ? "0 0 20 14" : "0 0 16 14"}
        fill="none"
      >
        {/* first (back) tick */}
        <path
          d={isDouble ? "M1 8.5L4.5 12L11 4" : "M2 8L6 12L14 3"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* second (front) tick — only for double */}
        {isDouble && (
          <path
            d="M8 8.5L11.5 12L19 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
});

MessageTicks.displayName = "MessageTicks";

export default MessageTicks;
