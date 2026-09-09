import { memo } from "react";
import { IoClose } from "react-icons/io5";
import styles from "./ReplyPreview.module.scss";

/**
 * Quoted snapshot of the message being replied to.
 *
 * Two placements share this component:
 *   1. Inside a chat bubble (variant="bubble") — shows the quoted message above
 *      the reply text.
 *   2. Above the composer/input (variant="composer") — shows what the user is
 *      about to reply to, with a close button to cancel.
 *
 * reply: { messageId, content, role } where role is 'user' | 'assistant' | 'ai'.
 *
 * onJumpTo (bubble variant only): called with reply.messageId when the quote is
 * tapped, so the parent can scroll to and highlight the original message.
 */
const ReplyPreview = memo(({ reply, variant = "bubble", onCancel, onJumpTo }) => {
  if (!reply) return null;

  const content = reply.content ?? reply.message ?? reply.text ?? "";
  const role = reply.role ?? reply.sender ?? "";
  const isSelf = role === "user";
  const authorLabel = isSelf ? "You" : "AI";

  const isJumpable =
    variant === "bubble" && typeof onJumpTo === "function" && !!reply.messageId;

  const inner = (
    <>
      <div className={styles.accent} />
      <div className={styles.body}>
        <span className={styles.author}>{authorLabel}</span>
        <span className={styles.text}>{content}</span>
      </div>
      {variant === "composer" && typeof onCancel === "function" && (
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          aria-label="Cancel reply"
        >
          <IoClose size={18} />
        </button>
      )}
    </>
  );

  const className = `${styles.replyPreview} ${
    variant === "composer" ? styles.composer : styles.bubble
  } ${isJumpable ? styles.jumpable : ""}`;

  // Tapping the quote jumps to the original message (WhatsApp behaviour).
  if (isJumpable) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onJumpTo(reply.messageId)}
        aria-label="Go to the replied message"
      >
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
});

ReplyPreview.displayName = "ReplyPreview";

export default ReplyPreview;
