/**
 * TEMPORARY WORKAROUND — remove once CloudFront is fixed.
 * ============================================================================
 *
 * The CloudFront behaviour for /sgw/* has a Minimum TTL above 0. Per AWS, that
 * makes CloudFront cache the response "even if the response has no-cache,
 * no-store, or private directives" — so the `no-store` the gateway already sends
 * (secure-gateway/src/proxy.js) is ignored, and the ETag stripping doesn't help
 * either. Worse, the cache key omits the query string, so two different
 * pageNo values share one cached object.
 *
 * Measured on production, same session, four sequential requests:
 *
 *     pageNo=1  Miss  ->  complementary-services
 *     pageNo=2  Miss  ->  our-astrologers
 *     pageNo=3  Hit   ->  our-astrologers   (page 2's body)
 *     pageNo=4  Hit   ->  our-astrologers   (page 2's body)
 *
 * And with a second, fresh visitor every response was a Hit carrying the first
 * visitor's AES-GCM envelope, which their session key cannot decrypt. So this is
 * not only a pagination bug: any cached /sgw GET is undecryptable ciphertext for
 * the next visitor.
 *
 * Until the distribution is corrected, every gateway GET carries a unique
 * parameter so no two requests can collide on a cache key.
 *
 * THE REAL FIX, which makes this file deletable:
 *   CloudFront -> distribution for www.shubhastro.ai -> Behaviors -> /sgw/*
 *     Cache policy          = CachingDisabled   (Min/Default/Max TTL all 0)
 *     Origin request policy = AllViewer
 *   then: aws cloudfront create-invalidation --distribution-id <ID> --paths '/sgw/*'
 *
 * To disable this workaround, set SGW_CACHE_BUSTER_ENABLED to false below and
 * rebuild. Delete the file and its two call sites once CloudFront is sorted.
 */

// Single switch. Flip to false to turn the workaround off without unpicking the
// call sites.
export const SGW_CACHE_BUSTER_ENABLED = true;

/*
 * Parameter name. Deliberately prefixed and unlikely to collide with anything a
 * backend reads. Upstreams behind the gateway (/main, /chart, /vedic, /voice)
 * ignore query parameters they don't recognise.
 */
export const SGW_CACHE_BUSTER_PARAM = "_sgwcb";

/*
 * Only GET/HEAD need this. CloudFront caches responses to GET, HEAD and
 * (optionally) OPTIONS and never to POST/PUT/PATCH/DELETE, so adding a nonce to
 * a mutation would be pure noise in the access logs — and would change the body
 * of nothing while still altering the URL a backend might log or sign.
 */
const CACHE_BUSTABLE = new Set(["GET", "HEAD"]);

export const isCacheBustableMethod = (method) =>
  CACHE_BUSTABLE.has(String(method || "GET").toUpperCase());

/*
 * Unique per call. Time component keeps values roughly ordered in logs, random
 * suffix covers same-millisecond bursts (the homepage fires several section
 * pages in quick succession).
 */
export const sgwCacheBusterValue = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
