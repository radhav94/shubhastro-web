import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiTrash2, FiEdit2 } from "react-icons/fi";
import { PiShareNetwork } from "react-icons/pi";
import styles from "../Community.module.scss";
import TrendingAstrologers from "./TrendingAstrologers";
import CommentSection from "./CommentSection";
import {
  useGetCommunityLibraryQuery,
  useDeleteCommunityPostMutation,
  useLikeCommunityPostMutation,
  useShareCommunityPostMutation,
} from "../../../../redux/api/community/communityApi";
import Toast from "../../../../component/toast";
import { getUserFromStorage } from "../../../../utils/authStorage";

const YourPosts = ({ trendingAstrologers = [], sectionContent = [] }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deletedIds, setDeletedIds] = useState([]);
  const [openComments, setOpenComments] = useState({});
  const [likeState, setLikeState] = useState({});
  const [shareState, setShareState] = useState({});
  const observerRef = useRef(null);
  const [deletePost] = useDeleteCommunityPostMutation();
  const [likePost] = useLikeCommunityPostMutation();
  const [sharePost] = useShareCommunityPostMutation();
  const currentUser = getUserFromStorage();

  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleLike = async (postId) => {
    setLikeState((prev) => {
      const current = prev[postId];
      if (current !== undefined) {
        return { ...prev, [postId]: { liked: !current.liked, count: current.liked ? current.count - 1 : current.count + 1 } };
      }
      const post = posts.find((p) => p._id === postId);
      const wasLiked = post?.isLiked || false;
      const currentCount = post?.likesCount || 0;
      return { ...prev, [postId]: { liked: !wasLiked, count: wasLiked ? currentCount - 1 : currentCount + 1 } };
    });

    try {
      await likePost({ targetId: postId, targetType: "post" }).unwrap();
    } catch {
      setLikeState((prev) => {
        const current = prev[postId];
        return { ...prev, [postId]: { liked: !current.liked, count: current.liked ? current.count - 1 : current.count + 1 } };
      });
    }
  };

  const getPostLikeState = (post) => {
    if (likeState[post._id] !== undefined) {
      return likeState[post._id];
    }
    return { liked: post.isLiked || false, count: post.likesCount || 0 };
  };

  // Check which sections are enabled from API
  const sections = useMemo(() => {
    const map = {};
    sectionContent.forEach((item) => {
      if (item.status && item.publishStatus !== false) {
        map[item.display_type] = item;
      }
    });
    return map;
  }, [sectionContent]);

  const showLibraryPosts = !!sections["library-posts"];
  const showTrendingAstrologers = !!sections["trending-astrologers"];

  const { data, isLoading, isFetching, isError } = useGetCommunityLibraryQuery(
    { tab: "my-posts", page, limit: 10, sort: "newest" },
    { skip: !showLibraryPosts }
  );

  const allPosts = data?.posts || [];
  const posts = allPosts.filter((p) => !deletedIds.includes(p._id));
  const pagination = data?.pagination || {};
  const hasMore = page < (pagination.pages || 1);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId).unwrap();
      setDeletedIds((prev) => [...prev, postId]);
      Toast.success("Post deleted");
    } catch (error) {
      Toast.error(error?.data?.message || "Failed to delete post");
    }
  };

  const handleShare = async (postId) => {
    try {
      const postUrl = `${window.location.origin}/community?tab=posts&post=${postId}`;
      if (navigator.share) {
        await navigator.share({ title: "Check out this post", url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        Toast.success("Link copied to clipboard");
      }
      setShareState((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? posts.find((p) => p._id === postId)?.sharesCount ?? 0) + 1,
      }));
      await sharePost(postId).unwrap();
    } catch (error) {
      if (error?.name !== "AbortError") {
        Toast.error(error?.data?.message || "Failed to share post");
      }
    }
  };

  const lastPostRef = useCallback(
    (node) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetching, hasMore]
  );

  const formatCount = (count) => {
    if (!count) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

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
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMain}>
        {showLibraryPosts && (
          <>
            <h2 className={styles.sectionHeading}>
              <span className={styles.headingBar} />
              {sections["library-posts"]?.display_title?.toUpperCase() || "YOUR LIBRARY"}
            </h2>

            <div className={styles.postsContainer}>
              {isLoading && (
                <div className={styles.emptyState}>
                  <p>Loading your posts...</p>
                </div>
              )}

              {isError && (
                <div className={styles.emptyState}>
                  <p>Something went wrong. Please try again later.</p>
                </div>
              )}

              {!isLoading && !isError && posts.length === 0 && (
                <div className={styles.emptyState}>
                  <p>You haven&apos;t posted anything yet.</p>
                  <p>Share your spiritual thoughts with the community!</p>
                </div>
              )}

              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;
                const authorName = post.authorName || "Unknown";
                const subtitle = post.spaceInfo
                  ? `${post.spaceInfo.icon || ""} ${post.spaceInfo.name || ""} • ${getTimeAgo(post.createdAt)}`
                  : getTimeAgo(post.createdAt);

                return (
                  <article
                    key={post._id}
                    className={styles.postCard}
                    ref={isLast ? lastPostRef : null}
                  >
                    <div className={styles.postHeader}>
                      {post.authorImage ? (
                        <img
                          src={post.authorImage}
                          alt={authorName}
                          className={styles.postAuthorAvatar}
                        />
                      ) : (
                        <div className={styles.postAuthorAvatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                          {authorName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={styles.postAuthorInfo}>
                        <span className={styles.postAuthorName}>
                          {authorName}
                          {post.isVerifiedAuthor && (
                            <span className={styles.verifiedBadge}>✓</span>
                          )}
                        </span>
                        <span className={styles.postSubtitle}>{subtitle}</span>
                      </div>
                      {post.authorType?.toUpperCase() === "ASTROLOGER" && (
                        <button className={styles.bookSessionBtn}>Book Session</button>
                      )}
                    </div>

                    {post.title && (
                      <p className={styles.postContent} style={{ fontWeight: 600, marginBottom: 4 }}>
                        {post.title}
                      </p>
                    )}

                    <p className={styles.postContent}>
                      {post.body}
                      {post.tags && post.tags.length > 0 && (
                        <>
                          {"  "}
                          {post.tags.map((tag, i) => (
                            <span key={i} className={styles.postTag}>#{tag}</span>
                          ))}
                        </>
                      )}
                    </p>

                    {post.images && post.images.length > 0 && (
                      <div className={styles.postImageWrapper}>
                        {post.images.map((img, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt={`Post ${imgIdx + 1}`}
                            className={styles.postImage}
                            loading="lazy"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ))}
                      </div>
                    )}

                    <div className={styles.postActions}>
                      <button className={styles.actionItem} onClick={() => handleLike(post._id)}>
                        <FiHeart
                          size={18}
                          style={getPostLikeState(post).liked ? { fill: "#e65100", color: "#e65100" } : {}}
                        />
                        <span>{formatCount(getPostLikeState(post).count)}</span>
                      </button>
                      <button className={styles.actionItem} onClick={() => toggleComments(post._id)}>
                        <FiMessageCircle size={18} />
                        <span>{formatCount(post.commentsCount)}</span>
                      </button>
                      <button className={styles.actionItem} onClick={() => handleShare(post._id)}>
                        <PiShareNetwork size={18} />
                        <span>{formatCount(shareState[post._id] ?? post.sharesCount)}</span>
                      </button>
                      {currentUser?.id && post.authorId === currentUser.id && (
                        <>
                          <button
                            className={styles.actionItem}
                            onClick={() => navigate(`/community?tab=edit&postId=${post._id}`)}
                            title="Edit post"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            className={styles.actionItem}
                            onClick={() => handleDeletePost(post._id)}
                            title="Delete post"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Comment Section */}
                    {openComments[post._id] && (
                      <CommentSection postId={post._id} />
                    )}
                  </article>
                );
              })}

              {isFetching && !isLoading && (
                <div className={styles.emptyState}>
                  <p>Loading more...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showTrendingAstrologers && (
        <TrendingAstrologers
          title={sections["trending-astrologers"]?.display_title || "Trending Astrologers"}
          btnLabel="Connect"
          astrologers={trendingAstrologers}
        />
      )}
    </div>
  );
};

export default YourPosts;
