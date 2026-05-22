import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiUsers, FiFileText, FiPlus, FiChevronLeft } from "react-icons/fi";
import { LuNewspaper } from "react-icons/lu";
import styles from "./Community.module.scss";
import YourFeed from "./components/YourFeed";
import Communities from "./components/Communities";
import YourPosts from "./components/YourPosts";
import CreatePost from "./components/CreatePost";
import CommunityDetail from "./components/CommunityDetail";

const TABS = [
  { id: "feed", label: "Your Feed", icon: LuNewspaper },
  { id: "communities", label: "Communities", icon: FiUsers },
  { id: "posts", label: "Your Posts", icon: FiFileText },
  { id: "create", label: "Create Post", icon: FiPlus },
];

const COMMUNITIES_DATA = [
  { id: 1, name: "Gemini Tribe", members: "45.2k", avatar: null, joined: false },
  { id: 2, name: "Leo Tribe", members: "45.2k", avatar: null, joined: true },
  { id: 3, name: "Libra Tribe", members: "45.2k", avatar: null, joined: false },
  { id: 4, name: "Tarot Circle", members: "45.2k", avatar: null, joined: false },
  { id: 5, name: "Aries Tribe", members: "45.2k", avatar: null, joined: true },
];

const Community = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "feed";
  const communityId = searchParams.get("community");

  const setActiveTab = useCallback((tab) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleCommunityClick = useCallback((id) => {
    setSearchParams({ tab: "communities", community: id });
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
      return <CommunityDetail communityId={communityId} />;
    }
    switch (activeTab) {
      case "feed":
        return <YourFeed />;
      case "communities":
        return <Communities onCommunityClick={handleCommunityClick} />;
      case "posts":
        return <YourPosts />;
      case "create":
        return <CreatePost onSuccess={() => setActiveTab("feed")} />;
      default:
        return <YourFeed />;
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

          {/* Other Communities */}
          <div className={styles.otherCommunities}>
            <h3 className={styles.sidebarSectionTitle}>Other Communities</h3>
            <ul className={styles.communityList}>
              {COMMUNITIES_DATA.slice(0, 3).map((community) => (
                <li
                  key={community.id}
                  className={styles.communityListItem}
                  onClick={() => handleCommunityClick(community.id)}
                >
                  <div className={styles.communityAvatar} />
                  <div className={styles.communityInfo}>
                    <span className={styles.communityName}>{community.name}</span>
                    <span className={styles.communityMembers}>
                      <FiUsers size={12} /> {community.members}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <button className={styles.viewAllBtn}>View all &gt;</button>
          </div>
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
