import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { getCurrentLang } from "../../../utils/VedicParams.js/vedicParams";

/** "YYYY-MM-DD" (calculator form) -> "DD/MM/YYYY" (Rashi API). */
const toApiDob = (dob) => {
  if (!dob) return "";
  const [year, month, day] = String(dob).split("-");
  return day && month && year ? `${day}/${month}/${year}` : String(dob);
};

export const aiwowApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAiWowPageData: builder.query({
      query: () => ({
        url: "homepage/?slug=ai-suites",
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),

    getAiHistory: builder.query({
      query: ({ kundliId, page = 1, limit = 10 }) => ({
        url: `ai-history?kundliId=${kundliId}&page=${page}&limit=${limit}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
      providesTags: (result, error, { kundliId }) => [
        { type: "AiHistory", id: kundliId },
        "AiHistory",
      ],
      serializeQueryArgs: ({ queryArgs }) => queryArgs.kundliId,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) return newItems;
        // Deduplicate by _id and featureId when merging paginated results
        const existingIds = new Set((currentCache?.data?.history || []).map((h) => h._id));
        const existingFeatureIds = new Set((currentCache?.data?.history || []).filter((h) => h.featureId).map((h) => h.featureId));
        const uniqueNewItems = (newItems?.data?.history || []).filter(
          (h) => !existingIds.has(h._id) && (!h.featureId || !existingFeatureIds.has(h.featureId))
        );
        return {
          ...newItems,
          data: {
            ...newItems.data,
            history: [...(currentCache?.data?.history || []), ...uniqueNewItems],
          },
        };
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
    }),

    getCharges: builder.query({
      query: () => ({
        url: "filters/get-filters/charges",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      keepUnusedDataFor: 300, // cache 5 min — global data, rarely changes
    }),

    getBusinessPathfinderOptions: builder.query({
      query: () => ({
        url: "wow-suite/business-pathfinder/options",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      keepUnusedDataFor: 300,
    }),

    /*
     * Public read of a shared result. No auth: this is what a share link opens,
     * and the visitor is usually neither the owner nor logged in. The backend
     * strips private data (name, DOB, birth place, photo, internal ids) and
     * returns { featureType, data, historyCreatedAt }.
     *
     * Registered in PUBLIC_ENDPOINTS + SILENT_ENDPOINTS in privateRequestNew so
     * a 401 does not bounce a guest to login and the 404 for an unavailable
     * link is rendered inline instead of toasted.
     */
    getSharedAiResult: builder.query({
      query: (historyId) => ({
        url: `ai-history/shared/${historyId}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),

    /*
     * Rashi Calculator report (SHB-2071). Replaces the old astro proxy
     * `extended-horoscope/find-moon-sign`: this endpoint also saves the result
     * to AI history, which is what makes the report downloadable through
     * `ai-history/pdf` like Face Reading / Gemstone / Muhurat. Returns the same
     * moon-sign data (incl. `enriched`) plus the record's `_id`.
     *
     * A query (not a mutation) on purpose: RTK caches it per birth details, so
     * re-renders and remounts of the report do not create duplicate history
     * entries; a different person/date is a different cache entry.
     */
    generateRashiReport: builder.query({
      query: (form = {}) => ({
        url: "companion-suite/rashi-calculator",
        method: "POST",
        // Must be set here: privateRequestNew defaults Content-Type to
        // text/plain, and the server then ignores the JSON body ("dob, tob, lat
        // and lon are required").
        headers: { accept: "application/json", "Content-Type": "application/json" },
        body: form.kundliId
          ? { kundliId: form.kundliId }
          : {
              dob: toApiDob(form.dob),
              tob: form.tob,
              lat: form.lat != null ? String(form.lat) : undefined,
              lon: form.lng != null ? String(form.lng) : undefined,
              tz: 5.5,
              lang: getCurrentLang(),
            },
      }),
      // Keyed on what the report depends on (not name/gender/place text). An
      // object, so RTK still prefixes the endpoint name to the cache key.
      serializeQueryArgs: ({ queryArgs = {} }) => ({
        kundliId: queryArgs.kundliId || null,
        dob: queryArgs.dob,
        tob: queryArgs.tob,
        lat: queryArgs.lat,
        lng: queryArgs.lng,
        lang: getCurrentLang(),
      }),
    }),

    // Fetch PDF URL for a given history item (handles payment deduction server-side)
    downloadReportPdf: builder.mutation({
      query: ({ historyId, language }) => {
        const params = new URLSearchParams({ historyId });
        if (language) params.append("language", language);
        return {
          url: `ai-history/pdf?${params.toString()}`,
          method: "GET",
          headers: { accept: "application/json" },
        };
      },
      invalidatesTags: ["AiHistory"],
    }),
  }),
});

export const {
  useGetAiWowPageDataQuery,
  useGetAiHistoryQuery,
  useGetChargesQuery,
  useLazyGetChargesQuery,
  useGetBusinessPathfinderOptionsQuery,
  useGetSharedAiResultQuery,
  useDownloadReportPdfMutation,
  useGenerateRashiReportQuery,
} = aiwowApi;
