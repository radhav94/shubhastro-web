// Section component mapper for dynamic rendering based on display_type
import HoroscopeCard from "../components/HoroscopeCard";
import ConsultationCarousel from "../components/ConsultationCarousel";
import QuickActions from "../components/QuickActions";
import PanditAISection from "../components/PanditAISection";
import AstrologersSection from "../components/AstrologersSection";
import LifeAreaSection from "../components/LifeAreaSection";
import MySessionsSection from "../components/MySessionsSection";
import CosmicInsightSection from "../components/CosmicInsightSection";
import PanchangSection from "../components/PanchangSection";
import DiscoverMoreSection from "../components/DiscoverMoreSection";
import BlogsSection from "../components/BlogsSection";
import NewsSection from "../components/NewsSection";
import AstrologersByCategorySection from "../components/AstrologersByCategorySection";
import ConnectAgainSection from "../components/ConnectAgainSection";
import VimshottariTimelineSection from "../components/VimshottariTimelineSection";
import BirthPanchangSection from "../components/BirthPanchangSection";
import MuhuratSection from "../components/MuhuratSection";
import PlanEventsBanner from "../components/agenticCalendarSection";

/**
 * Maps display_type to corresponding React component
 * @param {string} displayType - The display_type from API response
 * @param {object} sectionData - The section data from API
 * @param {object} handlers - Event handlers (onConnect, onChatStart, etc.)
 * @returns {JSX.Element|null} - The corresponding component or null
 */
export const renderSection = (displayType, sectionData, handlers = {}, keyPrefix = "") => {
  const { onConnect, onChatStart } = handlers;
  const key = `${keyPrefix}${displayType}-${sectionData._id || sectionData.list_order || displayType}`;

  switch (displayType) {
    case "todays-horoscope":
      return <HoroscopeCard key={key} data={sectionData} />;

    case "consult-to-expert-astrologer":
      return (
        <ConsultationCarousel
          key={key}
          data={sectionData.content || []}
          title={sectionData.display_title}
        />
      );

    case "complementary-services":
      return (
        <QuickActions
          key={key}
          data={sectionData.content || []}
          title={sectionData.display_title}
        />
      );

    case "pandit-ai":
      return (
        <PanditAISection
          key={key}
          data={sectionData.content?.[0]}
          astrologerId={sectionData.content?.[0]?.astrologer_id}
          onChatStart={onChatStart}
        />
      );

    case "our-astrologers":
      return (
        <AstrologersSection
          key={key}
          title={sectionData.display_title || "TALK TO AN ASTROLOGER"}
          astrologers={sectionData.content || []}
          onConnect={onConnect}
          showMore={sectionData.show_more}
        />
      );

    case "astrologer-grid":
      return (
        <AstrologersSection
          key={key}
          title={sectionData.display_title || "TOP RATED ASTROLOGERS FOR YOU"}
          astrologers={sectionData.content || []}
          onConnect={onConnect}
          showMore={sectionData.show_more}
        />
      );

    case "astrologers-by-category":
      return (
        <AstrologersByCategorySection
          key={key}
          data={sectionData.content || []}
          title={sectionData.display_title}
          showMore={sectionData.show_more}
        />
      );

    case "my-sessions":
      return (
        <MySessionsSection key={key} onConnectClick={onConnect} />
      );

    case "daily-cosmic-insight":
      return <CosmicInsightSection key={key} data={sectionData} />;

    case "explore-panchang":
      return (
        <PanchangSection
          key={key}
          title={sectionData.display_title}
        />
      );

    case "connect-again":
      return (
        <ConnectAgainSection
          key={key}
          title={sectionData.display_title}
          onConnect={onConnect}
        />
      );

    case "discover-more":
      return (
        <DiscoverMoreSection
          key={key}
          data={sectionData.content || []}
          title={sectionData.display_title}
          showMore={sectionData.show_more}
        />
      );

    case "blog":
      return (
        <BlogsSection
          key={key}
          blogData={sectionData.content || []}
          title={sectionData.display_title}
          showMore={sectionData.show_more}
        />
      );

    case "news":
      return (
        <NewsSection
          key={key}
          newsData={sectionData.content || []}
          title={sectionData.display_title}
          showMore={sectionData.show_more}
        />
      );

    case "vimshottari-timeline":
      return(
        <VimshottariTimelineSection key={key} />
      );

    case "birth-panchang":
      return (
        <BirthPanchangSection key={key} />
      );

    case "muharat-widget":
      return (
        <MuhuratSection key={key} />
      );

    case "ai-agentic":
      return (
        <PlanEventsBanner key={key} />
      );

    default:
      console.warn(`Unknown display_type: ${displayType}`);
      return null;
  }
};

/**
 * Sorts sections by list_order
 * @param {Array} sections - Array of section objects
 * @returns {Array} - Sorted array
 */
export const sortSectionsByOrder = (sections) => {
  if (!Array.isArray(sections)) return [];
  return [...sections].sort(
    (a, b) => (a.list_order || 0) - (b.list_order || 0),
  );
};
