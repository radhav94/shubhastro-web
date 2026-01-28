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

/**
 * Maps display_type to corresponding React component
 * @param {string} displayType - The display_type from API response
 * @param {object} sectionData - The section data from API
 * @param {object} handlers - Event handlers (onConnect, etc.)
 * @returns {JSX.Element|null} - The corresponding component or null
 */
export const renderSection = (displayType, sectionData, handlers = {}) => {
    const { onConnect } = handlers;

    switch (displayType) {
        case "todays-horoscope":
            return <HoroscopeCard key={sectionData._id} data={sectionData} />;

        case "consult-to-expert-astrologer":
            return (
                <ConsultationCarousel
                    key={sectionData._id}
                    data={sectionData.content || []}
                    title={sectionData.display_title}
                />
            );

        case "complementary-services":
            return (
                <QuickActions
                    key={sectionData._id}
                    data={sectionData.content || []}
                    title={sectionData.display_title}
                />
            );

        case "pandit-ai":
            return (
                <PanditAISection
                    key={sectionData._id}
                    data={sectionData.content?.[0]}
                    title={sectionData.display_title}
                />
            );

        case "our-astrologers":
            return (
                <AstrologersSection
                    key={sectionData._id}
                    title={sectionData.display_title || "TALK TO AN ASTROLOGER"}
                    astrologers={sectionData.content || []}
                    onConnect={onConnect}
                    showMore={sectionData.show_more}
                />
            );

        case "astrologer-grid":
            return (
                <AstrologersSection
                    key={sectionData._id}
                    title={sectionData.display_title || "TOP RATED ASTROLOGERS FOR YOU"}
                    astrologers={sectionData.content || []}
                    onConnect={onConnect}
                    showMore={sectionData.show_more}
                />
            );

        case "astrologers-by-category":
            return (
                <AstrologersByCategorySection
                    key={sectionData._id}
                    data={sectionData.content || []}
                    title={sectionData.display_title}
                    showMore={sectionData.show_more}
                />
            );

        case "my-sessions":
            return (
                <MySessionsSection
                    key={sectionData._id}
                    onConnectClick={onConnect}
                />
            );

        case "daily-cosmic-insight":
            return (
                <CosmicInsightSection
                    key={sectionData._id}
                    data={sectionData}
                />
            );

        case "explore-panchang":
            return (
                <PanchangSection
                    key={sectionData._id}
                    title={sectionData.display_title}
                />
            );

        case "connect-again":
            return (
                <ConnectAgainSection
                    key={sectionData._id}
                    title={sectionData.display_title}
                    onConnect={onConnect}
                />
            );

        case "discover-more":
            return (
                <DiscoverMoreSection
                    key={sectionData._id}
                    data={sectionData.content || []}
                    title={sectionData.display_title}
                    showMore={sectionData.show_more}
                />
            );

        case "blog":
            return (
                <BlogsSection
                    key={sectionData._id}
                    blogData={sectionData.content || []}
                    title={sectionData.display_title}
                    showMore={sectionData.show_more}
                />
            );

        case "news":
            return (
                <NewsSection
                    key={sectionData._id}
                    newsData={sectionData.content || []}
                    title={sectionData.display_title}
                    showMore={sectionData.show_more}
                />
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
    return [...sections].sort((a, b) => (a.list_order || 0) - (b.list_order || 0));
};
