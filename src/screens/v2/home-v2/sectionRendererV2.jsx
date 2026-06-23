import { lazy, Suspense } from "react";
import {
  QuickLinkSection,
  AstrologerGridSection,
  BlogSectionV2,
  LiveTrackingSection,
  ConnectAstrologerSection,
} from "./sections";

const MySessionsSection = lazy(() => import("./MySessionsSection"));

// ─── Layout Family Definitions ────────────────────────────────────────────────

/**
 * Layout families define which display_types can be grouped together
 * into a composite layout wrapper when they appear consecutively.
 */
export const HERO_LAYOUT_TYPES = new Set([
  "complementary-services",
  "ai-powered-astrology",
  "muharat-widget",
  "ai-services",
]);

export const THREE_COL_LAYOUT_TYPES = new Set([
  "astrologers-by-category",
  "ai-agentic",
  "discover-more",
  "live-widget"
]);

// Types that are always skipped (rendered elsewhere)
const SKIP_TYPES = new Set(["pandit-ai"]);

/**
 * Display types that don't require content to render.
 * These sections have their own data fetching or are self-contained widgets.
 */
const CONTENT_NOT_REQUIRED = new Set([
  "ai-powered-astrology",
  "muharat-widget",
  "ai-agentic",
  "my-sessions",
  "connect-astrologer",
  "live-tracking",
]);

/**
 * Checks if a section should be rendered.
 * Returns false if the section requires content but has none.
 */
const shouldRenderSection = (section) => {
  if (!section || !section.display_type) return false;
  if (section.status === false) return false;
  if (CONTENT_NOT_REQUIRED.has(section.display_type)) return true;
  return section.content && section.content.length > 0;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Sorts an array by `list_order` field. Returns new array.
 */
export const sortByListOrder = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return [...list].sort((a, b) => (a.list_order || 0) - (b.list_order || 0));
};

export const sortSections = sortByListOrder;
export const sortContentByOrder = sortByListOrder;

// ─── Sequence-Aware Grouping ──────────────────────────────────────────────────

/**
 * Determines which layout family a display_type belongs to.
 * Returns: "hero" | "three-col" | "standalone" | "skip"
 */
const getLayoutFamily = (displayType) => {
  if (!displayType) return "skip";
  if (SKIP_TYPES.has(displayType)) return "skip";
  if (HERO_LAYOUT_TYPES.has(displayType)) return "hero";
  if (THREE_COL_LAYOUT_TYPES.has(displayType)) return "three-col";
  return "standalone";
};

/**
 * Builds an ordered render plan from sorted sections.
 * 
 * Walks through sections sequentially. When consecutive sections belong
 * to the same layout family, they are grouped into a single render block
 * ONLY if the group contains at least the minimum required members for
 * the composite layout to make sense.
 * 
 * For hero layout: requires at least complementary-services AND ai-powered-astrology
 * For three-col layout: requires at least 2 of the 3 types
 * 
 * Otherwise sections render standalone at their list_order position.
 */
export const buildRenderPlan = (sortedSections) => {
  if (!sortedSections?.length) return [];

  const plan = [];
  let currentGroup = null;

  const flushGroup = () => {
    if (!currentGroup) return;

    const { type, sections } = currentGroup;
    const isValidGroup = validateGroup(type, sections);

    if (isValidGroup) {
      plan.push(currentGroup);
    } else {
      // Group is incomplete — render each section standalone
      for (const s of sections) {
        plan.push({ type: "standalone", section: s });
      }
    }
    currentGroup = null;
  };

  for (const section of sortedSections) {
    if (!shouldRenderSection(section)) continue;

    const family = getLayoutFamily(section.display_type);

    if (family === "skip") continue;

    if (family === "standalone") {
      flushGroup();
      plan.push({ type: "standalone", section });
    } else {
      const groupType = family === "hero" ? "hero-group" : "three-col-group";

      if (currentGroup && currentGroup.type === groupType) {
        currentGroup.sections.push(section);
      } else {
        flushGroup();
        currentGroup = { type: groupType, sections: [section] };
      }
    }
  }

  flushGroup();
  return plan;
};

/**
 * Validates whether a group should render as a composite layout.
 * 
 * Hero group: always valid — even a single hero-family section renders
 * in the 3-column hero layout (empty columns are simply not shown).
 * Column placement is fixed by display_type, not by list_order.
 * 
 * Three-col group: valid when at least 1 member is present.
 */
function validateGroup(type, sections) {
  if (type === "hero-group") {
    return sections.length >= 1;
  }
  if (type === "three-col-group") {
    return sections.length >= 1;
  }
  return false;
}

// ─── Standalone Section Renderer ──────────────────────────────────────────────

/**
 * Renders a standalone section based on its display_type.
 * For sections that don't belong to a composite layout group,
 * or hero/three-col sections rendered individually when not adjacent.
 */
export const renderStandaloneSection = (section, options = {}) => {
  const { styles, onConnect, navigate, userId, astrologerMaleImg } = options;
  const { display_type: displayType, list_order, slug } = section || {};

  if (!displayType) return null;

  const key = `section-${list_order}-${displayType}-${slug || ""}`;

  switch (displayType) {
    case "quick-link-section":
      return <QuickLinkSection key={key} sectionData={section} styles={styles} />;

    case "astrologer-grid":
      return <AstrologerGridSection key={key} sectionData={section} styles={styles} onConnect={onConnect} />;

    case "blog":
      return <BlogSectionV2 key={key} sectionData={section} styles={styles} />;

    case "my-sessions":
      return (
        <Suspense key={key} fallback={null}>
          <MySessionsSection userId={userId} navigate={navigate} styles={styles} astrologerMaleImg={astrologerMaleImg} />
        </Suspense>
      );

    case "live-tracking":
      return <LiveTrackingSection key={key} sectionData={section} styles={styles} />;

    case "connect-astrologer":
      return <ConnectAstrologerSection key={key} sectionData={section} styles={styles} />;

    // Hero/three-col types rendered standalone (when not grouped)
    // These are handled by the parent component with their specific layouts
    case "complementary-services":
    case "ai-powered-astrology":
    case "muharat-widget":
    case "ai-services":
    case "astrologers-by-category":
    case "ai-agentic":
    case "discover-more":
    case "live-widget":
      // Return a marker so the parent knows to render this type standalone
      return null;

    default:
      return null;
  }
};

// ─── Deprecated (kept for backward compat if needed) ──────────────────────────

export const groupSectionsByZone = (sortedList) => {
  const heroSections = {};
  const threeColSections = {};
  const standaloneSections = [];

  for (const section of sortedList) {
    const dt = section.display_type;
    if (!dt) continue;
    if (HERO_LAYOUT_TYPES.has(dt)) heroSections[dt] = section;
    else if (THREE_COL_LAYOUT_TYPES.has(dt)) threeColSections[dt] = section;
    else standaloneSections.push(section);
  }

  return { heroSections, threeColSections, standaloneSections };
};

export const renderDynamicSection = renderStandaloneSection;
