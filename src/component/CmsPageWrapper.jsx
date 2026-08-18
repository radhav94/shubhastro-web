import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import JsonLd from "./JsonLd";
import { updateMeta, resetMeta, updateCanonical } from "../utils/updateMeta";
import styles from "../screens/public/static-pages/StaticPages.module.scss";

// Routes excluded from CMS static page lookup
const EXCLUDED_PATHS = [
  "/",
  "/home-new",
  "/home-v2",
  // "/ai-wow",
  "/shubh-mall",
  // "/explore",
  "/blog",
  "/community",
  "/live",
  "/astrologers",
  // Individual astrologer profiles: /astrologer/<userName>, or the fallback
  // /astrologer/<slug>/<id>. Both are per-astrologer, so no CMS static page can
  // ever exist for them — this lookup
  // returned a guaranteed 404 on every profile view (confirmed in a network
  // trace). "/astrologers" above does not cover this: the prefix check appends
  // a slash, so it never matches the singular "/astrologer/".
  "/astrologer"
];

/**
 * Checks if the current path should be excluded from CMS lookup.
 * Matches exact paths and path prefixes (e.g., /ai-wow/*)
 */
const isExcluded = (pathname) =>
  EXCLUDED_PATHS.some(
    (excluded) =>
      pathname === excluded || pathname.startsWith(`${excluded}/`)
  );

/**
 * CmsPageWrapper
 *
 * Wraps every route's component. For non-excluded routes:
 * 1. Calls GET /api/static-pages?slug=<path> using the current URL as slug
 * 2. Updates existing meta tags in index.html with CMS data (no duplicates)
 * 3. If body is non-empty → appends CMS HTML body below the child component
 * 4. If body is empty → renders the original child component (with meta still applied)
 *
 * Uses direct DOM manipulation via updateMeta() to replace meta tag values in-place.
 */
const CmsPageWrapper = ({ children }) => {
  const { pathname } = useLocation();
  
  // Normalize slug — strip dynamic params like zodiac signs from horoscope routes
  const rawSlug = pathname.replace(/^\//, "");
  const horoscopePatterns = /^(daily-horoscope|tomorrow-horoscope|weekly-horoscope|yearly-horoscope|horoscope\/todays-horoscope)\/.+$/;
  const slug = horoscopePatterns.test(rawSlug) ? rawSlug.replace(/\/[^/]+$/, '') : rawSlug;
  
  const shouldSkip = isExcluded(pathname) || !slug;

  // Primary query with full slug
  const { data, isError } = useGetStaticPageBySlugQuery(slug, {
    skip: shouldSkip,
  });

  // Fallback: if primary fails (404), try parent slug only for horoscope paths
  const parentSlug = slug.includes("/") ? slug.substring(0, slug.lastIndexOf("/")) : "";
  const isHoroscopePath = slug.match(/^(daily-horoscope|tomorrow-horoscope|weekly-horoscope|yearly-horoscope)\//);
  const shouldFallback = !shouldSkip && (isError || (!data?.data)) && !!parentSlug && isHoroscopePath;

  const { data: fallbackData, isError: fallbackError } = useGetStaticPageBySlugQuery(parentSlug, {
    skip: !shouldFallback,
  });

  // Use primary data if available, otherwise fallback
  const resolvedData = (!shouldSkip && !isError && data?.data) ? data.data
    : (shouldFallback && !fallbackError && fallbackData?.data) ? fallbackData.data
    : null;

  // Only use data if slug matches (exact or prefix)
  const pageData = resolvedData
    ? (resolvedData.slug === slug || slug.startsWith(resolvedData.slug + "/") || resolvedData.slug === parentSlug)
      ? resolvedData
      : null
    : null;
  const hasBody = pageData?.body && pageData.body.trim().length > 0;

  const title = pageData?.meta_title || pageData?.title || "";
  const description = pageData?.meta_description || pageData?.title || "";
  const keywords = pageData?.meta_tags
    ? Array.isArray(pageData.meta_tags)
      ? pageData.meta_tags.join(", ")
      : pageData.meta_tags
    : "";

  // Always keep the canonical link in sync with the current URL on every
  // navigation — even for routes excluded from CMS lookup (e.g. astrologer
  // pages) or routes without a matching CMS entry. Without this, the canonical
  // would remain stale from the previous page or the index.html default.
  useEffect(() => {
    updateCanonical();
  }, [pathname]);

  // Update meta tags when CMS data changes
  useEffect(() => {
    if (pageData) {
      updateMeta({ title, description, keywords });
    }
    // Reset to defaults when navigating away
    return () => resetMeta();
  }, [pageData, title, description, keywords]);

  return (
    <>
      <JsonLd pageTitle={title || "ShubhAstro"} pageDescription={description} />

      {hasBody ? (
        <>
          {children}
          <CmsAccordion title={pageData.title} body={pageData.body} />
        </>
      ) : (
        children
      )}
    </>
  );
};

/**
 * CmsAccordion - Collapsible section for CMS body content (FAQ-style)
 * Uses first line of body as header text, remaining as expandable content.
 */
const CmsAccordion = ({ title, body }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract first line (text content of first HTML tag) as header
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = body;
  const firstElement = tempDiv.querySelector("p, h1, h2, h3, h4, h5, h6, div, span");
  const headerText = firstElement ? firstElement.textContent.trim() : title || "Read More";

  // Remove first element from body to get remaining content
  if (firstElement) firstElement.remove();
  const remainingBody = tempDiv.innerHTML;

  return (
    <div className={styles.cmsAccordion}>
      <div className={styles.cmsAccordionItem}>
        <button
          className={styles.cmsAccordionToggle}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
        >
          <span className={styles.cmsAccordionTitle}>{headerText}</span>
          <span className={styles.cmsAccordionIconWrapper}>
            {isOpen ? (
              <Minus size={20} className={styles.cmsAccordionIcon} />
            ) : (
              <Plus size={20} className={styles.cmsAccordionIcon} />
            )}
          </span>
        </button>
        {isOpen && (
          <div className={styles.cmsAccordionContent}>
            <div
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: remainingBody }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsPageWrapper;
