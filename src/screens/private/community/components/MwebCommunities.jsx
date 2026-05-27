import { FiUsers } from "react-icons/fi";
import styles from "../Community.module.scss";

const MwebCommunities = ({ joinedSpaces = [], onCommunityClick }) => {
  if (!joinedSpaces.length) return null;

  return (
    <div className={styles.yourCommunitySection}>
      <h2 className={styles.sectionHeading}>
        <span className={styles.headingBar} />
        YOUR COMMUNITY
      </h2>
      <p className={styles.yourCommunityDesc}>
        All Communities will appear here
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
  );
};

export default MwebCommunities;
