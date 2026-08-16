import { privateRequestNew } from "./privateRequestNew";
import { isEncryptedEnvelope } from "../../utils/security/cryptoClient";

// The slug this endpoint falls back to when called with no argument.
export const DEFAULT_HOME_SLUG = "newcustomerlandingpage";

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
const consumeHomepagePrefetch = (slug) => {
  if (typeof window === "undefined") return null;

  const handle = window.__homepagePrefetch__;
  if (!handle || handle.slug !== slug) return null;

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
      async queryFn(slug, _api, _extraOptions, baseQuery) {
        const resolvedSlug = slug || DEFAULT_HOME_SLUG;

        const prefetched = consumeHomepagePrefetch(resolvedSlug);
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
          params: { slug: resolvedSlug },
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
       */
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${queryArgs || DEFAULT_HOME_SLUG})`,
    }),
  }),
});

export const { useGetHomeDetailsQuery, useGetAiSuitesQuery, useGetNewHomeDetailsQuery } = homeApi;
