/**
 * HTML routes that need per-page meta tags in the served markup.
 *
 * Currently astrologer profiles only. Mounted at /__sgw/seo/astrologer/* and
 * fronted by nginx, which rewrites /astrologer/<param> onto it (see
 * nginx-proxy.conf). Keeping it under the /__sgw/ namespace means it cannot
 * collide with a proxied API prefix.
 *
 * Failure policy, in order of preference:
 *   1. shell + astrologer meta          (the point of this route)
 *   2. shell untouched                  (upstream slow/unknown astrologer)
 *   3. 502, so nginx falls back to serving dist/index.html itself
 *      (shell unreadable — see the @spa fallback in the nginx config)
 * The visitor gets a working SPA in all three; only the preview quality differs.
 */

import express from "express";
import {
  createAstrologerSeo,
  createShellReader,
  astrologerParamFromPath,
} from "./astrologerSeo.js";
import {
  SPA_INDEX_PATH,
  SEO_SITE_ORIGIN,
  SEO_CACHE_TTL_MS,
  ROUTES,
} from "./config.js";

const mainTarget = () => ROUTES.find((r) => r.prefix === "/main")?.target || "";

export const seoRouter = () => {
  const router = express.Router();

  if (!SPA_INDEX_PATH) {
    // Not configured — no route is registered at all, so nginx's own fallback
    // serves the shell exactly as it does today.
    // eslint-disable-next-line no-console
    console.log("[sgw] SEO meta injection disabled (set SGW_SPA_INDEX to enable)");
    return router;
  }

  const readShell = createShellReader(SPA_INDEX_PATH);
  const seo = createAstrologerSeo({
    apiBase: mainTarget(),
    ttlMs: SEO_CACHE_TTL_MS,
    onError: (context, err) => {
      // eslint-disable-next-line no-console
      console.warn(`[sgw][seo] ${context}:`, err?.message || err);
    },
  });

  router.get("/__sgw/seo/astrologer/*", async (req, res) => {
    /*
      The path as the VISITOR sees it, rebuilt from the part after the mount
      point. nginx passes /astrologer/gopal through as
      /__sgw/seo/astrologer/gopal, and og:url / canonical must advertise the
      public URL, never the internal one.
    */
    const tail = req.originalUrl
      .replace(/^\/__sgw\/seo\/astrologer/, "/astrologer")
      .split(/[?#]/)[0];
    const param = astrologerParamFromPath(tail);
    const pageUrl = `${SEO_SITE_ORIGIN}${tail}`;

    let shell;
    try {
      shell = await readShell();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[sgw][seo] cannot read ${SPA_INDEX_PATH}:`, err?.message || err);
      // 502 on purpose: nginx is configured to serve the static shell when this
      // route errors, which is a better outcome than an error page.
      res.status(502).end();
      return;
    }

    const html = param ? await seo.renderHtml(shell, param, pageUrl) : shell;

    res.set("Content-Type", "text/html; charset=utf-8");
    /*
      Same caching stance as the shell itself: the HTML references hashed assets
      and is re-rendered per astrologer, so it must not be held by a browser or a
      shared cache. The expensive part (the upstream lookup) is cached in-process
      instead.
    */
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(html);
  });

  return router;
};

export default seoRouter;
