/**
 * Sitemap Generator
 * Automatically generates sitemap.xml from route definitions in Paths.js
 * Run after build: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Site base URL — uses dynamic domain
const SITE_URL = process.env.SITE_URL || 'https://www.shubhastro.ai';

// API base URL for fetching dynamic content (static pages, etc.)
const API_BASE_URL = process.env.SITEMAP_API_URL || ' https://njsapi.shubhastro.ai/api';

// Path to the app's route definitions — used to detect drift between the
// curated sitemap routes and the actual app routes.
const PATHS_FILE = path.resolve(__dirname, '../src/utils/routes/Paths.js');

/**
 * Reads Paths.js and returns a Set of every literal route path declared there
 * (including each entry of array-form `path: [...]`). Used to warn when a
 * hardcoded sitemap route no longer matches any real app route.
 */
function readAppRoutePaths() {
  try {
    const src = fs.readFileSync(PATHS_FILE, 'utf-8');
    const paths = new Set();
    // Match every quoted string that starts with "/" (route path literals).
    const regex = /["'](\/[^"'\s]*)["']/g;
    let match;
    while ((match = regex.exec(src)) !== null) {
      paths.add(match[1]);
    }
    return paths;
  } catch (err) {
    console.warn(`⚠️  Could not read Paths.js for route validation: ${err.message}`);
    return null;
  }
}

/**
 * Warns if any curated sitemap route is missing from Paths.js (i.e. a path was
 * renamed/removed in the app but not updated here). Non-fatal — it only prints
 * a clear warning so the drift is caught during the build.
 */
function validateRoutesAgainstApp(routes) {
  const appPaths = readAppRoutePaths();
  if (!appPaths) return;
  const stale = routes
    .map((r) => r.path)
    .filter((p) => p !== '/' && !appPaths.has(p));
  if (stale.length > 0) {
    console.warn(
      '\n⚠️  SITEMAP DRIFT DETECTED — these hardcoded routes are not in Paths.js ' +
      '(they may have been renamed/removed). Update staticRoutes in generate-sitemap.js:\n' +
      stale.map((p) => `   - ${p}`).join('\n') + '\n'
    );
  }
}

// Zodiac signs for horoscope routes
const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

