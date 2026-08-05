import { baseApi } from "../baseApi/baseApi";
import { vedicApi } from "../baseApi/vedicApi";

export const kundliApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchBirthDetails: builder.query({
      query: ({ payload }) => ({
        url: "birth_details",
        method: "POST",
        body: payload,
      }),
    }),

    getBasicPanchang: builder.query({
      query: ({ payload }) => ({
        url: "basic_panchang",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

/**
 * Response handler for the SVG chart endpoints.
 *
 * The backend serves these as `application/json` whose body is a JSON *string*
 * containing the SVG markup. Because the content type is JSON, the secure
 * gateway encrypts the body into an `{ enc, iv, data }` envelope.
 *
 * These endpoints previously used `responseHandler: "text"`, which returned the
 * envelope as a raw string. `secureBaseQuery` only decrypts values where
 * `typeof value === "object"`, so a string body slipped past decryption
 * untouched — `sanitizeSvg` then found no `<svg>` element in the ciphertext,
 * returned "", and every chart was silently dropped from the render.
 *
 * Parsing the body instead covers both deployments:
 *   - through the gateway: yields the envelope object, which secureBaseQuery
 *     decrypts back into the SVG string,
 *   - direct to the backend: yields the JSON string, i.e. the SVG markup itself.
 *
 * A non-JSON body (an upstream serving `image/svg+xml` directly) falls through
 * to raw text.
 */
const svgResponseHandler = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Chart endpoints must hand `sanitizeSvg` a string, whatever the transport did. */
const toSvgString = (response) => (typeof response === "string" ? response : "");

export const kundliVedicApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getAstroDetails: builder.query({
      query: (params) => ({
        url: "extended-horoscope/extended-kundli-details",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
        },
      }),
    }),

    getChart: builder.query({
      query: ({ chartType, params }) => ({
        url: "horoscope/chart-image",
        method: "GET",
        params: {
          dob: params.dob,
          tob: params.tob,
          tz: params.tz || 5.5,
          div: chartType,
          style: params.style || "north",
          lang: params.lang || "en",
          stroke: 2,
          lat: params.lat,
          lon: params.lon,
          color: "#ff850b3d",
          font_size: 35,
          font_style: "Nunito",
          colorful_planets: true,
          format: "svg", //  IMPORTANT (use svg not base64)
          transit_date: "22/01/2022",
          size: 300,
          show_degree: true,
        },
        responseHandler: svgResponseHandler,
      }),

      transformResponse: toSvgString,
    }),
    getAshtakvargaChart: builder.query({
      query: ({ chartType, params }) => ({
        url: "horoscope/ashtakvarga-chart-image",
        method: "GET",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          style: params.style || "north",
          color: "#ff850b3d",
          planet: chartType,
          size: 300,
          font_size: 35,
          lang: params.lang || "en",
          format: "svg", //  IMPORTANT (use svg not base64)
        },
        responseHandler: svgResponseHandler,
      }),

      transformResponse: toSvgString,
    }),

    getPlanets: builder.query({
      query: (params) => ({
        url: "horoscope/planet-details",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
        },
      }),
    }),

    getKpDetails: builder.query({
      query: (params) => ({
        url: "extended-horoscope/kp-planets",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
        },
      }),
    }),

    getAi12MonthsPrediction: builder.query({
      query: (params) => ({
        url: "horoscope/ai-12-month-prediction",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
        },
      }),
    }),

    getMahaDasha: builder.query({
      query: (params) => ({
        url: "dashas/maha-dasha",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
        },
      }),
    }),

    getAntarDasha: builder.query({
      query: (params) => ({
        url: "dashas/antar-dasha",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
          md: params.md, // Mahadasha planet name
        },
      }),
    }),

    getPratyantarDasha: builder.query({
      query: (params) => ({
        url: "dashas/paryantar-dasha",
        params: {
          dob: params.dob,
          tob: params.tob,
          lat: params.lat,
          lon: params.lon,
          tz: params.tz || 5.5,
          lang: params.lang || "en",
          md: params.md, // Mahadasha planet name
          ad: params.ad, // Antardasha planet name
        },
      }),
    }),
  }),
});

export const { useFetchBirthDetailsQuery, useGetBasicPanchangQuery } =
  kundliApi;
export const {
  useGetAstroDetailsQuery,
  useGetChartQuery,
  useGetAshtakvargaChartQuery,
  useGetPlanetsQuery,
  useGetKpDetailsQuery,
  useGetAi12MonthsPredictionQuery,
  useGetMahaDashaQuery,
  useGetAntarDashaQuery,
  useGetPratyantarDashaQuery,
} = kundliVedicApi;
