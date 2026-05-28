import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiUsers, FiFilter, FiTrash2 } from "react-icons/fi";
import { PiShareNetwork } from "react-icons/pi";
import styles from "../Community.module.scss";
import TrendingAstrologers from "./TrendingAstrologers";
import CommentSection from "./CommentSection";
import {
  useGetCommunitySpaceDetailQuery,
  useGetCommunityFeedQuery,
  useLikeCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useShareCommunityPostMutation,
} from "../../../../redux/api/community/communityApi";
import { getUserFromStorage } from "../../../../utils/authStorage";
import Toast from "../../../../component/toast";

const CommunityDetail = ({ communityId, astrologers = [] }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [likeState, setLikeState] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [deletedIds, setDeletedIds] = useState([]);
  const observerRef = useRef(null);
  const [likePost] = useLikeCommunityPostMutation();
  const [deletePost] = useDeleteCommunityPostMutation();
  const [sharePost] = useShareCommunityPostMutation();
  const currentUser = getUserFromStorage();

  const { data: spaceData, isLoading: isSpaceLoading } = useGetCommunitySpaceDetailQuery(communityId, {
    skip: !communityId,
  });

  const { data: feedData, isLoading: isFeedLoading, isFetching, isError: isFeedError } = useGetCommunityFeedQuery(
    { page, limit: 10, slug: communityId, sort: sortOrder },
    { skip: !communityId }
  );

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
      const postUrl = `${window.location.origin}/community?tab=communities&community=${communityId}&post=${postId}`;
      if (navigator.share) {
        await navigator.share({ title: "Check out this post", url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        Toast.success("Link copied to clipboard");
      }
      await sharePost(postId).unwrap();
    } catch (error) {
      if (error?.name !== "AbortError") {
        Toast.error(error?.data?.message || "Failed to share post");
      }
    }
  };

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
            <img src={spaceData.coverImage} alt={spaceData.name} className={styles.communityDetailAvatar} />
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
              <p className={styles.createdBy}>Created By: {spaceData?.createdBy || "ShubhAstro"}</p>
            </div>
          </div>
        </div>

        {/* Recent Posts - only show when there are posts */}
        {!isFeedLoading && !isFeedError && posts.length > 0 && (
          <>
            <div className={styles.recentPostsHeader}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.headingBar} />
                RECENT POSTS
              </h2>
              <div className={styles.filterWrapper}>
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
                      <div className={styles.postImageWrapper}>
                        <img
                          src={post.images[0]}
                          alt="Post"
                          className={styles.postImage}
                          loading="lazy"
                        />
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="18" viewBox="0 0 16 22" fill="none">
                          <path d="M14 6.79H12C11.45 6.79 11 7.24 11 7.79C11 8.34 11.45 8.79 12 8.79H14V19.79H2V8.79H4C4.55 8.79 5 8.34 5 7.79C5 7.24 4.55 6.79 4 6.79H2C0.9 6.79 0 7.69 0 8.79V19.79C0 20.89 0.9 21.79 2 21.79H14C15.1 21.79 16 20.89 16 19.79V8.79C16 7.69 15.1 6.79 14 6.79Z" fill="url(#paint0_linear_15525_28218)"/>
                          <path d="M8 14.79C8.55 14.79 9 14.34 9 13.79V3.79H10.79C11.24 3.79 11.46 3.25 11.14 2.94L8.35 0.15C8.15 -0.05 7.84 -0.05 7.64 0.15L4.85 2.94C4.54 3.25 4.76 3.79 5.21 3.79H7V13.79C7 14.34 7.45 14.79 8 14.79Z" fill="url(#paint1_linear_15525_28218)"/>
                          <defs>
                            <linearGradient id="paint0_linear_15525_28218" x1="0" y1="10.895" x2="16" y2="10.895" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#F75801"/>
                              <stop offset="1" stop-color="#D43400"/>
                            </linearGradient>
                            <linearGradient id="paint1_linear_15525_28218" x1="0" y1="10.895" x2="16" y2="10.895" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#F75801"/>
                              <stop offset="1" stop-color="#D43400"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        <span>{formatCount(post.sharesCount)}</span>
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
    </div>
  );
};

export default CommunityDetail;
