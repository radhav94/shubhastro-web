/**
 * CMS-managed static page slugs.
 * Each entry maps a route key (used in PATH.privateRoutes) to its CMS slug.
 * Routes are auto-generated from this config — no need to touch Paths.js.
 *
 * To add a new CMS page:
 *   Add an entry: { key: "ROUTE_KEY", slug: "cms-slug" }
 *
 * To remove a CMS page:
 *   Remove the entry from this array.
 */
export const STATIC_PAGES_CONFIG = [
  { key: "PRIVACY_POLICY", slug: "privacy-policy" },
  { key: "TERMSCONDITIONS", slug: "terms-and-conditions" },
  { key: "ABOUT", slug: "about-us" },
  { key: "FAQ", slug: "faq" },
  { key: "DISCLAIMER", slug: "disclaimer" },
  { key: "ASTROLOGERS_MUMBAI", slug: "astrologers/mumbai" },
  { key: "ASTROLOGERS_DELHI", slug: "astrologers/delhi" },
  { key: "ASTROLOGERS_CHENNAI", slug: "astrologers/chennai" },
  { key: "ASTROLOGERS_KOLKATA", slug: "astrologers/kolkata" },
  { key: "ASTROLOGERS_HYDERABAD", slug: "astrologers/hyderabad" },
];

// Flat array of slugs for validation in StaticPage component
export const STATIC_PAGE_SLUGS = STATIC_PAGES_CONFIG.map((p) => p.slug);
