import { privateRequestNew } from "./privateRequestNew";
import { isEncryptedEnvelope } from "../../utils/security/cryptoClient";

// The slug this endpoint falls back to when called with no argument.
export const DEFAULT_HOME_SLUG = "newcustomerlandingpage";

/*
 * How many CMS sections the landing page asks for per request.
 *
 * The full `newcustomerlandingpage` payload is ~87 KB and HomeV2 renders nothing
 * until it lands, so every section — including the ones far below the fold —
 * sits on the critical path. Requesting the first slice only shortens that wait;
 * HomeV2 then pulls the rest once the browser is idle and appends them.
 *
 * Must stay in step with the inline prefetch in index.html, which sends the same
 * pageNo/limit pair: `consumeHomepagePrefetch` refuses a handle whose limit does
 * not match, so a drift here costs one wasted request rather than a wrong page.
 *
 * Sized to cover the whole hero family (complementary-services,
 * ai-powered-astrology, muharat-widget, ai-services) in page 1 — those four are
 * the top of the CMS order and hold the <h1> and the LCP candidate, so they must
 * not arrive in a later page.
 */
export const HOME_SECTIONS_PAGE_SIZE = 5;

/*
 * Upper bound on the number of pages HomeV2 will walk. Only a stop-loss: a
 * backend that ignores pageNo would otherwise be polled until it ran out of
 * sections, which it never would.
 */
export const HOME_SECTIONS_MAX_PAGES = 12;

/*
 * Argument that opts a caller into the paginated first page.
 *
 * Pagination is opt-in rather than implied by the slug because other screens
 * read the same slug expecting the complete list — /home-new picks sections out
 * of it by slug ("blog", "discover-more", "popular-astrologers"), several of
 * which fall outside page 1, and it has no follow-up fetch to recover them.
 * Only HomeV2 knows how to page, so only HomeV2 asks for a page.
 *
 * A module-level constant so the reference is stable across renders.
 */
export const HOME_FIRST_PAGE_ARG = Object.freeze({
  slug: DEFAULT_HOME_SLUG,
  paginated: true,
});

/*
 * Accepts either a bare slug string (every existing caller) or
 * `{ slug, paginated }`. Both collapse to the same cache key — see the
 * serializeQueryArgs note on the endpoint.
 */
const normalizeHomeArgs = (arg) => {
  if (arg && typeof arg === "object") {
    return { slug: arg.slug || DEFAULT_HOME_SLUG, paginated: arg.paginated === true };
  }
  return { slug: arg || DEFAULT_HOME_SLUG, paginated: false };
};

/*
 * Hands back the in-flight `/api/homepage` request started by the inline script
 * in index.html, or null when there isn't one.
 *
 * Why this exists: on the "/" landing the LCP element is the pageblocker banner
 * rendered by HomeIntroPopup, and its URL only exists inside this endpoint's
 * response. That put four requests in series on the LCP path —
 * HTML -> entry JS -> React render -> /api/homepage -> banner image — so the
 * banner could not start downloading until the bundle had been fetched, parsed
 * and mounted. The inline script fires the request during HTML parse instead,
 * which lifts the API round trip out of that chain entirely; this function is
 * how the result gets back into RTK Query so the work isn't duplicated.
 *
 * The prefetch is consumed exactly once (the handle is deleted on read) so a
 * later refetch — after a login, or an invalidation — always goes to the
 * network rather than replaying a stale payload.
 */
const consumeHomepagePrefetch = (slug, limit) => {
  if (typeof window === "undefined") return null;

  const handle = window.__homepagePrefetch__;
  if (!handle || handle.slug !== slug) return null;
  // The inline script requests page 1 at a fixed limit. If that limit ever
  // diverges from HOME_SECTIONS_PAGE_SIZE (a stale cached index.html, or an edit
  // to one file and not the other) the payload is not the page this endpoint is
  // asking for, so leave it and request properly.
  if (handle.limit !== limit) return null;

  delete window.__homepagePrefetch__;
  return handle.promise;
};