// Static routes that should appear in sitemap
const staticRoutes = [
  // Main pages
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/explore', priority: '0.9', changefreq: 'daily' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  //{ path: '/chat-with-astrologers', priority: '0.9', changefreq: 'daily' },
  //{ path: '/call-to-astrologers', priority: '0.9', changefreq: 'daily' },
  
  // Horoscope pages
  { path: '/daily-horoscope', priority: '0.9', changefreq: 'daily' },
  { path: '/tomorrow-horoscope', priority: '0.8', changefreq: 'daily' },
  { path: '/weekly-horoscope', priority: '0.8', changefreq: 'weekly' },
  { path: '/yearly-horoscope', priority: '0.7', changefreq: 'monthly' },
  
  // Kundli & Matching
  { path: '/kundli', priority: '0.8', changefreq: 'monthly' },
  { path: '/match-making', priority: '0.8', changefreq: 'monthly' },
  
  // AI WOW features (canonical base is /ai-wow, feature pages live under /ai-wow/<slug>)
  { path: '/ai-wow', priority: '0.8', changefreq: 'weekly' },
  { path: '/ai-wow/ai-palmistry-scanner', priority: '0.7', changefreq: 'monthly' },
  { path: '/ai-wow/clothes-colour-analysis', priority: '0.7', changefreq: 'monthly' },
  
  // Calculators
  { path: '/numerology-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/love-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/friendship-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/flames-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/rashi-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/sun-sign-calculator', priority: '0.7', changefreq: 'monthly' },
  //{ path: '/rising-sign-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/age-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/dasha-calculator', priority: '0.7', changefreq: 'monthly' },
  //{ path: '/lucky-mobile-number-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/lucky-vehicle-number-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/mangal-dosha-calculator', priority: '0.7', changefreq: 'monthly' },
  //{ path: '/atmakaraka-calculator', priority: '0.7', changefreq: 'monthly' },
  
  // Other pages
  { path: '/panchang', priority: '0.8', changefreq: 'daily' },
  { path: '/numerology', priority: '0.7', changefreq: 'monthly' },
  { path: '/laal-kitab', priority: '0.7', changefreq: 'monthly' },
  { path: '/occult', priority: '0.7', changefreq: 'monthly' },
  { path: '/tarot', priority: '0.7', changefreq: 'monthly' },
  { path: '/community', priority: '0.6', changefreq: 'weekly' },
  
  // Static pages
  { path: '/about-us', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
];

// Generate dynamic horoscope URLs for each zodiac sign
const horoscopeTypes = ['daily-horoscope', 'tomorrow-horoscope', 'weekly-horoscope', 'yearly-horoscope'];
const dynamicRoutes = [];

horoscopeTypes.forEach(type => {
  zodiacSigns.forEach(sign => {
    dynamicRoutes.push({
      path: `/${type}/${sign}`,
      priority: type === 'daily-horoscope' ? '0.8' : '0.7',
      changefreq: type.includes('daily') || type.includes('tomorrow') ? 'daily' : type.includes('weekly') ? 'weekly' : 'monthly',
    });
  });
});

// Combine all routes
const allRoutes = [...staticRoutes, ...dynamicRoutes];

// AI-Wow feature slugs. Their canonical route is /ai-wow/<slug>, but several
// APIs (and the static-pages list) expose them as bare slugs. Any of these must
// resolve to the /ai-wow/ path in the sitemap, not the root alias.

// Build a sitemap path from an API slug, prefixing AI-Wow features with /ai-wow.
const slugToPath = (slug, aiWowSlugs) => {
  const clean = String(slug).replace(/^\/+/, '');
  return aiWowSlugs.has(clean) ? `/ai-wow/${clean}` : `/${clean}`;
};

// Fetch the AI-Wow feature slugs from the AI-suites API. These are the features
// that live under /ai-wow/<slug>. Fully dynamic — no hardcoded fallback.
async function fetchAiWowFeatureSlugs() {
  try {
    const res = await fetch(`${API_BASE_URL}/homepage/?slug=ai-suites`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`ai-suites returned ${res.status}`);
    const json = await res.json();
    const sections = json?.data?.list || [];
    // Each suite section holds its features in `content[]`.
    const slugs = sections
      .flatMap((section) => section?.content || [])
      .map((item) => item?.slug)
      .filter(Boolean);
    if (slugs.length === 0) {
      console.warn('⚠️  ai-suites returned no feature slugs; AI-Wow pages may be emitted at the root path (/<slug>) instead of /ai-wow/<slug>');
    }
    return new Set(slugs);
  } catch (err) {
    console.warn(`⚠️  Failed to fetch AI-Wow feature slugs: ${err.message}; AI-Wow pages may be emitted at the root path (/<slug>) instead of /ai-wow/<slug>`);
    return new Set();
  }
}

// Fetch dynamic static pages from the API and return them as sitemap routes
async function fetchStaticPageRoutes(aiWowSlugs) {
  try {
    const res = await fetch(`${API_BASE_URL}/static-pages/list`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`⚠️  static-pages/list returned ${res.status}; skipping static pages`);
      return [];
    }
    const json = await res.json();
    const list = json?.data || [];
    return list
      .filter((page) => page?.slug)
      .map((page) => ({
        path: slugToPath(page.slug, aiWowSlugs),
        priority: '0.4',
        changefreq: 'monthly',
      }));
  } catch (err) {
    console.warn(`⚠️  Failed to fetch static pages: ${err.message}; skipping`);
    return [];
  }
}

