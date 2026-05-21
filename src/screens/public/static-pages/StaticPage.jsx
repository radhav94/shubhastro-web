import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetStaticPageBySlugQuery } from "../../../redux/api/staticPages/staticPagesApi";
import { STATIC_PAGE_SLUGS } from "./staticPagesConfig";
import styles from "./StaticPages.module.scss";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

/**
 * Dynamic CMS static page renderer.
 * Reads the current URL path, checks if the slug exists in STATIC_PAGE_SLUGS,
 * fetches page content (title, body, meta) from the API, and renders it.
 */
const StaticPage = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "");
  const isValidSlug = STATIC_PAGE_SLUGS.includes(slug);

  const { data, isLoading, isError } = useGetStaticPageBySlugQuery(slug, {
    skip: !isValidSlug,
  });

  const pageData = data?.data;

  if (!isValidSlug) return null;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <PrimaryLoader />
      </div>
    );
  }

  if (isError || !pageData) {
    return (
      <div className={styles.container}>
        <p className={styles.paragraph}>Page not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{pageData.meta_title || pageData.title || "ShubhTalk"}</title>
        {(pageData.meta_description || pageData.title) && (
          <meta
            name="description"
            content={pageData.meta_description || pageData.title}
          />
        )}
        {pageData.meta_tags && (
          <meta name="keywords" content={pageData.meta_tags} />
        )}
      </Helmet>

      <h1 className={styles.title}>{pageData.title}</h1>
      {pageData.body && (
        <div
          className={styles.htmlContent}
          dangerouslySetInnerHTML={{ __html: pageData.body }}
        />
      )}
    </div>
  );
};

export default StaticPage;
