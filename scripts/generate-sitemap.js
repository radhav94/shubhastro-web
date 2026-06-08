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
const SITE_URL = process.env.SITE_URL || 'https://shubhastro.ai';

// Zodiac signs for horoscope routes
const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

// Static routes that should appear in sitemap
const staticRoutes = [
  // Main pages
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/explore', priority: '0.9', changefreq: 'daily' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/chat-with-astrologers', priority: '0.9', changefreq: 'daily' },
  { path: '/call-to-astrologers', priority: '0.9', changefreq: 'daily' },
  
  // Horoscope pages
  { path: '/daily-horoscope', priority: '0.9', changefreq: 'daily' },
  { path: '/tomorrow-horoscope', priority: '0.8', changefreq: 'daily' },
  { path: '/weekly-horoscope', priority: '0.8', changefreq: 'weekly' },
  { path: '/yearly-horoscope', priority: '0.7', changefreq: 'monthly' },
  
  // Kundli & Matching
  { path: '/kundli', priority: '0.8', changefreq: 'monthly' },
  { path: '/match-making', priority: '0.8', changefreq: 'monthly' },
  
  // AI WOW features
  { path: '/aiwow', priority: '0.8', changefreq: 'weekly' },
  { path: '/ai-palmistry-scanner', priority: '0.7', changefreq: 'monthly' },
  { path: '/clothes-colour-analysis', priority: '0.7', changefreq: 'monthly' },
  
  // Calculators
  { path: '/numerology-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/love-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/friendship-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/flames-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/rashi-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/sun-sign-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/rising-sign-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/age-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/dasha-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/lucky-mobile-number-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/lucky-vehicle-number-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/mangal-dosha-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/atmakaraka-calculator', priority: '0.7', changefreq: 'monthly' },
  
  // Other pages
  { path: '/panchang', priority: '0.8', changefreq: 'daily' },
  { path: '/numerology', priority: '0.7', changefreq: 'monthly' },
  { path: '/lal-kitab', priority: '0.7', changefreq: 'monthly' },
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

// Generate XML
const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
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
console.log(`✅ Sitemap generated: public/sitemap.xml (${allRoutes.length} URLs)`);

// Write to dist if it exists (for production build)
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(distPath, xml, 'utf-8');
  console.log(`✅ Sitemap generated: dist/sitemap.xml (${allRoutes.length} URLs)`);
}
