import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";
import { BACKEND_PROXY } from "../../../utils/apiConfig";

export const vedicApi = createApi({
  reducerPath: "vedicApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: `${BACKEND_PROXY}/api/astro/v3-json/`,
  }),
  // VedicAstro is a metered upstream (monthly hit quota). Every endpoint here is
  // deterministic: identical params always return identical results, so cache
  // aggressively and never auto-refetch.
  //
  // Default keepUnusedDataFor is 60s, which meant that navigating away from a
  // Kundli/Panchang screen for more than a minute and coming back re-fired the
  // whole set of requests. 1 hour keeps a full browsing session on cache.
  keepUnusedDataFor: 3600,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({}),
});
