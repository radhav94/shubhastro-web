import { useState } from "react";
import { FiSend, FiChevronDown } from "react-icons/fi";
import styles from "../Community.module.scss";
import {
  useGetPostCommentsQuery,
  useAddPostCommentMutation,
} from "../../../../redux/api/community/communityApi";
import Toast from "../../../../component/toast";
import { getUserFromStorage } from "../../../../utils/authStorage";

const getTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

// Single comment item (used for both top-level and replies)
const CommentItem = ({ comment }) => {
  const authorName = comment.isAnonymous
    ? "Anonymous"
    : comment.authorName || "User";

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentAvatar}>
        {!comment.isAnonymous && comment.authorImage ? (
          <img src={comment.authorImage} alt={authorName} />
        ) : (
          <span className={styles.commentInitials}>
            {getInitials(authorName)}
          </span>
        )}
      </div>
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>
            {authorName}
            {comment.isVerifiedAuthor && (
              <span className={styles.commentVerified}>✓</span>
            )}
          </span>
          <span className={styles.commentTime}>{getTimeAgo(comment.createdAt)}</span>
        </div>
        <p className={styles.commentText}>{comment.body}</p>
      </div>
    </div>
  );
};

const CommentSection = ({ postId }) => {
  const [commentText, setCommentText] = useState("");
  const [page, setPage] = useState(1);

  const user = getUserFromStorage();
  const currentUserName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "You"
    : "You";
  const currentUserImage = user?.profileImgUrl || null;

  const { data, isLoading, isFetching, refetch } = useGetPostCommentsQuery({
    postId,
    page,
    limit: 20,
    sort: "oldest",
  });
  const [addComment, { isLoading: isSending }] = useAddPostCommentMutation();

  const comments = data?.comments || [];
  const pagination = data?.pagination || {};
  const hasMore = page < (pagination.pages || 1);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await addComment({
        postId,
        body: commentText.trim(),
        isAnonymous: false,
      }).unwrap();
      setCommentText("");
      refetch();
    } catch (error) {
      Toast.error(error?.data?.message || "Failed to post comment");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.commentSection}>
      {/* Comments List */}
      <div className={styles.commentsList}>
        {isLoading && (
          <div className={styles.commentLoading}>Loading comments...</div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className={styles.commentLoading}>No comments yet. Be the first to comment!</div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
          />
        ))}

        {hasMore && (
          <button
            className={styles.loadMoreBtn}
            onClick={() => setPage((prev) => prev + 1)}
            disabled={isFetching}
          >
            {isFetching ? "Loading..." : "Load More"} <FiChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Comment Input */}
      <div className={styles.commentInputWrapper}>
        <div className={styles.commentInputAvatar}>
          {currentUserImage ? (
            <img src={currentUserImage} alt={currentUserName} />
          ) : (
            <span className={styles.commentInitials}>{getInitials(currentUserName)}</span>
          )}
        </div>
        <div className={styles.commentInputBox}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.commentInput}
            disabled={isSending}
          />
          <button
            className={styles.commentSendBtn}
            onClick={handleSubmit}
            disabled={!commentText.trim() || isSending}
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
