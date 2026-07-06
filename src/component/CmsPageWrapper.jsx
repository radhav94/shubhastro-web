import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Plus, Minus } from "lucide-react";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
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
  "/live"
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

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const OG_IMAGE_PATH = "/images/shubhastro-logo-banner.jpeg";
const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
const FAVICON_PATH = "/images/mobile-shubh-astro-logo.svg";
const FAVICON_URL = `${SITE_ORIGIN}${FAVICON_PATH}`;
const DEFAULT_TITLE = "ShubhAstro";

/**
 * CmsPageWrapper
 *
 * Wraps every route's component. For non-excluded routes:
 * 1. Calls GET /api/static-pages?slug=<path> using the current URL as slug
 * 2. Sets meta tags (title, description, keywords, OG, Twitter, canonical) from API response
 * 3. If body is non-empty → appends CMS HTML body below the child component
 * 4. If body is empty → renders the original child component (with meta still applied)
 *
 * Always renders a default Helmet with fallback title so no page is ever without a <title>.
 * Page-specific Helmets (SeoHelmet or CMS data) override this via react-helmet-async priority.
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

  const title = pageData?.meta_title || pageData?.title || DEFAULT_TITLE;
  const description = pageData?.meta_description || pageData?.title || "";
  const keywords = pageData?.meta_tags
    ? Array.isArray(pageData.meta_tags)
      ? pageData.meta_tags.join(", ")
      : pageData.meta_tags
    : "";
  // Strip query params and hash for canonical URL to avoid duplicate content
  const canonicalUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}`
    : "";

  return (
    <>
      {pageData ? (
        <Helmet>
          <title>{title}</title>
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
          <link rel="icon" type="image/svg+xml" href={FAVICON_URL} />
          <link rel="shortcut icon" href={FAVICON_URL} />
          <meta name="description" content={description} />
          {keywords && <meta name="keywords" content={keywords} />}

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={OG_IMAGE_URL} />
          <meta property="og:image:secure_url" content={OG_IMAGE_URL} />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={OG_IMAGE_URL} />
        </Helmet>
      ) : !shouldSkip && (
        <Helmet>
          <title>{DEFAULT_TITLE}</title>
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
          <link rel="icon" type="image/svg+xml" href={FAVICON_URL} />
          <link rel="shortcut icon" href={FAVICON_URL} />
          <meta property="og:type" content="website" />
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
          <meta property="og:title" content={DEFAULT_TITLE} />
          <meta property="og:image" content={OG_IMAGE_URL} />
          <meta property="og:image:secure_url" content={OG_IMAGE_URL} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={DEFAULT_TITLE} />
          <meta name="twitter:image" content={OG_IMAGE_URL} />
        </Helmet>
      )}

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
