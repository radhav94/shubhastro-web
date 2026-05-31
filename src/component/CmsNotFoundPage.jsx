import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import styles from "../screens/public/static-pages/StaticPages.module.scss";
import PrimaryLoader from "./UI/PrimaryLoader";
import NotFound from "../screens/private/NotFound/NotFound";
import Divider from "./Divider";
import BackButton from "./UI/BackButton/BackButton";

const LOGO_PATH = "/src/assets/images/mobile-shubh-astro-logo.svg";
const LOGO_URL = typeof window !== "undefined"
  ? `${window.location.origin}${LOGO_PATH}`
  : LOGO_PATH;

/**
 * CmsNotFoundPage
 *
 * Used as the catch-all (*) route element.
 * Before showing 404, checks if the CMS has content for this slug.
 * If body exists → renders CMS content with SEO meta tags.
 * If API returns 404 or body is empty → renders the NotFound component.
 */
const CmsNotFoundPage = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "");

  const { data, isLoading, isError } = useGetStaticPageBySlugQuery(slug, {
    skip: !slug,
  });

  const pageData = data?.data;
  const hasBody = pageData?.body && pageData.body.trim().length > 0;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <PrimaryLoader />
      </div>
    );
  }

  if (isError || !hasBody) {
    return <NotFound />;
  }

  const title = pageData.meta_title || pageData.title || "ShubhAstro";
  const description = pageData.meta_description || pageData.title || "";
  const keywords = pageData.meta_tags
    ? Array.isArray(pageData.meta_tags)
      ? pageData.meta_tags.join(", ")
      : pageData.meta_tags
    : "";
  const pageUrl = window.location.href;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{title}</title>
        <link rel="canonical" href={pageUrl} />
        <link rel="icon" type="image/svg+xml" href={LOGO_URL} />
        <link rel="shortcut icon" href={LOGO_URL} />
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
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
      {pageData.title && (
        <>
          <div className={styles.titleName}>
            <BackButton style={{ margin: 0 }} />
            <h1 className={styles.title} style={{ margin: 0 }}>{pageData.title}</h1>
          </div>
          <Divider />
        </>
      )}
      <div
        className={styles.htmlContent}
        dangerouslySetInnerHTML={{ __html: pageData.body }}
      />
    </div>
  );
};

export default CmsNotFoundPage;
