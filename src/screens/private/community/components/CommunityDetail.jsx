import { FiHeart, FiMessageCircle, FiUsers, FiFilter } from "react-icons/fi";
import { PiShareNetwork } from "react-icons/pi";
import styles from "../Community.module.scss";
import TrendingAstrologers from "./TrendingAstrologers";
import astrologerImg from "../../../../assets/default-img/astrologer male_v.1.png";

const COMMUNITY_INFO = {
  1: { name: "Gemini Tribe", members: "45.2k", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy", createdBy: "ShubhAstro" },
  2: { name: "Leo Tribe", members: "45.2k", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy", createdBy: "ShubhAstro" },
  3: { name: "Libra Tribe", members: "45.2k", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy", createdBy: "ShubhAstro" },
  4: { name: "Tarot Circle", members: "45.2k", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy", createdBy: "ShubhAstro" },
  5: { name: "Aries Tribe", members: "45.2k", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy", createdBy: "ShubhAstro" },
};

const COMMUNITY_POSTS = [
  {
    id: 1,
    author: "Leo Tribe",
    subtitle: "Lorem Ipsum",
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
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off.    #Astrology #MercuryTransit",
    image: null,
    likes: 200,
    comments: 45,
  },
  {
    id: 4,
    author: "Leo Tribe",
    subtitle: "Lorem Ipsum",
    content:
      "Mercury enters Taurus today, bringing a grounded energy to our communications. It's the perfect time to finalize contracts or have those deep, meaningful conversations you've been putting off.    #Astrology #MercuryTransit",
    image: null,
    likes: 200,
    comments: 45,
  },
];

const CommunityDetail = ({ communityId }) => {
  const info = COMMUNITY_INFO[communityId] || COMMUNITY_INFO[2];

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMain}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span>Home</span> / <span>Community</span> / <span>{info.name}</span>
        </div>

        {/* Community Header Card */}
        <div className={styles.communityDetailHeader}>
          <div className={styles.communityDetailAvatar} />
          <div className={styles.communityDetailInfo}>
            <h2 className={styles.communityDetailName}>{info.name}</h2>
            <span className={styles.communityDetailMembers}>
              <FiUsers size={14} /> {info.members} members
            </span>
            <div className={styles.communityDetailAbout}>
              <h4>About The Tribe</h4>
              <p>{info.description}</p>
              <p className={styles.createdBy}>Created By: {info.createdBy}</p>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className={styles.recentPostsHeader}>
          <h2 className={styles.sectionHeading}>
            <span className={styles.headingBar} />
            RECENT POSTS
          </h2>
          <button className={styles.filterBtn}>
            <FiFilter size={14} /> Filter
          </button>
        </div>

        <div className={styles.postsContainer}>
          {COMMUNITY_POSTS.map((post) => (
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

      {/* Right Sidebar - Consult Astrologers */}
      <div className={styles.detailSidebarWrapper}>
        <TrendingAstrologers title="Consult Astrologers" btnLabel="Connect" />
      </div>
    </div>
  );
};

export default CommunityDetail;
