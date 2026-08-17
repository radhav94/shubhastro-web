import { vedicApi } from "../baseApi/vedicApi";
import { getCurrentLang } from "../../../utils/VedicParams.js/vedicParams";
import { readDayCache, writeDayCache } from "../../../utils/helper/vedicDayCache";

/**
 * Panchang output (rahukaal, gulika, yamakanta, abhijit muhurta, sunrise/sunset,
 * tithi, nakshatra) is a function of the DATE + LOCATION, not the exact minute.
 *
 * Callers build their payload from `new Date()` including `min`, which produced a
 * unique RTK Query cache key every single minute — up to 1440 distinct upstream
 * calls per day per location, per visitor. Normalising to the top of the hour
 * collapses that to at most 24, without changing what the user sees.
 */
const normalizePanchangArgs = (formData = {}) => ({
  day: formData.day,
  month: formData.month,
  year: formData.year,
  hour: formData.hour ?? "00",
  min: "00",
  lat: formData.lat,
  lon: formData.lon,
  tzone: formData.tzone ?? 5.5,
});

export const panchangApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchAdvancePanchang: builder.query({
      // queryFn rather than query so the response can be served from (and written
      // to) a day-scoped localStorage cache. RTK Query's own cache is in-memory,
      // so without this every page load re-hit the metered VedicAstro upstream —
      // and this endpoint renders on the homepage for every visitor.
      queryFn: async (formData, _api, _extraOptions, baseQuery) => {
        const args = normalizePanchangArgs(formData);
        const lang = getCurrentLang();
        const cacheParts = { ...args, lang };

        const cached = readDayCache("panchang", cacheParts);
        if (cached) return { data: cached };

        const result = await baseQuery({
          url: "panchang/panchang",
          params: {
            date: `${args.day}/${args.month}/${args.year}`, // DD/MM/YYYY
            time: `${args.hour}:${args.min}`, // HH:MM
            lat: args.lat,
            lon: args.lon,
            tz: 5.5, // Default timezone
            lang,
          },
        });

        if (result.error) return { error: result.error };

        writeDayCache("panchang", cacheParts, result.data);
        return { data: result.data };
      },
      // Collapse minute-level noise so all callers within the same hour and
      // location share one cache entry (and therefore one upstream hit).
      // `lang` is read from localStorage inside the query fn rather than passed
      // as an arg, so it has to be folded into the key explicitly.
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${JSON.stringify({
          ...normalizePanchangArgs(queryArgs),
          lang: getCurrentLang(),
        })})`,
    }),
  }),
});

export const { useFetchAdvancePanchangQuery } = panchangApi;
