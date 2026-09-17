import { useState, useRef, forwardRef, useEffect } from "react";
import { FiSend, FiTrash2 } from "react-icons/fi";
import styles from "../Community.module.scss";
import {
  useGetPostCommentsQuery,
  useAddPostCommentMutation,
  useDeleteCommunityCommentMutation,
} from "../../../../redux/api/community/communityApi";
import Toast from "../../../../component/toast";
import { getUserFromStorage } from "../../../../utils/authStorage";
import DeleteConfirmationModal from "../../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import { trackEvent } from "../../../../utils/analytics";

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
  return name.trim()[0]?.toUpperCase() || "?";
};

// Single comment item (used for both top-level and replies)
const CommentItem = forwardRef(({ comment, currentUserId, onDelete }, ref) => {
  const authorName = comment.isAnonymous
    ? "Anonymous"
    : comment.authorName || "User";

  const isOwnComment = currentUserId && comment.authorId === currentUserId;

  return (
    <div className={styles.commentItem} ref={ref}>
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
          {isOwnComment && (
            <button
              className={styles.commentDeleteBtn}
              onClick={() => onDelete(comment._id)}
              title="Delete comment"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
        <p className={styles.commentText}>{comment.body}</p>
      </div>
    </div>
  );
});

CommentItem.displayName = "CommentItem";

const CommentSection = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const [commentText, setCommentText] = useState("");
  const [deletedIds, setDeletedIds] = useState([]);
  const [refetchKey, setRefetchKey] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentsListRef = useRef(null);

  const user = getUserFromStorage();
  const currentUserId = user?.id || null;
  const currentUserName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "You"
    : "You";
  const currentUserImage = user?.profileImgUrl || null;

  const { data, isLoading } = useGetPostCommentsQuery({
    postId,
    page: 1,
    limit: 50,
    sort: "newest",
    refetchKey,
  });
  const [addComment, { isLoading: isSending }] = useAddPostCommentMutation();
  const [deleteComment] = useDeleteCommunityCommentMutation();

  // Track post view when the post's comment section opens
  useEffect(() => {
    if (postId) trackEvent("community_post_viewed", { post_id: postId });
  }, [postId]);

  const comments = (data?.comments || []).filter((c) => !deletedIds.includes(c._id)).slice().reverse();

  const handleDeleteComment = (commentId) => {
    setDeleteCommentId(commentId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    setIsDeleting(true);
    try {
      await deleteComment(deleteCommentId).unwrap();
      setDeletedIds((prev) => [...prev, deleteCommentId]);
      onCommentDeleted?.();
      Toast.success("Comment deleted");
    } catch (error) {
      Toast.error(error?.data?.message || "Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteCommentId(null);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await addComment({
        postId,
        body: commentText.trim(),
        isAnonymous: false,
      }).unwrap();
      trackEvent("community_post_commented", { post_id: postId });
      setCommentText("");
      setRefetchKey((k) => k + 1);
      onCommentAdded?.();
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 800);
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
      <div className={styles.commentsList} ref={commentsListRef}>
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
            currentUserId={currentUserId}
            onDelete={handleDeleteComment}
          />
        ))}
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
            {isSending ? (
              <span className={styles.commentSendSpinner} />
            ) : (
              <FiSend size={18} />
            )}
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={confirmDeleteComment}
        onClose={() => { setDeleteModalOpen(false); setDeleteCommentId(null); }}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CommentSection;
