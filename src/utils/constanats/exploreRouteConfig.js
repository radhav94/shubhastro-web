/**
 * Explore Page Route Configuration
 * Maps API slugs to application routes for "All About You" section only
 * 
 * Usage:
 * - Key: slug from API response
 * - Value: route path to navigate to
 */

export const EXPLORE_SLUG_TO_ROUTE_MAP = {
  // All About You Section
  "explore-your-horoscope": "/horoscopes/daily-horoscope",
  "daily-horoscope": "/horoscopes/daily-horoscope",
  "explore-your-kundli": "/kundli",
  "kundli-reports": "/kundli?tab=free-report",
  "remedies-for-you": "/remedies",
  "remedies": "/kundli?tab=free-report&subtab=remedies",
};

/**
 * Get route from slug
 * @param {string} slug - The slug from API
 * @returns {string|null} - The route path or null if not found
 */
export const getRouteFromSlug = (slug) => {
  if (!slug) return null;
  
  // Normalize slug (lowercase, trim)
  const normalizedSlug = slug.toLowerCase().trim();
  
  return EXPLORE_SLUG_TO_ROUTE_MAP[normalizedSlug] || null;
};

/**
 * Check if slug requires profile data
 * @param {string} slug - The slug from API
 * @returns {boolean} - True if profile data is needed
 */
export const requiresProfileData = (slug) => {
  if (!slug) return false;
  
  const normalizedSlug = slug.toLowerCase().trim();
  const kundliSlugs = [
    "explore-your-kundli",
    "kundli-reports",
    "remedies-for-you",
    "remedies",
  ];
  
  return kundliSlugs.includes(normalizedSlug);
};
