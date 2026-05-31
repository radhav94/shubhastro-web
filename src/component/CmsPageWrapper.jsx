import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import styles from "../screens/public/static-pages/StaticPages.module.scss";

// Routes excluded from CMS static page lookup
const EXCLUDED_PATHS = [
  "/",
  "/home-new",
  "/home-v2",
  "/ai-wow",
  "/shubh-mall",
  "/explore",
  "/blog",
  "/community"
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

const LOGO_PATH = "/src/assets/images/mobile-shubh-astro-logo.svg";
const LOGO_URL = typeof window !== "undefined"
  ? `${window.location.origin}${LOGO_PATH}`
  : LOGO_PATH;
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
  const slug = pathname.replace(/^\//, "");
  const shouldSkip = isExcluded(pathname) || !slug;

  const { data, isError } = useGetStaticPageBySlugQuery(slug, {
    skip: shouldSkip,
  });

  // Only use data if not excluded and data matches current slug
  const pageData = !shouldSkip && !isError && data?.data?.slug === slug
    ? data.data
    : null;
  const hasBody = pageData?.body && pageData.body.trim().length > 0;

  const title = pageData?.meta_title || pageData?.title || DEFAULT_TITLE;
  const description = pageData?.meta_description || pageData?.title || "";
  const keywords = pageData?.meta_tags
    ? Array.isArray(pageData.meta_tags)
      ? pageData.meta_tags.join(", ")
      : pageData.meta_tags
    : "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      {pageData ? (
        <Helmet>
          <title>{title}</title>
          {pageUrl && <link rel="canonical" href={pageUrl} />}
          <link rel="icon" type="image/svg+xml" href={LOGO_URL} />
          <link rel="shortcut icon" href={LOGO_URL} />
          <meta name="description" content={description} />
          {keywords && <meta name="keywords" content={keywords} />}

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          {pageUrl && <meta property="og:url" content={pageUrl} />}
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={LOGO_URL} />
          <meta property="og:image:secure_url" content={LOGO_URL} />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={LOGO_URL} />
        </Helmet>
      ) : !shouldSkip && (
        <Helmet>
          <title>{DEFAULT_TITLE}</title>
          {pageUrl && <link rel="canonical" href={pageUrl} />}
          <link rel="icon" type="image/svg+xml" href={LOGO_URL} />
          <link rel="shortcut icon" href={LOGO_URL} />
          <meta property="og:type" content="website" />
          {pageUrl && <meta property="og:url" content={pageUrl} />}
          <meta property="og:title" content={DEFAULT_TITLE} />
          <meta property="og:image" content={LOGO_URL} />
          <meta property="og:image:secure_url" content={LOGO_URL} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={DEFAULT_TITLE} />
          <meta name="twitter:image" content={LOGO_URL} />
        </Helmet>
      )}

      {hasBody ? (
        <>
          {children}
          <div className={styles.container}>
            <div
              className={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: pageData.body }}
            />
          </div>
        </>
      ) : (
        children
      )}
    </>
  );
};

export default CmsPageWrapper;
