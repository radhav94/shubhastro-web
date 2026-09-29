/**
 * Server-side meta injection for astrologer profile pages.
 *
 * Why this exists
 * ---------------
 * The SPA already sets per-astrologer meta tags at runtime (SeoHelmet ->
 * utils/updateMeta), and that is enough for Google, which renders JavaScript.
 * It is not enough for the crawlers that do not: WhatsApp, Facebook, X and
 * friends read the HTML as served and never execute a line of it, so every
 * shared astrologer link produced the generic ShubhAstro title, description and
 * banner image.
 *
 * One static index.html cannot carry per-astrologer values, so the HTML for
 * /astrologer/* is produced here instead: fetch the astrologer, rewrite the meta
 * tags that already exist in the shell, serve it. The React app then boots
 * normally and sets the same values again — same strings, so nothing flickers.
 *
 * Deliberately narrow
 * -------------------
 * Only the tags below are touched, and only their `content` (plus <title>). The
 * shell's scripts, preloads and structure are left byte-for-byte alone: this is a
 * string substitution, not a template engine, and nothing here should be able to
 * change how the app loads.
 *
 * Only public profile fields are read from the astrologer payload: metaTitle,
 * metaDescription, metaTags, profileImages, plus (for the SHB-2058 template
 * fallback in astrologerMetaTemplates.js) userName/firstName/lastName,
 * specialties, expertise, languagePreferences and experience. That response
 * also carries the astrologer's phone number, KYC document URLs and earnings;
 * none of it is read and none of it may ever be written into the HTML.
 */

import { readFile } from "node:fs/promises";
import { buildAstrologerMeta } from "./astrologerMetaTemplates.js";

/** Astrologer lookup. `change=true` is required by the endpoint (400 without it). */
const astrologerUrl = (apiBase, param) =>
  `${apiBase.replace(/\/+$/, "")}/api/astrologers/astrologer?astrologerId=${encodeURIComponent(param)}&change=true`;

/**
 * HTML-attribute escaping.
 *
 * These values are admin/astrologer-authored and are being written into markup
 * server-side, so an unescaped quote would break out of the attribute — at best
 * mangling the tag, at worst injecting one. Escaped for attribute AND text
 * context so the same function is safe for <title> too.
 */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clean = (value) => (typeof value === "string" && value.trim() ? value.trim() : "");

/**
 * Pull the four SEO fields out of an astrologer payload.
 * Returns null when the astrologer sent nothing usable — the caller then serves
 * the shell untouched rather than half-filled.
 *
 * @param {Object} astrologer
 * @returns {{title: string, description: string, keywords: string, image: string}|null}
 */
export const extractAstrologerMeta = (astrologer) => {
  if (!astrologer || typeof astrologer !== "object") return null;

  // Admin-authored metaTitle/metaDescription first, generated from the profile
  // otherwise — the same function the SPA uses, so both emit identical strings.
  const { title, description } = buildAstrologerMeta(astrologer);
  const keywords = Array.isArray(astrologer.metaTags)
    ? astrologer.metaTags.filter((t) => typeof t === "string" && t.trim()).join(", ")
    : clean(astrologer.metaTags);

  const images = astrologer.profileImages || {};
  // `large` matches what the SPA passes to SeoHelmet (getAstrologerImageUrl(data,
  // "large")), so the crawler and the app advertise the same image.
  const image = clean(images.large) || clean(images.original) || clean(astrologer.profileImgUrl);

  if (!title && !description && !keywords) return null;

  return { title, description, keywords, image };
};

/**
 * Replace the `content` of a single meta tag, matched by its name/property.
 *
 * Matches the attribute in either order (`<meta name=x content=y>` and
 * `<meta content=y name=x>`) because the shell is hand-maintained and a future
 * edit may reorder them. Leaves the document alone when the tag is absent:
 * updateMeta on the client has the same rule, and creating tags here would let
 * the two drift apart.
 */
const setMetaContent = (html, attr, key, value) => {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withContentAfter = new RegExp(
    `(<meta\\s+[^>]*${attr}=["']${k}["'][^>]*content=["'])([^"']*)(["'])`,
    "i"
  );
  if (withContentAfter.test(html)) {
    return html.replace(withContentAfter, (_m, a, _old, c) => a + escapeHtml(value) + c);
  }
  const withContentBefore = new RegExp(
    `(<meta\\s+[^>]*content=["'])([^"']*)(["'][^>]*${attr}=["']${k}["'])`,
    "i"
  );
  return html.replace(withContentBefore, (_m, a, _old, c) => a + escapeHtml(value) + c);
};

/**
 * Write the astrologer's meta into the SPA shell.
 *
 * @param {string} html - the built index.html
 * @param {Object} meta - from extractAstrologerMeta
 * @param {string} [pageUrl] - absolute URL of this page, for og:url + canonical
 * @returns {string}
 */
