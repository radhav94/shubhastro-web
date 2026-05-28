import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiUsers, FiTrash2, FiEdit2 } from "react-icons/fi";
import styles from "../Community.module.scss";
import TrendingAstrologers from "./TrendingAstrologers";
import CommentSection from "./CommentSection";
import { useGetCommunityFeedQuery, useLikeCommunityPostMutation, useDeleteCommunityPostMutation, useShareCommunityPostMutation } from "../../../../redux/api/community/communityApi";
import { getUserFromStorage } from "../../../../utils/authStorage";
import Toast from "../../../../component/toast";

const YourFeed = ({ trendingAstrologers = [], sectionContent = [], joinedSpaces = [], onCommunityClick }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [likeState, setLikeState] = useState({});
  const [shareState, setShareState] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [deletedIds, setDeletedIds] = useState([]);
  const observerRef = useRef(null);
  const [likePost] = useLikeCommunityPostMutation();
  const [deletePost] = useDeleteCommunityPostMutation();
  const [sharePost] = useShareCommunityPostMutation();
  const currentUser = getUserFromStorage();

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

  const showCreatePost = !!sections["create-post"];
  const showTrendingPosts = !!sections["trending-posts"];
  const showTrendingAstrologers = !!sections["trending-astrologers"];
  const showYourCommunity = !!sections["your-community"];

  const { data, isLoading, isFetching, isError } = useGetCommunityFeedQuery(
    { page, limit: 10, sort: "newest" },
    { skip: !showTrendingPosts }
  );

  const posts = (data?.posts || []).filter((p) => !deletedIds.includes(p._id));
  const pagination = data?.pagination || {};
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
    // Optimistic update
    setLikeState((prev) => {
      const current = prev[postId];
      if (current !== undefined) {
        return { ...prev, [postId]: { liked: !current.liked, count: current.liked ? current.count - 1 : current.count + 1 } };
      }
      // First toggle — find the post to get current state
      const post = posts.find((p) => p._id === postId);
      const wasLiked = post?.isLiked || false;
      const currentCount = post?.likesCount || 0;
      return { ...prev, [postId]: { liked: !wasLiked, count: wasLiked ? currentCount - 1 : currentCount + 1 } };
    });

    try {
      await likePost({ targetId: postId, targetType: "post" }).unwrap();
    } catch {
      // Revert on error
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
    setOpenComments((prev) => {
      if (prev[postId]) return {};
      return { [postId]: true };
    });
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

  const getPostUrl = (postId) => `${window.location.origin}/community?tab=feed&post=${postId}`;

  const handleShare = async (e, platform, postId) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getPostUrl(postId);
    switch (platform) {
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setCopiedId(postId);
        setTimeout(() => setCopiedId(null), 2000);
        break;
      default:
        return;
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

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMain}>
        {/* Create Post Input */}
        {showCreatePost && (
          <div className={styles.postInputCard} onClick={() => navigate("/community?tab=create")} style={{ cursor: "pointer" }}>
            {currentUser?.image ? (
              <img src={currentUser.image} alt="Profile" className={styles.postInputAvatar} />
            ) : (
              <div className={styles.postInputAvatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                {currentUser?.firstName
                  ? (currentUser.firstName[0] + (currentUser.lastName?.[0] || currentUser.firstName[1] || "")).toUpperCase()
                  : "U"}
              </div>
            )}
            <input
              type="text"
              placeholder="Share your spiritual thoughts..."
              readOnly
              className={styles.postInput}
            />
            <button className={styles.postBtn}>Post</button>
          </div>
        )}

        {/* Your Community - Mobile Only */}
        {showYourCommunity && joinedSpaces.length > 0 && (
          <div className={styles.yourCommunitySection}>
            <h2 className={styles.sectionHeading}>
              <span className={styles.headingBar} />
              {sections["your-community"]?.display_title?.toUpperCase() || "YOUR COMMUNITY"}
            </h2>
            <p className={styles.yourCommunityDesc}>
              {sections["your-community"]?.description || "All Communities will appear here"}
            </p>
            <div className={styles.yourCommunityScroller}>
              {joinedSpaces.map((space) => (
                <div key={space._id} className={styles.yourCommunityCard} onClick={() => onCommunityClick?.(space.slug)}>
                  <div className={styles.yourCommunityAvatar}>
                    {space.icon && (
                      <span style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                        {space.icon}
                      </span>
                    )}
                  </div>
                  <div className={styles.yourCommunityInfo}>
                    <span className={styles.yourCommunityName}>{space.name}</span>
                    <span className={styles.yourCommunityMembers}>
                      <FiUsers size={12} /> {space.memberCount >= 1000 ? `${(space.memberCount / 1000).toFixed(1)}k` : space.memberCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Posts */}
        {showTrendingPosts && (
          <>
            <h2 className={styles.sectionHeading}>
              <span className={styles.headingBar} />
              {sections["trending-posts"]?.display_title?.toUpperCase() || "TRENDING POSTS"}
            </h2>

            <div className={styles.postsContainer}>
              {isLoading && (
                <div className={styles.emptyState}>
                  <p>Loading feed...</p>
                </div>
              )}

              {isError && (
                <div className={styles.emptyState}>
                  <p>Something went wrong. Please try again later.</p>
                </div>
              )}

              {!isLoading && !isError && posts.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No posts yet.</p>
                  <p>Join communities to see posts in your feed.</p>
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
                      <div className={styles.shareBtnMain} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <button className={styles.shareBtn} aria-label="Share post">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 20" fill="none">
                            <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                          </svg>
                        </button>
                        <span className={styles.shareCount}>{formatCount(shareState[post._id] ?? post.sharesCount)}</span>
                        <div className={styles.shareIconSocial}>
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "whatsapp", post._id)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                          </span>
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "facebook", post._id)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                          </span>
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "copy", post._id)}>
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            {copiedId === post._id && <span className={styles.copiedText}>Copied!</span>}
                          </span>
                        </div>
                      </div>
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

      {/* Right Sidebar - Trending Astrologers */}
      {showTrendingAstrologers && (
        <TrendingAstrologers astrologers={trendingAstrologers} />
      )}
    </div>
  );
};

export default YourFeed;
