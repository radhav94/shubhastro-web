import { useState } from "react";
import { FiUsers } from "react-icons/fi";
import styles from "../Community.module.scss";
import NewAstrologerCard from "../../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import defaultAvatar from "../../../../assets/images/community-avatar-1.png";

const COMMUNITIES_GRID = [
  { id: 1, name: "Tarot Circle", members: "45.2k", avatar: null, joined: false },
  { id: 2, name: "Leo Tribe", members: "45.2k", avatar: null, joined: false },
  { id: 3, name: "Leo Tribe", members: "45.2k", avatar: null, joined: true },
  { id: 4, name: "Leo Tribe", members: "45.2k", avatar: null, joined: true },
  { id: 5, name: "Tarot Circle", members: "45.2k", avatar: null, joined: false },
  { id: 6, name: "Tarot Circle", members: "45.2k", avatar: null, joined: false },
  { id: 7, name: "Leo Tribe", members: "45.2k", avatar: null, joined: false },
];

const TOP_ASTROLOGERS = [
  { _id: "1", firstName: "Pt. Ved", lastName: "Sharma", experience: 5, rating: 4.5, isActive: true, chatRate: 17, callRate: 35, profileImgUrl: defaultAvatar, gender: "male" },
  { _id: "2", firstName: "Pt. Ved", lastName: "Sharma", experience: 5, rating: 4.5, isActive: true, chatRate: 17, callRate: 35, profileImgUrl: defaultAvatar, gender: "male" },
  { _id: "3", firstName: "Acharya", lastName: "Lakshmi Kant", experience: 5, rating: 4.5, isActive: false, chatRate: 17, callRate: 35, profileImgUrl: defaultAvatar, gender: "male" },
  { _id: "4", firstName: "Pt. Ved", lastName: "Sharma", experience: 5, rating: 4.5, isActive: false, chatRate: 17, callRate: 35, profileImgUrl: defaultAvatar, gender: "male" },
  { _id: "5", firstName: "Pt. Ved", lastName: "Sharma", experience: 5, rating: 4.5, isActive: false, chatRate: 17, callRate: 35, profileImgUrl: defaultAvatar, gender: "male" },
];

const Communities = ({ onCommunityClick }) => {
  const [communities, setCommunities] = useState(COMMUNITIES_GRID);

  const handleJoin = (id, e) => {
    e.stopPropagation();
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  const handleConnect = () => {
    // placeholder for connect action
  };

  return (
    <div className={styles.communitiesPage}>
      {/* Communities Grid */}
      <h2 className={styles.sectionHeading}>
        <span className={styles.headingBar} />
        COMMUNITIES
      </h2>

      <div className={styles.communitiesGrid}>
        {communities.map((community) => (
          <div
            key={community.id}
            className={styles.communityCard}
            onClick={() => onCommunityClick(community.id)}
          >
            <div className={styles.communityCardAvatar} />
            <h4 className={styles.communityCardName}>{community.name}</h4>
            <span className={styles.communityCardMembers}>
              <FiUsers size={13} /> {community.members} members
            </span>
            <button
              className={`${styles.joinBtn} ${community.joined ? styles.joined : ""}`}
              onClick={(e) => handleJoin(community.id, e)}
            >
              {community.joined ? (
                <>✓ Joined</>
              ) : (
                <>
                  <FiUsers size={13} /> Join
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Top Rated Astrologers */}
      <div className={styles.topAstrologersSection}>
        <div className={styles.topAstrologersHeader}>
          <h2 className={styles.sectionHeading}>
            <span className={styles.headingBar} />
            TOP RATED ASTROLOGER FOR YOU
          </h2>
          <button className={styles.viewAllBtn}>View all &gt;</button>
        </div>

        <div className={styles.astrologerSlider}>
          {TOP_ASTROLOGERS.map((astrologer) => (
            <NewAstrologerCard
              key={astrologer._id}
              astrologer={astrologer}
              onConnect={handleConnect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Communities;
