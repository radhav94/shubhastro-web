import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiUsers, FiFilter, FiTrash2 } from "react-icons/fi";
import styles from "../Community.module.scss";
import { trackEvent } from "../../../../utils/analytics";
import TrendingAstrologers from "./TrendingAstrologers";
import CommentSection from "./CommentSection";
import {
  useGetCommunitySpaceDetailQuery,
  useGetCommunityFeedQuery,
  useLikeCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useShareCommunityPostMutation,
  useJoinCommunitySpaceMutation,
  useLeaveCommunitySpaceMutation,
} from "../../../../redux/api/community/communityApi";
import { getUserFromStorage } from "../../../../utils/authStorage";
import Toast from "../../../../component/toast";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import PostImageSlider from "./PostImageSlider";
import { DeleteConfirmationModal } from "../../../../component";

const CommunityDetail = ({ communityId, astrologers = [] }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [likeState, setLikeState] = useState({});
  const [shareState, setShareState] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [deletedIds, setDeletedIds] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const observerRef = useRef(null);
  const [likePost] = useLikeCommunityPostMutation();
  const [deletePost] = useDeleteCommunityPostMutation();
  const [sharePost] = useShareCommunityPostMutation();
  const [joinSpace, { isLoading: isJoining }] = useJoinCommunitySpaceMutation();
  const [leaveSpace, { isLoading: isLeaving }] = useLeaveCommunitySpaceMutation();
  const [hasJoined, setHasJoined] = useState(null);
  const currentUser = getUserFromStorage();
  const filterRef = useRef(null);

  const { data: spaceData, isLoading: isSpaceLoading } = useGetCommunitySpaceDetailQuery(communityId, {
    skip: !communityId,
  });

  const { data: feedData, isLoading: isFeedLoading, isFetching, isError: isFeedError } = useGetCommunityFeedQuery(
    { page, limit: 10, slug: communityId, sort: sortOrder },
    { skip: !communityId || !hasJoined }
  );

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortDropdown]);

  // Sync joined state from API
  useEffect(() => {
    if (spaceData) {
      setHasJoined(spaceData.isJoined || false);
    }
  }, [spaceData]);

  const handleJoinLeave = async () => {
    try {
      if (hasJoined) {
        await leaveSpace(communityId).unwrap();
        setHasJoined(false);
        Toast.success("Left community");
      } else {
        await joinSpace(communityId).unwrap();
        setHasJoined(true);
        setPage(1);
        Toast.success("Joined community");
      }
    } catch (error) {
      Toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const allPosts = feedData?.posts || [];
  const posts = allPosts.filter((p) => !deletedIds.includes(p._id));
  const pagination = feedData?.pagination || {};
  const hasMore = page < (pagination.pages || 1);

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
      trackEvent("community_post_reacted", { post_id: postId, reaction_type: "like" });
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

  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDeletePost = (postId) => {
    setDeletePostId(postId);
    setDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    setIsDeleting(true);
    try {
      await deletePost(deletePostId).unwrap();
      setDeletedIds((prev) => [...prev, deletePostId]);
      Toast.success("Post deleted");
    } catch (error) {
      Toast.error(error?.data?.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeletePostId(null);
    }
  };

  const getPostUrl = (postId) => `${window.location.origin}/community?tab=communities&community=${communityId}&post=${postId}`;

  const handleShare = async (postId) => {
    const url = getPostUrl(postId);
    const post = posts.find((p) => p._id === postId);
    const title = post?.title || "Check out this post";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    } else {
      navigator.clipboard.writeText(url);
      Toast.success("Link copied to clipboard");
    }

    // Optimistic update
    setShareState((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? posts.find((p) => p._id === postId)?.sharesCount ?? 0) + 1,
    }));
    try {
      await sharePost(postId).unwrap();
    } catch (error) {
      if (error?.name !== "AbortError") {
        Toast.error(error?.data?.message || "Failed to share post");
      }
    }
  };

  if (isSpaceLoading) {
    return <PrimaryLoader isLoading={true} fullscreen={false} message="Loading community..." />;
  }

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMain}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span>Home</span> / <span>Community</span> / <span>{spaceData?.name || communityId}</span>
        </div>

        {/* Community Header Card */}
        <div className={styles.communityDetailHeader}>
          {spaceData?.coverImage ? (
            <img src={spaceData.coverImage} alt={spaceData.name} className={styles.communityDetailAvatar} onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className={styles.communityDetailAvatar}>
              {spaceData?.icon && (
                <span style={{ fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                  {spaceData.icon}
                </span>
              )}
            </div>
          )}
          <div className={styles.communityDetailInfo}>
            <h2 className={styles.communityDetailName}>
              {isSpaceLoading ? "Loading..." : spaceData?.name || communityId}
            </h2>
            <span className={styles.communityDetailMembers}>
              <FiUsers size={14} /> {formatCount(spaceData?.memberCount)} members
            </span>
            <div className={styles.communityDetailAbout}>
              <h4>About The Tribe</h4>
              <p>{spaceData?.description || ""}</p>
              {spaceData?.metadata?.dateRange && (
                <p>{spaceData.metadata.dateRange} • {spaceData.metadata.element} • {spaceData.metadata.rulingPlanet}</p>
              )}
              <p className={styles.createdBy}>Created By : <strong>{spaceData?.createdBy || "ShubhAstro"}</strong></p>
            </div>
          </div>
          {hasJoined === false && (
            <button
              className={styles.joinCommunityBtn}
              onClick={handleJoinLeave}
              disabled={isJoining || isLeaving}
            >
              <FiUsers size={18} />
              {isJoining ? "Joining..." : "Join"}
            </button>
          )}
        </div>

        {/* Join message when not a member */}
        {hasJoined === false && (
          <div className={styles.joinMessage}>
            <p>Join the tribe to unlock posts, discussions, and community updates.</p>
          </div>
        )}

        {/* Empty state when joined but no posts */}
        {hasJoined && !isFeedLoading && !isFetching && !isFeedError && posts.length === 0 && (
          <div className={styles.joinMessage}>
            <p>No posts yet. Be the first to share and start the conversation with the community.</p>
          </div>
        )}

        {/* Recent Posts - only show when there are posts */}
        {!isFeedLoading && !isFeedError && posts.length > 0 && (
          <>
            <div className={styles.recentPostsHeader}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.headingBar} />
                RECENT POSTS
              </h2>
              <div className={styles.filterWrapper} ref={filterRef}>
                <button
                  className={styles.filterBtn}
                  onClick={() => setShowSortDropdown((prev) => !prev)}
                >
                  <FiFilter size={14} /> Filter
                </button>
                {showSortDropdown && (
                  <div className={styles.filterDropdown}>
                    {["newest", "oldest", "trending"].map((option) => (
                      <button
                        key={option}
                        className={`${styles.filterOption} ${sortOrder === option ? styles.active : ""}`}
                        onClick={() => {
                          setSortOrder(option);
                          setPage(1);
                          setShowSortDropdown(false);
                        }}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.postsContainer}>
              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;
                const authorName = post.isAnonymous ? "Anonymous" : (post.authorName || "Unknown");
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
                          {authorName.slice(0, 1).toUpperCase()}
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
                        <button
                          className={styles.bookSessionBtn}
                          onClick={() => navigate(`/astrologer/${post.authorId}`)}
                        >
                          Book Session
                        </button>
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
                      <PostImageSlider images={post.images} />
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D43400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                          <polyline points="16 6 12 2 8 6"/>
                          <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                        <span>{formatCount(shareState[post._id] ?? post.sharesCount)}</span>
                      </button>
                      {currentUser?.id && post.authorId === currentUser.id && (
                        <button
                          className={styles.actionItem}
                          onClick={() => handleDeletePost(post._id)}
                          title="Delete post"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>

                    {/* Comment Section */}
                    {openComments[post._id] && (
                      <CommentSection postId={post._id} />
                    )}
                  </article>
                );
              })}

              {isFetching && !isFeedLoading && (
                <div className={styles.emptyState}>
                  <p>Loading more...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar - Consult Astrologers */}
      <div className={styles.detailSidebarWrapper}>
        <TrendingAstrologers title="Consult Astrologers" btnLabel="Connect" astrologers={astrologers} />
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDeletePost}
        onClose={() => { setDeleteModalOpen(false); setDeletePostId(null); }}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CommunityDetail;