// Fetch all blog detail pages (/blog/:slug) by paginating through the blogs API.
async function fetchBlogRoutes() {
  const routes = [];
  const limit = 100;
  const MAX_PAGES = 500; // safety cap to avoid an accidental infinite loop
  let page = 1;

  try {
    while (page <= MAX_PAGES) {
      const res = await fetch(
        `${API_BASE_URL}/blogs/all?page=${page}&limit=${limit}&categorized=true`,
        { headers: { accept: 'application/json' } }
      );
      if (!res.ok) {
        console.warn(`⚠️  blogs/all page ${page} returned ${res.status}; stopping blog fetch`);
        break;
      }
      const json = await res.json();
      const list = json?.data || [];
      for (const blog of list) {
        if (!blog?.slug) continue;
        const lastmod = blog?.publishDate
          ? new Date(blog.publishDate).toISOString().split('T')[0]
          : undefined;
        routes.push({
          path: `/blog/${blog.slug}`,
          priority: '0.6',
          changefreq: 'weekly',
          ...(lastmod ? { lastmod } : {}),
        });
      }
      const hasNext = json?.pagination?.hasNextPage;
      const totalPages = json?.pagination?.totalPages;
      if (!hasNext || (totalPages && page >= totalPages) || list.length === 0) break;
      page += 1;
    }
  } catch (err) {
    console.warn(`⚠️  Failed to fetch blogs: ${err.message}; skipping blog detail pages`);
  }
  return routes;
}

// Fetch astrologer categories (skills/specialities) → /astrologers/:category
async function fetchAstrologerCategoryRoutes() {
  try {
    const res = await fetch(`${API_BASE_URL}/filters/get-filters/skills`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`⚠️  filters/get-filters/skills returned ${res.status}; skipping astrologer categories`);
      return [];
    }
    const json = await res.json();
    // Response shape: { data: [ { title, list: [ { slug, ... } ] } ] }
    const groups = json?.data || [];
    const slugs = groups.flatMap((group) =>
      (group?.list || []).map((item) => item?.slug).filter(Boolean)
    );
    // De-duplicate slugs within the categories themselves
    const uniqueSlugs = [...new Set(slugs)];
    return uniqueSlugs.map((slug) => ({
      path: `/astrologers/${slug}`,
      priority: '0.6',
      changefreq: 'weekly',
    }));
  } catch (err) {
    console.warn(`⚠️  Failed to fetch astrologer categories: ${err.message}; skipping`);
    return [];
  }
}

async function generate() {
  // Warn if any curated route no longer matches the app's Paths.js (drift).
  validateRoutesAgainstApp(staticRoutes);

  // The AI-Wow feature slugs are needed to correctly prefix static-page routes
  // with /ai-wow, so fetch them first.
  const aiWowSlugs = await fetchAiWowFeatureSlugs();

  const [staticPageRoutes, blogRoutes, astrologerCategoryRoutes] = await Promise.all([
    fetchStaticPageRoutes(aiWowSlugs),
    fetchBlogRoutes(),
    fetchAstrologerCategoryRoutes(),
  ]);

  // Merge, de-duplicating by path. Earlier entries take precedence, so the
  // curated static routes win over any dynamically fetched duplicates.
  const seen = new Set();
  const mergedRoutes = [];
  for (const route of [
    ...allRoutes,
    ...astrologerCategoryRoutes,
    ...staticPageRoutes,
    ...blogRoutes,
  ]) {
    if (seen.has(route.path)) continue;
    seen.add(route.path);
    mergedRoutes.push(route);
  }

  // Generate XML
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mergedRoutes.map(route => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  // Write to dist and public folders
  const distPath = path.resolve(__dirname, '../dist/sitemap.xml');
  const publicPath = path.resolve(__dirname, '../public/sitemap.xml');

  // Write to public (for dev server)
  fs.writeFileSync(publicPath, xml, 'utf-8');
  console.log(
    `✅ Sitemap generated: public/sitemap.xml (${mergedRoutes.length} URLs — ` +
    `${blogRoutes.length} blog pages, ${astrologerCategoryRoutes.length} astrologer categories, ` +
    `${staticPageRoutes.length} static pages)`
  );

  // Write to dist if it exists (for production build)
  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(distPath, xml, 'utf-8');
    console.log(`✅ Sitemap generated: dist/sitemap.xml (${mergedRoutes.length} URLs)`);
  }
}

generate();
