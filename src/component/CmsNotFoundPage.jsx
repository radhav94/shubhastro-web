import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGetStaticPageBySlugQuery } from "../redux/api/staticPages/staticPagesApi";
import { createCmsBodyClickHandler } from "../utils/helper/cmsBodyLinks";
import { updateMeta, resetMeta } from "../utils/updateMeta";
import { getToken } from "../utils/token";
import styles from "../screens/public/static-pages/StaticPages.module.scss";
import PrimaryLoader from "./UI/PrimaryLoader";
import NotFound from "../screens/private/NotFound/NotFound";
import Divider from "./Divider";
import BackButton from "./UI/BackButton/BackButton";

/*
  Muhurat SEO landing pages advertise a date-picking tool their body never links
  to. Verified against the live CMS documents rather than assumed
  (GET /api/static-pages?slug=<slug>, all eight fetched):

    slug                     bytes   <a>   <strong>   "calculator"/"tool"
    naam-karan-muhurat       4151      0          9                     5
    marriage-muhurat         3449      0         25                     4
    bhoomi-pujan-muhurat     3649      0          9                     3
    griha-pravesh-muhurat    3711      0         13                     2
    mundan-muhurat           3398      0         16                     2
    car-buying-muhurat       4221      0         12                     0
    bike-buying-muhurat      4824      0          8                     0
    gold-buying-muhurat      5255      0         10                     0

  Every one of them ships ZERO anchors, so the entire body is inert. The dates
  are plain bold runs inside a paragraph, e.g. from bhoomi-pujan-muhurat:

    <h3>November 2026</h3>
    <p><strong>1 November, 5 November, 14 November, 21 November, 25 November</strong><br />
    November is a strong post-monsoon period ...</p>

  Two Clarity dead clicks, two visitors, two devices, the same construct:
    - 57ww6z (Sep 7, Samsung Internet, mobile) tapped the September block; Clarity
      named it "... September, ... Septembe", which is that <strong>'s own text
      truncated. One click, then the visitor left at 00:28.
    - 1qpvpk (Sep 9, Chrome PC, arrived from Google) tapped the November block at
      00:03:33; Clarity named it "November".

  Neither was a mis-aim at a link: there is no link on the page to miss. Both were
  a visitor trying to act on a date, on a page that offers no action anywhere. The
  bold dates are not link-coloured either (.htmlContent leaves <strong> at the
  inherited #444), so this is unmet intent, not a styling trap.

  Fix: give the page the action its copy promises. The tool is real — PATH
  privateRoutes AGENTIC_CALENDAR, /aiwow/muhurat-calendar — and it already sits in
  the same footer "Important Links" block as these eight pages. Until now the only
  route to it from here was scrolling past a 27-item link list.

  Keyed by exact slug, so the legal/policy pages this catch-all also serves match
  nothing and render exactly as before.
*/
const MUHURAT_CALENDAR_PATH = "/aiwow/muhurat-calendar";

const RELATED_TOOL = {
  "naam-karan-muhurat": { blurb: "Dates below are general Panchang references. Naamkaran timing shifts with your city and the baby's birth details.", label: "Check your exact Naamkaran muhurat", to: MUHURAT_CALENDAR_PATH },
  "marriage-muhurat": { blurb: "Dates below are general Panchang references. Marriage muhurat depends on both horoscopes and your city.", label: "Check your exact marriage muhurat", to: MUHURAT_CALENDAR_PATH },
  "bhoomi-pujan-muhurat": { blurb: "Dates below are general Panchang references. Bhoomi Pujan timing shifts with your city's sunrise and Rahu Kaal.", label: "Check your exact Bhoomi Pujan muhurat", to: MUHURAT_CALENDAR_PATH },
  "griha-pravesh-muhurat": { blurb: "Dates below are general Panchang references. Griha Pravesh timing shifts with your city and Vastu direction.", label: "Check your exact Griha Pravesh muhurat", to: MUHURAT_CALENDAR_PATH },
  "mundan-muhurat": { blurb: "Dates below are general Panchang references. Mundan timing shifts with the child's nakshatra and your city.", label: "Check your exact Mundan muhurat", to: MUHURAT_CALENDAR_PATH },
  "car-buying-muhurat": { blurb: "Dates below are general Panchang references. The best buying window shifts with your city and your own chart.", label: "Check your exact car buying muhurat", to: MUHURAT_CALENDAR_PATH },
  "bike-buying-muhurat": { blurb: "Dates below are general Panchang references. The best buying window shifts with your city and your own chart.", label: "Check your exact bike buying muhurat", to: MUHURAT_CALENDAR_PATH },
  "gold-buying-muhurat": { blurb: "Dates below are general Panchang references. The best buying window shifts with your city and your own chart.", label: "Check your exact gold buying muhurat", to: MUHURAT_CALENDAR_PATH },
};

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

  const isWebview = new URLSearchParams(window.location.search).get("type") === "webview";
  const relatedTool = RELATED_TOOL[slug];

  return (
    <div className={styles.container}>
      {pageData.title && (
        <>
          {!isWebview && (
            <div className={styles.titleName}>
              <BackButton style={{ margin: 0 }} />
              <h1 className={styles.title} style={{ margin: 0 }}>{pageData.title}</h1>
            </div>
          )}
          {!isWebview && <Divider />}
        </>
      )}

      {/*
        Sits above the body so the action is present before the reader reaches the
        date lists and starts poking at them. Hidden in the native webview, which
        already suppresses the title and back button here and has its own chrome.

        The "sign in" line is derived from the token rather than hardcoded, because
        the gate lives on the route (PrivateRoute wraps /aiwow/muhurat-calendar in
        App.jsx) and would otherwise go stale if that changes. Saying it up front
        matters: PrivateRoute answers a logged-out tap with a redirect to
        /login?skip=welcome, and an unannounced login wall is its own frustration
        (see the repeated login returns in session q4kzpk).
      */}
      {relatedTool && !isWebview && (
        <div className={styles.cmsToolCta}>
          <p className={styles.cmsToolCtaText}>{relatedTool.blurb}</p>
          <Link to={relatedTool.to} className={styles.cmsToolCtaBtn}>
            {relatedTool.label}
            <span aria-hidden="true">&nbsp;&rsaquo;</span>
          </Link>
          {!getToken() && (
            <span className={styles.cmsToolCtaNote}>Sign in required to save your details</span>
          )}
        </div>
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
