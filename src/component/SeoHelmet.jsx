import { Helmet } from "react-helmet-async";

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const OG_IMAGE_PATH = "/images/shubhastro-logo-banner.jpeg";
const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
const FAVICON_PATH = "/images/mobile-shubh-astro-logo.svg";
const FAVICON_URL = `${SITE_ORIGIN}${FAVICON_PATH}`;
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
 * @param {string} [props.image] - Optional image URL for og:image / twitter:image
 */
const SeoHelmet = ({ data, image }) => {
  if (!data || typeof data !== "object") return null;

  const title = data.meta_title || DEFAULT_TITLE;
  const description = data.meta_description || "";
  const keywords = parseKeywords(data.meta_keywords);
  const ogImage = image || OG_IMAGE_URL;
  // Strip query params and hash for canonical URL to avoid duplicate content
  const canonicalUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}`
    : "";

  return (
    <Helmet>
      <title>{title}</title>
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <link rel="icon" type="image/svg+xml" href={FAVICON_URL} />
      <link rel="shortcut icon" href={FAVICON_URL} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:site_name" content="ShubhAstro" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SeoHelmet;
