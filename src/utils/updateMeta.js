/**
 * updateMeta - Directly updates existing meta tags in index.html.
 * Never creates new elements — only modifies tags already present in the DOM.
 * This replaces react-helmet-async with zero-dependency DOM manipulation.
 */

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const OG_IMAGE_URL = `${SITE_ORIGIN}/images/shubhastro-logo-banner.jpeg`;

const DEFAULTS = {
  title: "ShubhAstro - Talk to Best Astrologers Online | Kundli, Horoscope & Tarot",
  description: "Connect with expert astrologers for personalized consultations via chat, call & video. Get free Kundli, daily horoscope, tarot readings & more.",
  image: OG_IMAGE_URL,
  url: SITE_ORIGIN,
};

/**
 * Update a single meta tag's content attribute.
 * @param {string} attr - Attribute to match ("name" or "property")
 * @param {string} key - Attribute value (e.g. "description", "og:title")
 * @param {string} content - New content value
 */
const setMeta = (attr, key, content) => {
  const el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) el.setAttribute("content", content);
};

/**
 * Update all SEO meta tags in the document head.
 * Only touches existing tags defined in index.html — no duplicates.
 *
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} [options.description]
 * @param {string} [options.keywords]
 * @param {string} [options.image]
 * @param {string} [options.url]
 */
export const updateMeta = ({ title, description, keywords, image, url } = {}) => {
  const pageTitle = title || DEFAULTS.title;
  const pageDesc = description || DEFAULTS.description;
  const pageImage = image || DEFAULTS.image;
  const pageUrl = url || `${window.location.origin}${window.location.pathname}`;

  // Title
  document.title = pageTitle;

  // Standard meta
  setMeta("name", "description", pageDesc);
  if (keywords) setMeta("name", "keywords", keywords);

  // Open Graph
  setMeta("property", "og:title", pageTitle);
  setMeta("property", "og:description", pageDesc);
  setMeta("property", "og:image", pageImage);
  setMeta("property", "og:url", pageUrl);

  // Twitter
  setMeta("name", "twitter:title", pageTitle);
  setMeta("name", "twitter:description", pageDesc);
  setMeta("name", "twitter:image", pageImage);

  // Canonical
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", pageUrl);
};

/**
 * Reset all meta tags back to index.html defaults.
 */
export const resetMeta = () => {
  updateMeta({
    title: DEFAULTS.title,
    description: DEFAULTS.description,
    image: DEFAULTS.image,
    url: SITE_ORIGIN,
  });
};
