import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";
import styles from "../Community.module.scss";
import NewAstrologerCard from "../../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import { useAstrologerConnect } from "../../../../utils/hooks/useAstrologerConnect";
import {
  useJoinCommunitySpaceMutation,
  useLeaveCommunitySpaceMutation,
} from "../../../../redux/api/community/communityApi";
import Toast from "../../../../component/toast";

const formatMemberCount = (count) => {
  if (!count) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const Communities = ({ onCommunityClick, topAstrologers = [], sectionContent = [], spaces = [] }) => {
  const navigate = useNavigate();
  const { handleChatStart, handleCallStart } = useAstrologerConnect();
  const [joinSpace] = useJoinCommunitySpaceMutation();
  const [leaveSpace] = useLeaveCommunitySpaceMutation();

  // Local state to track join status optimistically
  const [joinedMap, setJoinedMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

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

  const showCommunityList = !!sections["communities-list"];
  const showTopAstrologers = !!sections["top-rated-astrologer"];

  const isJoined = (space) => {
    if (joinedMap[space.slug] !== undefined) return joinedMap[space.slug];
    return space.isJoined;
  };

  const handleJoinLeave = async (space, e) => {
    e.stopPropagation();
    if (loadingMap[space.slug]) return;

    setLoadingMap((prev) => ({ ...prev, [space.slug]: true }));

    try {
      if (isJoined(space)) {
        await leaveSpace(space.slug).unwrap();
        setJoinedMap((prev) => ({ ...prev, [space.slug]: false }));
        Toast.success(`Left ${space.name}`);
      } else {
        await joinSpace(space.slug).unwrap();
        setJoinedMap((prev) => ({ ...prev, [space.slug]: true }));
        Toast.success(`Joined ${space.name}`);
      }
    } catch (error) {
      const message = error?.data?.message || "Something went wrong";
      Toast.error(message);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [space.slug]: false }));
    }
  };

  const handleConnect = async (astrologer, type, isEmergency = false) => {
    if (type === "chat") {
      await handleChatStart(astrologer, true, isEmergency);
    } else {
      await handleCallStart(astrologer, type || "audio", isEmergency);
    }
  };

  return (
    <div className={styles.communitiesPage}>
      {/* Communities Grid */}
      {showCommunityList && (
        <>
          <h2 className={styles.sectionHeading}>
            <span className={styles.headingBar} />
            {sections["communities-list"]?.display_title?.toUpperCase() || "COMMUNITIES"}
          </h2>

          <div className={styles.communitiesGrid}>
            {spaces.map((space) => (
              <div
                key={space._id}
                className={styles.communityCard}
                onClick={() => onCommunityClick(space.slug)}
              >
                <div className={styles.communityCardAvatar}>
                  {space.icon && (
                    <span style={{ fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                      {space.icon}
                    </span>
                  )}
                </div>
                <h4 className={styles.communityCardName}>{space.name}</h4>
                <span className={styles.communityCardMembers}>
                  <FiUsers size={13} /> {formatMemberCount(space.memberCount)} members
                </span>
                <button
                  className={`${styles.joinBtn} ${isJoined(space) ? styles.joined : ""}`}
                  disabled={loadingMap[space.slug]}
                  onClick={(e) => handleJoinLeave(space, e)}
                >
                  {isJoined(space) ? (
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
        </>
      )}

      {/* Top Rated Astrologers */}
      {showTopAstrologers && topAstrologers.length > 0 && (
        <div className={styles.topAstrologersSection}>
          <div className={styles.topAstrologersHeader}>
            <h2 className={styles.sectionHeading}>
              <span className={styles.headingBar} />
              {sections["top-rated-astrologer"]?.display_title?.toUpperCase() || "TOP RATED ASTROLOGER FOR YOU"}
            </h2>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate("/chat-to-astrologer")}
            >
              View all &gt;
            </button>
          </div>

          <div className={styles.astrologerSlider}>
            {topAstrologers.map((astrologer) => (
              <NewAstrologerCard
                key={astrologer._id}
                astrologer={astrologer}
                onConnect={handleConnect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
