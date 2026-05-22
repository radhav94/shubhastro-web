import { useState } from "react";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { LuShare2 } from "react-icons/lu";
import { PiShareNetwork } from "react-icons/pi";
import styles from "../Community.module.scss";
import TrendingAstrologers from "./TrendingAstrologers";
import astrologerImg from "../../../../assets/default-img/astrologer male_v.1.png";

const MOCK_POSTS = [
  {
    id: 1,
    author: "Leo Tribe",
    subtitle: "Lorem Ipsum",
    avatar: null,
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off. Expect steady progress in financial planning.    #Astrology #MercuryTransit",
    image: null,
    likes: 200,
    comments: 45,
  },
  {
    id: 2,
    author: "Pandit Ravi Dar",
    subtitle: "Tarot Reader • 2h ago",
    avatar: null,
    isVerified: true,
    showBookSession: true,
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off. Expect steady progress in financial planning. ✨ #Astrology #MercuryTransit",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
    likes: 200,
    comments: 45,
  },
  {
    id: 3,
    author: "Leo Tribe",
    subtitle: "Lorem Ipsum",
    avatar: null,
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off. Expect steady progress in financial planning.    #Astrology #MercuryTransit",
    image: null,
    likes: 200,
    comments: 45,
  },
  {
    id: 4,
    author: "Leo Tribe",
    subtitle: "Lorem Ipsum",
    avatar: null,
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off. Expect steady progress in financial planning.    #Astrology #MercuryTransit",
    image: null,
    likes: 200,
    comments: 45,
  },
];

const YourFeed = () => {
  const [postText, setPostText] = useState("");

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMain}>
        {/* Post Input */}
        <div className={styles.postInputCard}>
          <img src={astrologerImg} alt="Profile" className={styles.postInputAvatar} />
          <input
            type="text"
            placeholder="Share your spiritual thoughts..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className={styles.postInput}
          />
          <button className={styles.postBtn}>Post</button>
        </div>

        {/* Trending Posts */}
        <h2 className={styles.sectionHeading}>
          <span className={styles.headingBar} />
          TRENDING POSTS
        </h2>

        <div className={styles.postsContainer}>
          {MOCK_POSTS.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <img src={astrologerImg} alt={post.author} className={styles.postAuthorAvatar} />
                <div className={styles.postAuthorInfo}>
                  <span className={styles.postAuthorName}>
                    {post.author}
                    {post.isVerified && <span className={styles.verifiedBadge}>✓</span>}
                  </span>
                  <span className={styles.postSubtitle}>{post.subtitle}</span>
                </div>
                {post.showBookSession && (
                  <button className={styles.bookSessionBtn}>Book Session</button>
                )}
              </div>

              <p className={styles.postContent}>{post.content}</p>

              {post.image && (
                <div className={styles.postImageWrapper}>
                  <img src={post.image} alt="Post" className={styles.postImage} loading="lazy" />
                </div>
              )}

              <div className={styles.postActions}>
                <button className={styles.actionItem}>
                  <FiHeart size={18} />
                  <span>{post.likes}</span>
                </button>
                <button className={styles.actionItem}>
                  <FiMessageCircle size={18} />
                  <span>{post.comments}</span>
                </button>
                <button className={styles.actionItem}>
                  <PiShareNetwork size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Trending Astrologers */}
      <TrendingAstrologers />
    </div>
  );
};

export default YourFeed;
