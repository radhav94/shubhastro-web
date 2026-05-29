import { Helmet } from "react-helmet-async";
import logoUrl from "../assets/images/mobile-shubh-astro-logo.svg";

const LOGO_URL = logoUrl;
const DEFAULT_TITLE = "ShubhAstro";

/**
 * Safely converts keywords to a comma-separated string.
 * Handles: string, array of strings, null/undefined.
 */
const parseKeywords = (keywords) => {
  if (!keywords) return "";
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(", ");
  if (typeof keywords === "string") return keywords;
  return "";
};

/**
 * SeoHelmet - Reusable SEO meta tags component
 *
 * Renders all standard meta tags (title, description, keywords, canonical,
 * Open Graph, Twitter Card) from API response data.
 * Mirrors the CmsPageWrapper meta tag pattern for consistency.
 *
 * @param {Object} props
 * @param {Object|null|undefined} props.data - API response data containing meta fields
 * @param {string} [props.data.meta_title] - Page title
 * @param {string} [props.data.meta_description] - Page description
 * @param {string|string[]} [props.data.meta_keywords] - Page keywords
 */
const SeoHelmet = ({ data }) => {
  if (!data || typeof data !== "object") return null;

  const title = data.meta_title || DEFAULT_TITLE;
  const description = data.meta_description || "";
  const keywords = parseKeywords(data.meta_keywords);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <Helmet>
      <title>{title}</title>
      {pageUrl && <link rel="canonical" href={pageUrl} />}
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
  );
};

export default SeoHelmet;