export const injectAstrologerMeta = (html, meta, pageUrl) => {
  let out = html;

  if (meta.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
    out = setMetaContent(out, "property", "og:title", meta.title);
    out = setMetaContent(out, "name", "twitter:title", meta.title);
  }

  if (meta.description) {
    out = setMetaContent(out, "name", "description", meta.description);
    out = setMetaContent(out, "property", "og:description", meta.description);
    out = setMetaContent(out, "name", "twitter:description", meta.description);
  }

  if (meta.keywords) {
    out = setMetaContent(out, "name", "keywords", meta.keywords);
  }

  if (meta.image) {
    out = setMetaContent(out, "property", "og:image", meta.image);
    out = setMetaContent(out, "name", "twitter:image", meta.image);
    /*
      The shell declares og:image:width/height 1200x630 for its own banner. The
      astrologer portrait is neither, and wrong dimensions make previews crop
      badly, so the hints are dropped rather than left lying. Scrapers fall back
      to reading the image itself.
    */
    out = out.replace(/\s*<meta\s+property=["']og:image:(?:width|height)["'][^>]*>/gi, "");
    out = setMetaContent(out, "property", "og:image:alt", meta.title || "ShubhAstro astrologer");
    /*
      The shell declares `summary_large_image`, which X renders as a 2:1 banner —
      correct for the site banner it was written for, wrong for a portrait
      headshot (500x624), which gets letterboxed or centre-cropped through the
      face. `summary` shows a square thumbnail beside the text instead.
    */
    out = setMetaContent(out, "name", "twitter:card", "summary");
  }

  if (pageUrl) {
    out = setMetaContent(out, "property", "og:url", pageUrl);
    out = out.replace(
      /(<link\s+[^>]*rel=["']canonical["'][^>]*href=["'])([^"']*)(["'])/i,
      (_m, a, _old, c) => a + escapeHtml(pageUrl) + c
    );
  }

  // og:type: a person's profile, not the site.
  out = setMetaContent(out, "property", "og:type", "profile");

  return out;
};

/**
 * Small TTL cache.
 *
 * A shared link gets hit by several scrapers at once (and by every visitor who
 * opens it), and none of them need a fresh read: this data changes when an admin
 * edits the astrologer. The cache is what keeps this from adding an upstream
 * round trip to every page view — that endpoint was measured at 0.5-4.6s TTFB
 * with no edge caching, so it must not sit in front of the HTML uncached.
 */
const createCache = (ttlMs, maxEntries) => {
  const map = new Map();
  return {
    get(key) {
      const hit = map.get(key);
      if (!hit) return undefined;
      if (Date.now() > hit.expires) {
        map.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      if (map.size >= maxEntries) {
        // Oldest insertion first — Map preserves insertion order.
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
      map.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
};

/**
 * Build the injector used by both the gateway (production) and the Vite dev
 * middleware, so the two cannot drift.
 *
 * @param {Object} options
 * @param {string} options.apiBase - upstream API origin
 * @param {number} [options.ttlMs] - meta cache lifetime
 * @param {number} [options.timeoutMs] - upstream fetch timeout
 * @param {Function} [options.onError] - (context, error) => void
 */
export const createAstrologerSeo = ({
  apiBase,
  ttlMs = 5 * 60 * 1000,
  timeoutMs = 2500,
  maxEntries = 500,
  onError,
} = {}) => {
  const cache = createCache(ttlMs, maxEntries);

  /**
   * `null` for "no meta available" — every failure mode lands here (unknown
   * astrologer, upstream down, timeout, malformed body) and the caller serves the
   * untouched shell. A slow or broken API must degrade to today's behaviour, not
   * to a broken page: the SPA still sets the tags client-side.
   */
  const getMeta = async (param) => {
    if (!param) return null;

    const cached = cache.get(param);
    if (cached !== undefined) return cached;

    /*
      AbortController rather than trusting the upstream: this call now sits in
      front of the HTML, so a hanging API would hang the page itself. Timing out
      costs the crawler its rich preview, which is strictly better than the
      visitor getting nothing.
    */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(astrologerUrl(apiBase, param), {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        cache.set(param, null);
        return null;
      }
      const body = await response.json();
      const meta = extractAstrologerMeta(body?.data);
      cache.set(param, meta);
      return meta;
    } catch (err) {
      if (onError) onError(`astrologer meta fetch failed for "${param}"`, err);
      // Negative result is NOT cached on an error: the next request should retry
      // rather than inherit a transient failure for the whole TTL.
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  /**
   * @param {string} html - SPA shell
   * @param {string} param - the URL segment (userName handle or ObjectId)
   * @param {string} [pageUrl]
   */
  const renderHtml = async (html, param, pageUrl) => {
    const meta = await getMeta(param);
    if (!meta) return html;
    return injectAstrologerMeta(html, meta, pageUrl);
  };

  return { getMeta, renderHtml };
};

/**
 * Read the SPA shell once and keep it, re-reading when the file changes on disk
 * (mtime), so a new deploy is picked up without restarting the gateway.
 */
export const createShellReader = (indexPath) => {
  let cached = null;
  let cachedMtimeMs = 0;

  return async () => {
    const { stat } = await import("node:fs/promises");
    const info = await stat(indexPath);
    if (!cached || info.mtimeMs !== cachedMtimeMs) {
      cached = await readFile(indexPath, "utf8");
      cachedMtimeMs = info.mtimeMs;
    }
    return cached;
  };
};

/**
 * The astrologer profile URL shapes the app serves:
 *   /astrologer/<userName>
 *   /astrologer/<slug>/<objectId>   (fallback for astrologers without a handle)
 *
 * The first segment is what the lookup endpoint accepts in both cases.
 *
 * @param {string} pathname
 * @returns {string|null} the lookup parameter, or null when this is not a profile URL
 */
export const astrologerParamFromPath = (pathname) => {
  const match = String(pathname || "").match(/^\/astrologer\/([^/?#]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};
