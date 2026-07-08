import { useEffect } from "react";
import { updateMeta, resetMeta } from "../utils/updateMeta";

/**
 * Safely converts keywords to a comma-separated string.
 */
const parseKeywords = (keywords) => {
  if (!keywords) return "";
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(", ");
  if (typeof keywords === "string") return keywords;
  return "";
};

/**
 * SeoHelmet - Updates existing meta tags in index.html with API data.
 * No library needed — directly mutates DOM meta tags.
 * Resets to defaults on unmount.
 *
 * @param {Object} props
 * @param {Object|null|undefined} props.data - API response with meta fields
 * @param {string} [props.data.meta_title] - Page title
 * @param {string} [props.data.meta_description] - Page description
 * @param {string|string[]} [props.data.meta_keywords] - Page keywords
 * @param {string} [props.image] - Optional image URL for og:image / twitter:image
 */
const SeoHelmet = ({ data, image }) => {
  useEffect(() => {
    if (!data || typeof data !== "object") return;

    const title = data.meta_title || "";
    const description = data.meta_description || "";
    const keywords = parseKeywords(data.meta_keywords);

    updateMeta({ title, description, keywords, image });

    return () => resetMeta();
  }, [data, image]);

  return null;
};

export default SeoHelmet;
