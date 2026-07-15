/**
 * Meta Tag Injector Middleware
 *
 * Detects bot/crawler user-agents (WhatsApp, Facebook, Twitter, Slack, etc.)
 * and serves index.html with dynamic meta tags fetched from the CMS API.
 * Regular browser requests pass through untouched (SPA handles its own meta).
 *
 * Flow:
 *   1. Check if request is from a bot (user-agent match)
 *   2. If bot: fetch meta data from CMS API using the URL slug
 *   3. Replace default meta tag values in index.html template
 *   4. Return modified HTML
 *   5. If not bot: pass through to next middleware (serve static SPA)
 */

import fs from "node:fs";
import path from "node:path";
import { DIST_PATH as configDistPath } from "./config.js";

const env = process.env;

// Backend API base URL for fetching CMS meta data
const CMS_API_BASE = env.SGW_MAIN_TARGET || "https://devapi-shubhtalk.epicon.in";

// Path to the built frontend index.html
const DIST_PATH = path.resolve(configDistPath);

// Bot user-agent patterns
const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
  "Applebot",
  "PinterestBot",
  "redditbot",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "outbrain",
  "vkShare",
  "W3C_Validator",
  "Iframely",
];

// API route prefixes that should never be intercepted
const API_PREFIXES = ["/main", "/vedic", "/chart", "/voice", "/__sgw", "/assets"];

// Static file extensions to skip
const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp3|mp4|webm|json|xml|txt|map)$/i;

/**
 * Check if the user-agent belongs to a bot/crawler.
 */
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

/**
 * Fetch CMS meta data for a given slug from the backend.
 */
async function fetchCmsMeta(slug) {
  try {
    const url = `${CMS_API_BASE}/api/static-pages?slug=${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000), // 3s timeout
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/**
 * Replace meta tag content in HTML string.
 */
function replaceMeta(html, { title, description, keywords, image, url }) {
  const siteImage = "https://www.shubhastro.ai/images/shubhastro-logo-banner.jpeg";
  const ogImage = image || siteImage;

  if (title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,`$1${escapeAttr(title)}$2`);
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,`$1${escapeAttr(title)}$2`);
  }

  if (description) {
    html = html.replace(/(<meta name="description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
    html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
    html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${escapeAttr(description)}$2`);
  }

  if (keywords) {
    html = html.replace(/(<meta name="keywords" content=")[^"]*(")/,`$1${escapeAttr(keywords)}$2`);
  }

  if (ogImage) {
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/,`$1${escapeAttr(ogImage)}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/,`$1${escapeAttr(ogImage)}$2`);
  }

  if (url) {
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,`$1${escapeAttr(url)}$2`);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/,`$1${escapeAttr(url)}$2`);
  }

  return html;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Express middleware for meta tag injection.
 * Mount BEFORE static file serving.
 */
export function metaInjectorMiddleware(req, res, next) {
  // Skip non-GET requests
  if (req.method !== "GET") return next();

  // Skip API routes and static files
  const pathname = req.path || req.url;
  if (API_PREFIXES.some((p) => pathname.startsWith(p))) return next();
  if (STATIC_EXT.test(pathname)) return next();

  // Skip if not a bot
  const userAgent = req.headers["user-agent"] || "";
  if (!isBot(userAgent)) return next();

  // Bot detected — serve index.html with dynamic meta
  console.log(`[meta-injector] Bot detected: "${userAgent.slice(0, 80)}" → ${pathname}`);
  handleBotRequest(req, res, pathname);
}

async function handleBotRequest(req, res, pathname) {
  // Read index.html template
  const indexPath = path.join(DIST_PATH, "index.html");
  let html;
  try {
    html = fs.readFileSync(indexPath, "utf-8");
  } catch {
    // If dist doesn't exist yet, pass through
    return res.status(404).send("Not found");
  }

  // Derive slug from pathname
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "") || "";
  const fullUrl = `https://www.shubhastro.ai${pathname}`;

  // Fetch CMS meta data
  const pageData = slug ? await fetchCmsMeta(slug) : null;

  if (pageData) {
    const title = pageData.meta_title || pageData.title || "";
    const description = pageData.meta_description || pageData.title || "";
    const keywords = pageData.meta_tags
      ? Array.isArray(pageData.meta_tags)
        ? pageData.meta_tags.join(", ")
        : pageData.meta_tags
      : "";

    html = replaceMeta(html, {
      title,
      description,
      keywords,
      url: fullUrl,
    });
  } else {
    // At minimum, update the canonical/og:url to the actual page URL
    html = replaceMeta(html, { url: fullUrl });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300"); // 5min cache for bots
  res.send(html);
}
