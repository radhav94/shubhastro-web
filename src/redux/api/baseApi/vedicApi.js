// src/redux/api/vedicApi/vedicApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Keep API key configurable (env recommended later)
export const VEDIC_API_KEY = "e19fcd25-34b1-52eb-9c7b-4270f71cbd87";

export const vedicApi = createApi({
  reducerPath: "vedicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.vedicastroapi.com/v3-json/",
  }),
  endpoints: () => ({}),
});