export const homeApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getHomeDetails: builder.query({
      query: () => ({
        url: "homepage",
        method: "GET",
        params: {
          slug: "customerlandingpage",
        },
      }),
      providesTags: ["Kundlis"],
    }),
    getAiSuites: builder.query({
      query: () => ({
        url: "homepage",
        method: "GET",
        params: { slug: "ai-suites" },
      }),
    }),
    getNewHomeDetails: builder.query({
      // queryFn rather than query so the request the inline prefetch already
      // started can be adopted. Anything the prefetch didn't cover — a
      // different slug, a logged-in visitor, a rejected fetch — falls straight
      // through to the normal baseQuery, so behaviour is unchanged there.
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const { slug: resolvedSlug, paginated } = normalizeHomeArgs(arg);
        const limit = paginated ? HOME_SECTIONS_PAGE_SIZE : undefined;

        const prefetched = limit ? consumeHomepagePrefetch(resolvedSlug, limit) : null;
        if (prefetched) {
          try {
            const body = await prefetched;
            /*
             * The inline fetch is a bare GET, so it carries no `x-sgw-sid` and
             * cannot decrypt a secure-gateway envelope. This endpoint's host is
             * hit directly and answers in plaintext today, but if it is ever
             * moved behind the gateway the prefetch would hand back a sealed
             * envelope. Discarding it here means that change degrades to one
             * wasted request instead of a broken homepage.
             */
            if (!isEncryptedEnvelope(body)) return { data: body };
          } catch {
            // Prefetch is best effort: on failure just request it normally so
            // the endpoint's own error handling and retries still apply.
          }
        }

        return baseQuery({
          url: "homepage",
          method: "GET",
          params: limit
            ? { slug: resolvedSlug, pageNo: 1, limit }
            : { slug: resolvedSlug },
        });
      },
      /*
       * queryFn collapses a missing slug to DEFAULT_HOME_SLUG, but RTK Query keys
       * the cache on the raw argument, so calling this with `undefined` and with
       * "newcustomerlandingpage" produced two cache entries for one identical
       * URL — and therefore two 105 KB requests on the homepage. Worse, they ran
       * back to back rather than in parallel (HomeIntroPopup mounts as a child of
       * HomeV2), so the popup banner that is the page's LCP element could not
       * start loading until the second copy finished. Normalising the key here
       * merges those two callers while keeping genuinely different slugs
       * (e.g. "complimentary-service") on their own cache entries.
       *
       * `paginated` is deliberately left out of the key for the same reason, so
       * HomeV2's paginated request and HomeIntroPopup's plain one stay a single
       * request. The first subscriber's argument is the one that runs, and on "/"
       * that is HomeV2 (the popup mounts as its child). If that order ever
       * inverted the page would fetch the full list — slower, but correct.
       */
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${normalizeHomeArgs(queryArgs).slug})`,
    }),
    /*
     * Pages 2..n of the landing page's section list.
     *
     * Kept as its own endpoint rather than folding pageNo into
     * getNewHomeDetails, because that endpoint deliberately normalises its cache
     * key down to the slug alone (see the note above) so HomeV2 and
     * HomeIntroPopup share one request. Adding a page to that key would either
     * split them apart again or require merge/forceRefetch, and forceRefetch on
     * a shared key refetches page 1 whenever a second subscriber mounts —
     * throwing away everything already accumulated.
     *
     * A separate endpoint gives each page its own cache entry, leaves page 1 and
     * its prefetch adoption untouched, and keeps `isLoading` on the blocking
     * query tied to page 1 only, so later pages can never re-gate the render.
     */
    getNewHomeSections: builder.query({
      query: ({ slug, pageNo, limit } = {}) => ({
        url: "homepage",
        method: "GET",
        params: {
          slug: slug || DEFAULT_HOME_SLUG,
          pageNo: pageNo || 1,
          limit: limit || HOME_SECTIONS_PAGE_SIZE,
        },
      }),
    }),
  }),
});

export const {
  useGetHomeDetailsQuery,
  useGetAiSuitesQuery,
  useGetNewHomeDetailsQuery,
  useLazyGetNewHomeSectionsQuery,
} = homeApi;
