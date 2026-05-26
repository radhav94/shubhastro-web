import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiUsers, FiFileText, FiPlus, FiChevronLeft } from "react-icons/fi";
import { LuNewspaper } from "react-icons/lu";
import styles from "./Community.module.scss";
import YourFeed from "./components/YourFeed";
import Communities from "./components/Communities";
import YourPosts from "./components/YourPosts";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import CommunityDetail from "./components/CommunityDetail";
import {
  useGetCommunityPageDataQuery,
  useGetCommunitySpacesQuery,
  useGetMyJoinedSpacesQuery,
} from "../../../redux/api/community/communityApi";

const TABS = [
  { id: "feed", label: "Your Feed", icon: LuNewspaper },
  { id: "communities", label: "Communities", icon: FiUsers },
  { id: "posts", label: "Your Posts", icon: FiFileText },
  { id: "create", label: "Create Post", icon: FiPlus },
];

const formatMemberCount = (count) => {
  if (!count) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const Community = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "feed";
  const communityId = searchParams.get("community");
  const editPostId = searchParams.get("postId");

  const { data: pageResponse } = useGetCommunityPageDataQuery();
  const { data: spacesData } = useGetCommunitySpacesQuery({ page: 1, limit: 20 });
  const { data: joinedSpacesData } = useGetMyJoinedSpacesQuery({ page: 1, limit: 50 });

  const spaces = spacesData?.spaces || [];
  const joinedSpaces = joinedSpacesData?.spaces || [];

  // Build sections map from API response (same pattern as Explore page)
  const pageData = useMemo(() => {
    const list = pageResponse?.data?.list || [];
    const sections = {};
    list.forEach((section) => {
      sections[section.display_type] = section;
    });
    return sections;
  }, [pageResponse]);

  // Extract sections by display_type
  const feedSection = pageData["your-feed"];
  const communitiesSection = pageData["communities"];
  const yourPostsSection = pageData["your-posts"];

  // Extract trending astrologers for feed tab
  const feedTrendingAstrologers = useMemo(() => {
    const block = feedSection?.content?.find((item) => item.display_type === "trending-astrologers");
    return block?.content || [];
  }, [feedSection]);

  // Extract trending astrologers for your-posts tab
  const postsTrendingAstrologers = useMemo(() => {
    const block = yourPostsSection?.content?.find((item) => item.display_type === "trending-astrologers");
    return block?.content || [];
  }, [yourPostsSection]);

  // Extract top rated astrologers for communities tab
  const communitiesAstrologers = useMemo(() => {
    const block = communitiesSection?.content?.find((item) => item.display_type === "top-rated-astrologer");
    return block?.content || [];
  }, [communitiesSection]);

  const setActiveTab = useCallback((tab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleCommunityClick = useCallback((slug) => {
    setSearchParams({ tab: "communities", community: slug });
  }, [setSearchParams]);

  const handleBack = useCallback(() => {
    if (communityId) {
      setSearchParams({ tab: "communities" });
    } else {
      navigate("/");
    }
  }, [communityId, navigate, setSearchParams]);

  const renderContent = () => {
    if (communityId) {
      return <CommunityDetail communityId={communityId} astrologers={communitiesAstrologers} />;
    }
    switch (activeTab) {
      case "feed":
        return <YourFeed trendingAstrologers={feedTrendingAstrologers} sectionContent={feedSection?.content} spaces={spaces} joinedSpaces={joinedSpaces} onViewAllCommunities={() => setActiveTab("communities")} onCommunityClick={handleCommunityClick} />;
      case "communities":
        return (
          <Communities
            onCommunityClick={handleCommunityClick}
            topAstrologers={communitiesAstrologers}
            sectionContent={communitiesSection?.content}
            spaces={spaces}
          />
        );
      case "posts":
        return <YourPosts trendingAstrologers={postsTrendingAstrologers} sectionContent={yourPostsSection?.content} />;
      case "create":
        return <CreatePost onSuccess={() => setActiveTab("feed")} />;
      case "edit":
        return <EditPost postId={editPostId} onSuccess={() => setActiveTab("feed")} />;
      default:
        return <YourFeed trendingAstrologers={feedTrendingAstrologers} sectionContent={feedSection?.content} spaces={spaces} joinedSpaces={joinedSpaces} onViewAllCommunities={() => setActiveTab("communities")} onCommunityClick={handleCommunityClick} />;
    }
  };

  return (
    <div className={styles.communityPage}>
      {/* Back + Title */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={handleBack}>
          <FiChevronLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Community</h1>
      </div>

      <div className={styles.pageBody}>
        {/* Mobile Tab Bar */}
        <div className={styles.mobileTabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.mobileTab} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={22} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Other Communities - hidden when on communities tab */}
          {activeTab !== "communities" && joinedSpaces.length > 0 && (
            <div className={styles.otherCommunities}>
              <h3 className={styles.sidebarSectionTitle}>Your Communities</h3>
              <ul className={styles.communityList}>
                {joinedSpaces.map((space) => (
                  <li
                    key={space._id}
                    className={styles.communityListItem}
                    onClick={() => handleCommunityClick(space.slug)}
                  >
                    <div className={styles.communityAvatar}>
                      {space.icon && <span style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>{space.icon}</span>}
                    </div>
                    <div className={styles.communityInfo}>
                      <span className={styles.communityName}>{space.name}</span>
                      <span className={styles.communityMembers}>
                        <FiUsers size={12} /> {formatMemberCount(space.memberCount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Community;
