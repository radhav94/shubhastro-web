import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import styles from "../screens/public/static-pages/StaticPages.module.scss";
import PrimaryLoader from "./UI/PrimaryLoader";
import NotFound from "../screens/private/NotFound/NotFound";
import Divider from "./Divider";

/**
 * CmsNotFoundPage
 *
 * Used as the catch-all (*) route element.
 * Before showing 404, checks if the CMS has content for this slug.
 * If body exists → renders CMS content.
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
          <meta
            name="keywords"
            content={
              Array.isArray(pageData.meta_tags)
                ? pageData.meta_tags.join(", ")
                : pageData.meta_tags
            }
          />
        )}
      </Helmet>
      {pageData.title && (
        <>
          <h1 className={styles.title}>{pageData.title}</h1>
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
