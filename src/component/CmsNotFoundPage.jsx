import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import { createCmsBodyClickHandler } from "../utils/helper/cmsBodyLinks";
import { updateMeta, resetMeta } from "../utils/updateMeta";
import styles from "../screens/public/static-pages/StaticPages.module.scss";
import PrimaryLoader from "./UI/PrimaryLoader";
import NotFound from "../screens/private/NotFound/NotFound";
import Divider from "./Divider";
import BackButton from "./UI/BackButton/BackButton";

/**
 * CmsNotFoundPage
 *
 * Used as the catch-all (*) route element.
 * Before showing 404, checks if the CMS has content for this slug.
 * If body exists → renders CMS content with SEO meta tags (updated in-place).
 * If API returns 404 or body is empty → renders the NotFound component.
 */
const CmsNotFoundPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const slug = pathname.replace(/^\//, "");

  /*
    Keep in-body links inside the SPA. These pages are the legal/static set, and
    the native app opens them in a webview with `?type=webview` — where a full
    document load means re-booting the whole app for a link to the Privacy Policy.
    Same treatment the blog article body already has. See cmsBodyLinks.
  */
  const handleBodyClick = useMemo(() => createCmsBodyClickHandler(navigate), [navigate]);

  const { data, isLoading, isError } = useGetStaticPageBySlugQuery(slug, {
    skip: !slug,
  });

  const pageData = data?.data;
  const hasBody = pageData?.body && pageData.body.trim().length > 0;

  const title = pageData?.meta_title || pageData?.title || "";
  const description = pageData?.meta_description || pageData?.title || "";
  const keywords = pageData?.meta_tags
    ? Array.isArray(pageData.meta_tags)
      ? pageData.meta_tags.join(", ")
      : pageData.meta_tags
    : "";

  // Update meta tags when CMS data loads
  useEffect(() => {
    if (hasBody && pageData) {
      updateMeta({ title, description, keywords });
    }
    return () => resetMeta();
  }, [hasBody, pageData, title, description, keywords]);

  if (isLoading) {
    return (
      <div className={`${styles.container} ${styles.cmsLoading}`}>
        {/*
          `fullscreen` defaults to true, which is `position: fixed` over the whole
          viewport at z-index 999999 — above the header (2001). This component is
          the catch-all that serves every CMS/SEO landing page, so for the whole
          CMS round trip the entire page was covered by a blocking overlay: taps
          on the header, the nav or the footer hit the overlay and were swallowed.
          The loader belongs in the page flow here, where it reports progress
          without disabling the chrome around it.

          .cmsLoading reserves 60vh around it. Without that the loading page was
          about one loader tall and the arriving CMS body shifted the footer down
          by the height of the whole article — see the note on .cmsLoading.
        */}
        <PrimaryLoader fullscreen={false} />
      </div>
    );
  }

  if (isError || !hasBody) {
    return <NotFound />;
  }

  return (
    <div className={styles.container}>
      {pageData.title && (
        <>
          {new URLSearchParams(window.location.search).get("type") !== "webview" && (
            <div className={styles.titleName}>
              <BackButton style={{ margin: 0 }} />
              <h1 className={styles.title} style={{ margin: 0 }}>{pageData.title}</h1>
            </div>
          )}
          {new URLSearchParams(window.location.search).get("type") !== "webview" && <Divider />}
        </>
      )}
      <div
        className={styles.htmlContent}
        onClick={handleBodyClick}
        dangerouslySetInnerHTML={{ __html: pageData.body }}
      />
    </div>
  );
};

export default CmsNotFoundPage;
