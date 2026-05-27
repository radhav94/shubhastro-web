import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import styles from "../screens/public/static-pages/StaticPages.module.scss";
import Divider from "./Divider";

// Routes excluded from CMS static page lookup
const EXCLUDED_PATHS = [
  "/",
  "/home-new",
  "/home-v2",
  "/ai-wow",
  "/shubh-mall",
  "/explore",
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

/**
 * CmsPageWrapper
 *
 * Wraps every route's component. For non-excluded routes:
 * 1. Calls GET /api/static-pages?slug=<path> using the current URL as slug
 * 2. Sets meta tags (title, description, keywords) from API response
 * 3. If body is non-empty → renders CMS HTML body instead of the child component
 * 4. If body is empty → renders the original child component (with meta still applied)
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

  return (
    <>
      <Helmet>
        <title>
          {pageData?.meta_title || pageData?.title || "ShubhTalk"}
        </title>
        <meta
          name="description"
          content={pageData?.meta_description || pageData?.title || ""}
        />
        {pageData?.meta_tags ? (
          <meta
            name="keywords"
            content={
              Array.isArray(pageData.meta_tags)
                ? pageData.meta_tags.join(", ")
                : pageData.meta_tags
            }
          />
        ) : (
          <meta name="keywords" content="" />
        )}
      </Helmet>

      {hasBody ? (
        <>
          {children}
          <div className={styles.container}>
            {/* {pageData.title && (
              <>
                <h1 className={styles.title}>{pageData.title}</h1>
                <Divider />
              </>
            )} */}
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
